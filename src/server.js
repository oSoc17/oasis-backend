const express = require('express');
const Promise = require('bluebird');
const db = require('sqlite');

const stations = require("./stations");
const responseHandler = require("./responseHandler");

const config = require("../config.json");
const app = express();
const port = process.env.PORT || config.port;

/**
 * Logs that the server started and starts up all listeners, services and db fillers
 */
const serverStarted = () => {
    console.log(`Server is up and running on port ${port}!`)
    app.get('/', function (req, res) {
        responseHandler.sendDocumentation(req, res);
    });
    stations.registerListeners(app);
}

/**
 * Checks and Registers all databases and creates files in case necessary
 */
const startDb = () => {
    return new Promise(function (resolve, reject) {
        db.open('./databases/stations.sqlite')
        .then((data) => {
            // console.log(data);
            console.log("Stations database initialised.");
            startServer();
        }).catch((e) => {
            console.error(e.stack)
        });
    });
};

/**
 * Starts the express instance after initial loadig of services and databases
 */
const startServer = () => {
    app.listen(port, serverStarted);
}

/**
 * Initialises the server
 */
const initialize = () => {
    startDb().then(() => {
        startServer();
    }).catch((e) => {
        console.log(e);
    });
}

exports.init = initialize;