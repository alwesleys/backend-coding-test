const { format, createLogger, transports } = require('winston');

const myFormat = format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
);

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        myFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: './logs/error.log', level: 'error' }),
        new transports.File({ filename: './logs/combined.log' }),
    ],
});

module.exports = logger;
