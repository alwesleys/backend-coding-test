const request = require('supertest');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

// modify for custom valid tests
const validRideOpts = {
    // total rides to be inserted by the test
    totalRides: 12,
    // valid data that will be inserted
    ride: {
        start_lat: 0,
        start_long: 0,
        end_lat: 0,
        end_long: 0,
        rider_name: 'Al Wesley',
        driver_name: 'string',
        driver_vehicle: 'string'
    },
    // valid page and custom size per page
    page: 2,
    pageSize: 10,
};

// collection of invalid scenarios
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
    for (let i = 0; i < validRideOpts.totalRides; i++) {
        describe(`POST /rides - ${i + 1}`, () => {
            it('should return inserted ride', (done) => {
                request(app)
                    .post('/rides')
                    .send(validRideOpts.ride)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then((res) => {
                        if (res.body[0].riderName === validRideOpts.ride.rider_name) return done();
                        throw Error('POST error: Incorrect returned record');
                    })
                    .catch((err) => done(err));
            });
        });
    }

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
    for (let i = 0; i < validRideOpts.totalRides; i++) {
        validRideOpts.ride.rider_name += `${i + 1}`;
        describe(`GET /rides/${i + 1}`, () => {
            it('should return specific ride', (done) => {
                request(app)
                    .get(`/rides/${i + 1}`)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then((res) => {
                        if (res.body[0].riderName === validRideOpts.ride.rider_name) return done();
                        throw Error('GET error: Incorrect returned record');
                    })
                    .catch((err) => done(err));
            });
        });
    }

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

    describe(`GET /rides?page=${validRideOpts.page}&per_page=${validRideOpts.pageSize}`, () => {
        it('should return paginated rides', (done) => {
            const { totalRides, page, pageSize } = validRideOpts;
            const pageResultCount = totalRides > page * pageSize ? pageSize : totalRides % pageSize;
            request(app)
                .get(`/rides?page=${page}&per_page=${pageSize}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res) => {
                    if (Object.keys(res.body).length === pageResultCount) return done();
                    throw Error('GET error: Pagination has invalid number of rides');
                })
                .catch((err) => done(err));
        });
    });

    describe('GET /rides?page=0&per_page=0', () => {
        it('should return a query error', (done) => {
            request(app)
                .get('/rides?page=0&per_page=0')
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res) => {
                    if (res.body.error_code === 'QUERY_ERROR') return done();
                    throw Error('GET error: QUERY_ERROR not triggered');
                })
                .catch((err) => done(err));
        });
    });
});
