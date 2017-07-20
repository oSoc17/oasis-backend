const db = require('sqlite');
const fs = require('fs');

const checkDatabase = () => {
    db.run("CREATE TABLE IF NOT EXISTS stations (id INTEGER PRIMARY KEY AUTOINCREMENT, name varchar(150), " + 
                "standardname varchar(150), uri varchar(250), company varchar(250), type varchar(250));");
};

const removeQuote = (string) => {
    return string.replace(/\'/g, "''");
};

const addStation = (name, standardname, uri, type, company) => {
    name = removeQuote(name);
    standardname = removeQuote(standardname);
    uri = removeQuote(uri);
    type = removeQuote(type);
    company = removeQuote(company);
    db.run(`INSERT OR IGNORE INTO stations (name, standardname, uri, company, type) VALUES('${ name }', ` +
                `'${ standardname }', '${ uri }', '${ company }', '${ type }');`);
};

const capitalize = (str) => {
    let splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
    }
    return splitStr.join(' '); 
};

const importJson = (file, key, type, company) => {
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
        console.log(stations.length);
    });
}

const getStation = (query) => {
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

const fillDatabase = () => {
    // CRTM
    /*  TYPES
        8 - bus
        6 - emt-bus (citybusses)
        4 - metro
        10 - tram
        5 - train */
    
    importJson("data/sncb.json", "station", "train", "sncb");
    importJson("data/crtm001.json", null, "bus", "crtm");
}

const registerListeners = (app) => {
    checkDatabase();
    fillDatabase();
    app.get('/station', function (req, res) {
        if (req.query && req.query.q) {
            const query = req.query.q;
            getStation(query).then((data) => {
                res.send(data);
            });
            return;
        }
        return res.send("Return first 25 stations in database");
    });
}

module.exports.registerListeners = registerListeners;