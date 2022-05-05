const express = require('express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const bodyParser = require('body-parser');

const rides = require('./rides');

const app = express();
const jsonParser = bodyParser.json();

const opts = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Rides API',
            version: '1.0.0',
            description: 'An API to store and maintain rides.',
        },
        servers: [
            {
                url: 'http://localhost:8010',
            },
        ],
    },
    apis: ['./src/rides.js'],
};

const specs = swaggerJsDoc(opts);
module.exports = () => {
    app.use('/docs', swaggerUI.serve, swaggerUI.setup(specs));

    app.get('/health', (req, res) => res.send('Healthy'));
    app.get('/rides', rides.listAll);
    app.get('/rides/:id', rides.getByID);
    app.post('/rides', jsonParser, rides.add);

    return app;
};
