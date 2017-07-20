const express = require('express');
const Promise = require('bluebird');
const db = require('sqlite');

const stations = require("./stations");

const config = require("../config.json");
const app = express();
const port = process.env.PORT || config.port;

const serverStarted = () => {
    console.log("Server is up and running!")
    app.get('/', function (req, res) {
        res.send('Unknown request!');
    });
    stations.registerListeners(app);
}

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

const startServer = () => {
    app.listen(port, serverStarted);
}

const initialize = () => {
    startDb().then(() => {
        startServer();
    }).catch((e) => {
        console.log(e);
    });
}

exports.init = initialize;