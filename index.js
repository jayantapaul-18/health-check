const express = require("express");
const http = require("http");
const originalRequest = http.request;
const axios = require("axios");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const pino = require("pino-http")();
const mysql = require("mysql2/promise");
const { networkInterfaces } = require("os");
const process = require("node:process");
const SERVER_PORT = 3005;
const { TARGET_HEALTH_CHECK_URL } = require("./config");
const winston = require("winston");
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "app.log" }),
  ],
});
// const swaggerUi = require('swagger-ui-express');
// const swaggerDocument = require('./swagger.json');

const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
    const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
    if (net.family === familyV4Value && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
    }
  }
}
const localIP = results.en0[0];
console.log(localIP);

/* Configure Express App */
const app = express();
const port = process.env.PORT || SERVER_PORT;
// app.use(pino);
app.use(helmet());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// http.request = function (options, callback) {
//   if (options.host == undefined) {
//     logger.info(`${options.method} ${localIP}:${options.port}${options.path}`);
//   } else {
//     logger.info(`${options.method} ${options.host}:${options.port}${options.path}`);
//   }
//   return originalRequest.call(this, options, callback);
// };

const dbConfig = {
  host: "your-db-hostname",
  user: "your-db-username",
  password: "your-db-password",
  database: "your-db-name",
  port: 3306,
};

// Health-API
/* Response time in ms , Total uptime , downtime in ms   */
app.get("/health", async (req, res) => {
  const healthStatus = [];

  if (req.query.tls == 0) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  } else {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
  }

  for (const eachTargetUrl of TARGET_HEALTH_CHECK_URL) {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${eachTargetUrl.url}`);
      const endTime = Date.now();
      const uptime = endTime - startTime;
      const isUp = response.status === 200;

      const result = {
        i: "✅",
        name: eachTargetUrl.name,
        status: "OK",
        uptime: uptime,
      };
      healthStatus.push(result);
    } catch (err) {
      const errorEndTime = Date.now();
      const downTime = errorEndTime - startTime;
      healthStatus[eachTargetUrl.name] = err.message;
      const result = {
        i: "❌",
        name: eachTargetUrl.name,
        status: "Error:" + err.message,
        downTime: downTime,
      };
      healthStatus.push(result);
    }
  }

  const Timestamp = new Date();
  const isHealthy = healthStatus.every((result) => result.status === "OK");
  const node_tls_reject_unauthorize =
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"];
  res
    .status(isHealthy ? 200 : 206)
    .json({
      isHealthy,
      node_tls_reject_unauthorize,
      timeStamp: Timestamp,
      healthStatus,
    });
});

/* DB Health Check  */
app.get("/db/health", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.query("SELECT 1");
    await connection.end();
    res.status(200).json({ status: "OK" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "Error" });
  }
});

process.on("beforeExit", (code) => {
  console.log("Process beforeExit event with code: ", code);
});
process.on("exit", (code) => {
  logger.info(`Exit code: ${code}`);
});
/* Configure Express Server */
app.listen(port, () => {
  console.log(`Health check API listening at http://localhost:${port}/health`);
});
