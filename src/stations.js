const db = require('sqlite');
const fs = require('fs');

const responseHandler = require('./responseHandler');

/**
 * Checks if the table exists and adds in case it doesn't
 */
const checkDatabase = () => {
    db.run("CREATE TABLE IF NOT EXISTS stations (id varchar(250) PRIMARY KEY, name varchar(150), " + 
                "standardname varchar(150), company varchar(250), type varchar(250));");
};

/**
 * Escape quotes to input into the db (do not use this to escape SQL injection or anything a user can input!!)
 * @param {*} string the string we need to purify of quotes 
 */
const removeQuote = (string) => {
    return string.replace(/\'/g, "''");
};

/**
 * Inserts a station into the db
 * @param {*} name name of the station
 * @param {*} standardname standard name of the station (non-dialect/universal language)
 * @param {*} uri the uri of the station
 * @param {*} type the type of transport
 * @param {*} company the company owning the station
 */
const addStation = (name, standardname, uri, type, company) => {
    name = removeQuote(name);
    standardname = removeQuote(standardname);
    uri = removeQuote(uri);
    type = removeQuote(type);
    company = removeQuote(company);
    db.run(`INSERT OR IGNORE INTO stations (name, standardname, id, company, type) VALUES('${ name }', ` +
                `'${ standardname }', '${ uri }', '${ company }', '${ type }');`);
};

/**
 * Capitalizes a string
 * @param {*} str the string that has to be capitalized
 */
const capitalize = (str) => {
    let splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
    }
    return splitStr.join(' '); 
};

/**
 * Imports a json file into the db
 * @param {*} file file-location
 * @param {*} key the object where the stations are put in if the json not only contains an array of stations
 * @param {*} type the type of transport inside the json
 * @param {*} company the company offering the transport
 */
const importJson = (file, key, type, company) => {
    // TODO: support multiple types in one file
    fs.readFile(file, (err, data) => {
        if (err) {
            console.log(err);
        }

        data = JSON.parse(data);
        let stations = data;
        if (key) {
            stations = data[key];
        }

        for (let station of stations) {
            if (!station['standardname'] && station['name']) {
                station['standardname'] = station['name'];
            } else {
                if (!station['name'] && station['standardname']) {
                    station['name'] = station['standardname'];
                }
            }
            if (station['@id'] && station['standardname'] && station['name']) {
                station['standardname'] = capitalize(station['standardname']);
                station['name'] = capitalize(station['name']);
                addStation(station['name'], station['standardname'], station['@id'], type, company);
                // console.log("Station has been added!");
            }
        }
        console.log("Stations in dataset", file, ":", stations.length);
    });
}

/**
 * Returns a list of stations that contain the query
 * @param {*} query a piece or name of a stations
 */
const getStationByName = (query) => {
    console.log('query: ', query);
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM stations WHERE name LIKE ? OR standardname LIKE ?', `%${query}%`, `%${query}%`)
        .then((row) => {
            // console.log(row);
            resolve(row);
        })
        .catch((e) => {
            // console.log(e);
            reject(e);
        });
    });
};

/**
 * returns a station according to it's unique identifier (uri)
 * @param {*} id a stations id/uri
 */
const getStationById = (id) => {
    console.log('ID query: ', id);
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM stations WHERE id= ?', id)
        .then((row) => {
            // console.log(row);
            resolve(row);
        })
        .catch((e) => {
            // console.log(e);
            reject(e);
        });
    });
}

/**
 * Fills the database up with data from the provided json files
 * Also checks if data is still in the database
 */
const fillDatabase = () => {
    /*  CRTM TYPES
        8 - bus
        6 - emt-bus (citybusses)
        4 - metro
        10 - tram
        5 - train */
    
    importJson("data/sncb.json", "station", "train", "sncb");
    importJson("data/crtm001.json", null, "bus", "crtm");
}

/**
 * Registers uri listeners for the stations
 * @param {*} app the express app instance
 */
const registerListeners = (app) => {
    checkDatabase();
    fillDatabase();
    app.get('/station', function (req, res) {
        if (req.query) {
            res.setHeader('Content-Type', 'application/json');
            res.header("Access-Control-Allow-Origin", "*");
            if (req.query.q) {
                const query = req.query.q;
                if (query.length < 4) {
                    return res.send(JSON.stringify(responseHandler.generateError("Minimum query length should be 4 characters!")));
                }
                getStationByName(query).then((data) => {
                    res.send(JSON.stringify(data));
                });
                return;
            }
            if (req.query.id) {
                const id = req.query.id;
                getStationById(id).then((data) => {
                    res.send(JSON.stringify(data));
                });
                return;
            }
        }
        // TODO: Respond with a list of x-amount of stations
        // return res.send("Return first 25 stations in database");
        responseHandler.sendDocumentation(req, res);
    });
}

module.exports.registerListeners = registerListeners;