'use strict';

module.exports = {
    secure: {
        ssl: true,
        privateKey: './config/sslcerts/key.pem',
        certificate: './config/sslcerts/cert.pem'
    },
    port: process.env.PORT || 8443,
    mydb: {
        host: 'localhost',
        user: 'root',
        pass: '****************',
        port: 3306,
        database: 'werdulero',
        timezone: '-3:00',
        multipleStatements: true
    },
    log: {
        // logging with Morgan - https://github.com/expressjs/morgan
        // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
        format: process.env.LOG_FORMAT || 'combined',
        options: {
            // Stream defaults to process.stdout
            // Uncomment/comment to toggle the logging to a log on the file system
            stream: {
                directoryPath: process.env.LOG_DIR_PATH || process.cwd(),
                fileName: process.env.LOG_FILE || 'access.log',
                rotatingLogs: { // for more info on rotating logs - https://github.com/holidayextras/file-stream-rotator#usage
                    active: process.env.LOG_ROTATING_ACTIVE === 'true' ? true : false, // activate to use rotating logs 
                    fileName: process.env.LOG_ROTATING_FILE || 'access-%DATE%.log', // if rotating logs are active, this fileName setting will be used
                    frequency: process.env.LOG_ROTATING_FREQUENCY || 'daily',
                    verbose: process.env.LOG_ROTATING_VERBOSE === 'true' ? true : false
                }
            }
        }
    },
    facebook: {
        clientID: process.env.FACEBOOK_ID || '209249792789833',
        clientSecret: process.env.FACEBOOK_SECRET || 'f771f96f16752475759d086687264d57',
        callbackURL: '/api/auth/facebook/callback'
    },
    mailer: {
        from: process.env.MAILER_FROM || 'brian.magario@gmail.com',
        options: {
            service: process.env.MAILER_SERVICE_PROVIDER || 'gmail',
            auth: {
                user: process.env.MAILER_EMAIL_ID || 'brian.magario@gmail.com',
                pass: process.env.MAILER_PASSWORD || '****************'
            }
        }
    },
    seedDB: {
        seed: process.env.MONGO_SEED === 'true' ? true : false,
        options: {
            logResults: process.env.MONGO_SEED_LOG_RESULTS === 'false' ? false : true
        }
    }
};