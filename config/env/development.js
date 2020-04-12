'use strict';

var defaultEnvConfig = require('./default');

module.exports = {
    mydb: {
        host: 'localhost',
        user: 'root',
        password: '****************',
        port: 3306,
        database: 'werdulero',
        timezone: '-3:00',
        multipleStatements: true
    },
    log: {
        // logging with Morgan - https://github.com/expressjs/morgan
        // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
        format: 'dev',
        options: {
            // Stream defaults to process.stdout
            // Uncomment/comment to toggle the logging to a log on the file system
            //stream: {
            //  directoryPath: process.cwd(),
            //  fileName: 'access.log',
            //  rotatingLogs: { // for more info on rotating logs - https://github.com/holidayextras/file-stream-rotator#usage
            //    active: false, // activate to use rotating logs 
            //    fileName: 'access-%DATE%.log', // if rotating logs are active, this fileName setting will be used
            //    frequency: 'daily',
            //    verbose: false
            //  }
            //}
        }
    },
    app: {
        title: defaultEnvConfig.app.title + ' - Development Environment'
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
    livereload: true,
    seedDB: {
        seed: process.env.MONGO_SEED === 'true' ? true : false,
        options: {
            logResults: process.env.MONGO_SEED_LOG_RESULTS === 'false' ? false : true
        }
    }
};