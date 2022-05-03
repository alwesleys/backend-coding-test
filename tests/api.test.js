const request = require('supertest');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

const validTestRides = [
    {
        start_lat: 0,
        start_long: 0,
        end_lat: 0,
        end_long: 0,
        rider_name: 'Al Wesley',
        driver_name: 'string',
        driver_vehicle: 'string'
    },
    {
        start_lat: 0,
        start_long: 0,
        end_lat: 0,
        end_long: 0,
        rider_name: 'Wes',
        driver_name: 'string',
        driver_vehicle: 'string'
    }
];

const invalidTestRides = [
    {
        start_lat: 91, // invalid starting lattitude
        start_long: 0,
        end_lat: 0,
        end_long: 0,
        rider_name: 'Al Wesley',
        driver_name: 'string',
        driver_vehicle: 'string'
    },
    {
        start_lat: 0,
        start_long: 0,
        end_lat: 91, // invalid ending lattitude
        end_long: 0,
        rider_name: 'Al Wesley',
        driver_name: 'string',
        driver_vehicle: 'string'
    },
    {
        start_lat: 0,
        start_long: 0,
        end_lat: 0,
        end_long: 0,
        rider_name: '', // invalid rider name
        driver_name: 'string',
        driver_vehicle: 'string'
    },
    {
        start_lat: 0,
        start_long: 0,
        end_lat: 0,
        end_long: 0,
        rider_name: 'Al Wesley',
        driver_name: '', // invalid driver name
        driver_vehicle: 'string'
    },
    {
        start_lat: 0,
        start_long: 0,
        end_lat: 0,
        end_long: 0,
        rider_name: 'Al Wesley',
        driver_name: 'string',
        driver_vehicle: '' // invalid vehicle name
    },
];

describe('API tests', () => {
    before((done) => {
        db.serialize((err) => {
            if (err) {
                return done(err);
            }

            buildSchemas(db);

            return done();
        });
    });

    describe('GET /health', () => {
        it('should return health', (done) => {
            request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(200, done);
        });
    });

    // covers the no record query
    describe('GET /rides', () => {
        it('should return an error for no rides', (done) => {
            request(app)
                .get('/rides')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });
    });

    // covers validation error based on the invalidTestRides/input
    invalidTestRides.forEach((ride, index) => {
        describe(`POST /rides - ${index + 1} invalid test`, () => {
            it('should return a validation error', (done) => {
                request(app)
                    .post('/rides')
                    .send(ride)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then((res) => {
                        if (res.body.error_code === 'VALIDATION_ERROR') return done();
                        throw Error('POST error: VALIDATION_ERROR not triggered');
                    })
                    .catch((err) => done(err));
            });
        });
    });

    // covers posting valid rides
    validTestRides.forEach((ride, index) => {
        describe(`POST /rides - ${index + 1}`, () => {
            it('should return inserted ride', (done) => {
                request(app)
                    .post('/rides')
                    .send(ride)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then((res) => {
                        if (res.body[0].riderName === ride.rider_name) return done();
                        throw Error('POST error: Incorrect returned record');
                    })
                    .catch((err) => done(err));
            });
        });
    });

    // covers getting the inserted records of the test
    describe('GET /rides', () => {
        it('should return list of rides', (done) => {
            request(app)
                .get('/rides')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });
    });

    // covers getting the inserted record based on the id
    validTestRides.forEach((ride, index) => {
        describe(`GET /rides/${index + 1}`, () => {
            it('should return specific ride', (done) => {
                request(app)
                    .get(`/rides/${index + 1}`)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then((res) => {
                        if (res.body[0].riderName === ride.rider_name) return done();
                        throw Error('GET error: Incorrect returned record');
                    })
                    .catch((err) => done(err));
            });
        });
    });

    // covers rides not found error
    describe('GET /rides/999', () => {
        it('should return specific ride', (done) => {
            request(app)
                .get('/rides/999')
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res) => {
                    if (res.body.error_code === 'RIDES_NOT_FOUND_ERROR') return done();
                    throw Error('GET error: RIDES_NOT_FOUND_ERROR not triggered');
                })
                .catch((err) => done(err));
        });
    });
});
