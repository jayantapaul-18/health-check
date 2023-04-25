const express = require('express');
const axios = require('axios');
const helmet = require("helmet");
const bodyParser = require('body-parser');
const pino = require('pino-http')();
const mysql = require('mysql2/promise');

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
