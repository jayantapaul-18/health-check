const express = require('express');
const http = require('http');
const originalRequest = http.request;
const axios = require('axios');
const helmet = require("helmet");
const bodyParser = require('body-parser');
const pino = require('pino-http')();
const mysql = require('mysql2/promise');
const { networkInterfaces } = require('os');
const winston = require('winston');
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});


const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
        if (net.family === familyV4Value && !net.internal) {
            if (!results[name]) {
                results[name] = [];
            }
            results[name].push(net.address);
        }
    }
}
const localIP = results.en0[0]
console.log(localIP);
// const swaggerUi = require('swagger-ui-express');
// const swaggerDocument = require('./swagger.json');
// const docx = require("docx")
// const expressAdmin = require("@runkit/runkit/express-endpoint/1.0.0");
// const admin = expressAdmin(exports);
// const { Document, Packer, Paragraph, TextRun } = docx;


/* Configure Express App */
const app = express();
const port = process.env.PORT || 3005;
// app.use(pino);
app.use(helmet());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

http.request = function (options, callback) {
  if (options.host == undefined) {
    logger.info(`${options.method} ${localIP}:${options.port}${options.path}`);
  } else {
    logger.info(`${options.method} ${options.host}:${options.port}${options.path}`);
  }
  return originalRequest.call(this, options, callback);
};
process.on('exit', (code) => {
  logger.info(`Exit code: ${code}`);
});

const dbConfig = {
    host: 'your-db-hostname',
    user: 'your-db-username',
    password: 'your-db-password',
    database: 'your-db-name',
    port: 3306
};

/* Configure Backend API Health Check  */
const backendDependencies = [
    { name: 'API 1', url: 'http://localhost:4000' },
    { name: 'API 2', url: 'http://localhost:5000' },
    { name: 'API 3', url: 'http://localhost:6000' },
    { name: 'Database', url: 'http://localhost:3306' },
    { name: 'backend', url: 'https://geniushubbd.com/node'}
];

// Health-API
app.get('/health', async (req, res) => {
  const healthStatus = [];

  for (const dependency of backendDependencies) {
    try {
        const response = await axios.get(`${dependency.url}`);
        const result = { name: dependency.name, status: "OK"};
        // console.log(response.data);
        healthStatus.push(result);
        // healthStatus[dependency.name] = response.data.status;
    } catch (err) {
        healthStatus[dependency.name] = (err.message);
        const result = { name: dependency.name, status: 'Error:'+err.message };
        healthStatus.push(result);
    }
  }

const isHealthy = healthStatus.every(result => result.status === 'OK');

res.status(isHealthy ? 200 : 500).json({ isHealthy, healthStatus });
});
  //const overallStatus = Object.values(healthStatus).every(status => status === 'OK') ? 'OK' : 'Error';
  // status: overallStatus,
//   res.json({ dependencies: healthStatus });
// });


app.get('/db/health', async (req, res) => {
    try {
      const connection = await mysql.createConnection(dbConfig);
      await connection.query('SELECT 1');
      await connection.end();
      res.status(200).json({ status: 'OK' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'Error' });
    }
  });



// app.get("/", async (req, res) => {
//     const doc = new Document({
//         sections: [{
//             properties: {},
//             children: [
//                 new Paragraph({
//                     children: [
//                         new TextRun("Hello World"),
//                         new TextRun({
//                             text: "Foo Bar",
//                             bold: true,
//                         }),
//                         new TextRun({
//                             text: "\tGithub is the best",
//                             bold: true,
//                         }),
//                     ],
//                 }),
//             ],
//         }],
//     });

//     const b64string = await Packer.toBase64String(doc);

//     res.setHeader('Content-Disposition', 'attachment; filename=My Document.docx');
//     res.send(Buffer.from(b64string, 'base64'));
// });


/* Configure Express Server */
app.listen(port, () => {
  console.log(`Health check API listening at http://localhost:${port}/health`);
});
