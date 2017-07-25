const db = require('sqlite');
const fs = require('fs');

const responseHandler = require('./responseHandler');
const config = require('../config.json');

/**
 * Checks if the table exists and adds in case it doesn't
 */
const checkDatabase = () => {
    db.run("CREATE TABLE IF NOT EXISTS stations (id varchar(250) PRIMARY KEY, name varchar(150), " + 
                "standardname varchar(150), company varchar(250), type varchar(250), parent varchar(250));");
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
const addStation = (name, standardname, uri, type, company, parent) => {
    name = removeQuote(name);
    standardname = removeQuote(standardname);
    uri = removeQuote(uri);
    type = removeQuote(type);
    company = removeQuote(company);
    if (parent) {
        console.log(parent);
    }
    db.run(`INSERT OR IGNORE INTO stations (name, standardname, id, company, type, parent) VALUES('${ name }', ` +
                `'${ standardname }', '${ uri }', '${ company }', '${ type }', '${ parent }');`);
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
const importJson = (file, key, type, company, capitalizeName) => {
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
            }
            if (!station['name'] && station['standardname']) {
                station['name'] = station['standardname'];
            }
            if (station['@id'] && station['standardname'] && station['name']) {
                if (capitalizeName) {
                    station['standardname'] = capitalize(station['standardname']);
                    station['name'] = capitalize(station['name']);
                }
                let parent = station['parent'] ? station['parent'] : null;
                addStation(station['name'], station['standardname'], station['@id'], type, company, parent);
                // console.log("Station has been added!");
            }
        }
        console.log("Stations in dataset", file, ":", stations.length);
    });
}

/**
 * Returns a list of stations that contains the query
 * @param {*} query a query object {id, name, company, type, page}
 */
const getStation = (query) => {
    let sqlQuery = 'SELECT * FROM stations ';
    let parameters = [];
    let nextPage = `${config.domain}/station`;
    let response = {};
    if (query.id || query.name || query.company || query.type) {
        sqlQuery = 'SELECT * FROM stations WHERE ';
    }
    if (query.id) {
        nextPage += `?id=${query.id}`;
        sqlQuery += ' id= ?';
        parameters.push(`${query.id}`);
    }
    if (query.name) {
        nextPage += parameters.length > 0 ? '&' : '?';
        nextPage += `q=${query.name}`;
        sqlQuery += parameters.length > 0 ? ' AND' : "";
        sqlQuery += ' name LIKE ? OR standardname LIKE ?';
        parameters.push(`%${query.name}%`);
        parameters.push(`%${query.name}%`);
    }
    if (query.company) {
        nextPage += parameters.length > 0 ? '&' : '?';
        nextPage += `company=${query.company}`;
        sqlQuery += parameters.length > 0 ? ' AND' : "";
        sqlQuery += ' company= ?';
        parameters.push(`${query.company}`);
    }
    if (query.type) {
        nextPage += parameters.length > 0 ? '&' : '?';
        nextPage += `type=${query.type}`;
        sqlQuery += parameters.length > 0 ? ' AND' : "";
        sqlQuery += ' type= ?';
        parameters.push(`${query.type}`);
    }
    sqlQuery += ' LIMIT 25';
    if (query.page && !isNaN(query.page)) {
        query.page = parseInt(query.page)
        sqlQuery += ` OFFSET ${query.page}`;
    } else {
        query.page = 0;
    }
    return new Promise((resolve, reject) => {
        db.all(sqlQuery, parameters)
        .then((row) => {
            // console.log(row);
            if (row.length >= 25) {
                nextPage += parameters.length > 0 ? '&' : '?';
                nextPage += `p=${(query.page + 1)}`;
                response.nextPage = nextPage;
            }
            response.stations = row;
            resolve(response);
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
    importJson("data/crtm/emtStops.json", null, "emt-bus", "crtm", true);
    importJson("data/crtm/metroStops.json", null, "metro", "crtm", true);
    importJson("data/crtm/trainStops.json", null, "train", "crtm", true);
    importJson("data/crtm/busses.json", null, "bus", "crtm", true);
    importJson("data/crtm/urbanStops.json", null, "bus", "crtm", true);
    importJson("data/delijn.json", null, "bus", "delijn");
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
            let searchQuery = {};
            let valueSet = false;
            if (req.query.q) {
                searchQuery["name"] = `${req.query.q}`;
                valueSet = true;
            }
            if (req.query.id) {
                searchQuery["id"] = `${req.query.id}`;
                valueSet = true;
            }
            if (req.query.company) {
                searchQuery["company"] = `${req.query.company}`;
                valueSet = true;
            }
            if (req.query.type) {
                searchQuery["type"] = `${req.query.type}`;
                valueSet = true;
            }
            if (req.query.p) {
                searchQuery["page"] = `${req.query.p}`;
                valueSet = true;
            }
            return getStation(searchQuery)
            .then((data) => {
                res.send(JSON.stringify(data));
            })
            .catch(e => JSON.stringify(responseHandler.generateError("No data found.")));
        }
    });
}

module.exports.registerListeners = registerListeners;