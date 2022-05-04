const express = require('express');
const bodyParser = require('body-parser');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const logger = require('./logger');

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
    apis: ['./src/app.js'],
};

const specs = swaggerJsDoc(opts);
module.exports = (db) => {
    app.use('/docs', swaggerUI.serve, swaggerUI.setup(specs));

    app.get('/health', (req, res) => res.send('Healthy'));

    app.post('/rides', jsonParser, (req, res) => {
        const startLatitude = Number(req.body.start_lat);
        const startLongitude = Number(req.body.start_long);
        const endLatitude = Number(req.body.end_lat);
        const endLongitude = Number(req.body.end_long);
        const riderName = req.body.rider_name;
        const driverName = req.body.driver_name;
        const driverVehicle = req.body.driver_vehicle;

        const values = [
            req.body.start_lat,
            req.body.start_long,
            req.body.end_lat,
            req.body.end_long,
            req.body.rider_name,
            req.body.driver_name,
            req.body.driver_vehicle
        ];

        if (startLatitude < -90 || startLatitude > 90
            || startLongitude < -180 || startLongitude > 180) {
            logger.error('[VALIDATION_ERROR] invalid starting location');
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (endLatitude < -90 || endLatitude > 90
            || endLongitude < -180 || endLongitude > 180) {
            logger.error('[VALIDATION_ERROR] invalid ending location');
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (typeof riderName !== 'string' || riderName.length < 1) {
            logger.error('[VALIDATION_ERROR] empty rider name');
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (typeof driverName !== 'string' || driverName.length < 1) {
            logger.error('[VALIDATION_ERROR] empty driver name');
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Driver name must be a non empty string'
            });
        }

        if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
            logger.error('[VALIDATION_ERROR] empty vehicle name');
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Vehicle name must be a non empty string'
            });
        }

        return db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values, function (errIns) {
            if (errIns) {
                logger.error('[SERVER_ERROR] Unknown error');
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            return db.all('SELECT * FROM Rides WHERE rideID = ?', this.lastID, (errSel, rows) => {
                if (errSel) {
                    logger.error('[SERVER_ERROR] Unknown error');
                    return res.send({
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown error'
                    });
                }

                return res.send(rows);
            });
        });
    });

    app.get('/rides', (req, res) => {
        const page = parseInt(req.query.page, 10);
        const size = parseInt(req.query.per_page, 10);
        let sql;

        if (Object.keys(req.query).length > 0) {
            if (page <= 0 || size <= 0 || Number.isNaN(page) || Number.isNaN(size)) {
                logger.error('[QUERY_ERROR] Invalid query provided in URL');
                return res.send({
                    error_code: 'QUERY_ERROR',
                    message: 'Invalid page / per_page, should both starts with 1'
                });
            }

            const query = {
                skip: size * (page - 1),
                limit: size
            };

            sql = `SELECT * FROM Rides LIMIT ${query.skip}, ${query.limit}`;
        } else { sql = 'SELECT * FROM Rides'; }

        return db.all(sql, (err, rows) => {
            if (err) {
                logger.error('[SERVER_ERROR] Unknown error');
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            if (rows.length === 0) {
                logger.error('[RIDES_NOT_FOUND_ERROR] Rides table is empty');
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }

            return res.send(rows);
        });
    });

    app.get('/rides/:id', (req, res) => {
        db.all(`SELECT * FROM Rides WHERE rideID='${req.params.id}'`, (err, rows) => {
            if (err) {
                logger.error('[SERVER_ERROR] Unknown error');
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            if (rows.length === 0) {
                logger.error(`[RIDES_NOT_FOUND_ERROR] record for rideID '${req.params.id}' doesn't exist`);
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }

            return res.send(rows);
        });
    });

    return app;
};

/**
 * @swagger
 * components:
 *   schemas:
 *      RideGet:
 *          type: object
 *          properties:
 *              riderID:
 *                  type: integer
 *                  description: auto generated unique id
 *              startLat:
 *                  type: number
 *                  description: starting lattitude
 *              startLong:
 *                  type: number
 *                  description: starting longitude
 *              endLat:
 *                  type: number
 *                  description: ending lattitude
 *              endLong:
 *                  type: number
 *                  description: ending longitude
 *              riderName:
 *                  type: string
 *                  description: name of the rider
 *              driverName:
 *                  type: string
 *                  description: name of the driver
 *              driverVehicle:
 *                  type: string
 *                  description: vehicle used
 *              created:
 *                  type: string
 *                  format: date-time
 *                  description: time the ride was created
 *      RidePost:
 *          type: object
 *          required:
 *              - start_lat
 *              - start_long
 *              - end_lat
 *              - end_long
 *              - rider_name
 *              - driver_name
 *              - driver_vehicle
 *          properties:
 *              start_lat:
 *                  type: number
 *                  description: starting lattitude (Must be a value from -90 to 90)
 *              start_long:
 *                  type: number
 *                  description: starting longitude (Must be a value from -180 to 180)
 *              end_lat:
 *                  type: number
 *                  description: ending lattitude (Must be a value from -90 to 90)
 *              end_long:
 *                  type: number
 *                  description: ending longitude (Must be a value from -180 to 180)
 *              rider_name:
 *                  type: string
 *                  description: name of the rider
 *              driver_name:
 *                  type: string
 *                  description: name of the driver
 *              driver_vehicle:
 *                  type: string
 *                  description: vehicle used
 */

/**
 * @swagger
 * tags:
 *  name: Rides
 *  description: The Rides API
 */

/**
 * @swagger
 * /rides:
 *  get:
 *      summary: Returns the list of all the rides
 *      tags: [Rides]
 *      responses:
 *          200:
 *              description: list of the rides
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#/components/schemas/RideGet'
 */

/**
 * @swagger
 * /rides/{id}:
 *  get:
 *      summary: Return ride by id
 *      tags: [Rides]
 *      parameters:
 *          -   in: path
 *              name: id
 *              schema:
 *                  type: string
 *              required: true
 *              description: The ride id
 *      responses:
 *          200:
 *              description: The details of the ride
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/RideGet'
 */

/**
 * @swagger
 * /rides?page={pageNum}&per_page={pageSize}:
 *  get:
 *      summary: Returns a paginated list of rides
 *      tags: [Rides]
 *      parameters:
 *          -   in: path
 *              name: pageNum
 *              schema:
 *                  type: string
 *              required: true
 *              description: The page to be displayed (must be greater than zero)
 *          -   in: path
 *              name: pageSize
 *              schema:
 *                  type: string
 *              required: true
 *              description: The number of rides per page (must be greater than zero)
 *      responses:
 *          200:
 *              description: The list of rides in the specified page
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#/components/schemas/RideGet'
 */

/**
 * @swagger
 * /rides:
 *  post:
 *      summary: Enter a new ride
 *      tags: [Rides]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/RidePost'
 *      responses:
 *          200:
 *              description: The details of the ride are inserted
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/RideGet'
 */
