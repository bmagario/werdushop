'use strict';

var cfenv = require('cfenv'),
    appEnv = cfenv.getAppEnv();
var cfMongoUrl = (function() {
    if (appEnv.getService('mean-mongo')) {
        var mongoCreds = appEnv.getService('mean-mongo').credentials;
        return mongoCreds.uri || mongoCreds.url;
    } else {
        throw new Error('No service names "mean-mongo" bound to the application.');
    }
}());

var getCred = function(serviceName, credProp) {
    return appEnv.getService(serviceName) ?
        appEnv.getService(serviceName).credentials[credProp] : undefined;
};

module.exports = {
    port: appEnv.port,
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
        // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
        format: 'combined',
        // Stream defaults to process.stdout
        // By default we want logs to go to process.out so the Cloud Foundry Loggregator will collect them
        options: {}
    },
    facebook: {
        clientID: getCred('mean-facebook', 'id') || 'APP_ID',
        clientSecret: getCred('mean-facebook', 'secret') || 'APP_SECRET',
        callbackURL: '/api/auth/facebook/callback'
    },
    mailer: {
        from: getCred('mean-mail', 'from') || 'MAILER_FROM',
        options: {
            service: getCred('mean-mail', 'service') || 'MAILER_SERVICE_PROVIDER',
            auth: {
                user: getCred('mean-mail', 'username') || 'MAILER_EMAIL_ID',
                pass: getCred('mean-mail', 'password') || 'MAILER_PASSWORD'
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