const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const logger = require('./src/logger');
const app = require('./src/app')();
const buildSchemas = require('./src/schemas');

const port = 8010;

(async () => {
    // sqlite is used to access db promises
    const db = await open({
        filename: './rides.db',
        driver: sqlite3.cached.Database
    });

    await buildSchemas(db);
    app.listen(port, () => logger.info(`App started and listening on port ${port}`));
})();
