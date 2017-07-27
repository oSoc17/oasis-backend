const fs = require("fs");
const lijndata = require("./data/DeLijnDump.json");
let result = [];
let parentStations = {};
let uriTree = {};
let nameCount = {};

(function() {
    for (let stop of lijndata) {
        let uri = `http://belgium.linkedconnections.org/delijn/stops/${stop['stop_id']}`;
        let name = stop["stop_name"];
        let parentName = name.replace(/(\s+)?[-\s]?(\s+)?(?:P|p)(?:E|e)(?:R|r)(?:R|r)(?:O|o)(?:N|n)(\s+)?.+/g, "");
        parentName = parentName.toLowerCase();
        let parentUri = uri + "_parent";

        if (!nameCount[parentName]) {
            nameCount[parentName] = {
                uri: uri,
                count: 0
            };
        }

        const child = {
            "@id": uri,
            "name": stop["stop_name"],
            "latitude": "" + stop["stop_lat"],
            "longitude": "" + stop["stop_lon"]
        };

        if (parentStations[parentName]) {
            parentUri = parentStations[parentName];
        }

        if (nameCount[parentName].count > 0 && parentName.toLowerCase() === name.toLowerCase()) {
            parentUri = nameCount[parentName].uri;

            parentStations[parentName] = parentUri;
            child["parent"] = parentUri;
            uriTree[uri] = parentUri;
        }

        if (parentName.toLowerCase() !== name.toLowerCase()) {
            const parent = {
                "@id": parentUri,
                "name": parentName,
                "latitude": "" + stop["stop_lat"],
                "longitude": "" + stop["stop_lon"]
            };

            console.log(name);

            result.push(parent);

            parentStations[parentName] = parentUri;
            child["parent"] = parentUri;
            uriTree[uri] = parentUri;
        }

        nameCount[parentName].count++;

        result.push(child);
    }

    fs.writeFile('./data/delijn.json', JSON.stringify(result), (err) => {
        if (err) throw err;
        console.log("delijn data converted");
    });

    fs.writeFile('./data/delijnparentTree.json', JSON.stringify(parentStations), (err) => {
        if (err) throw err;
        console.log("delijn parent link data converted");
    });

    fs.writeFile('./data/delijnparentTree.json', JSON.stringify(uriTree), (err) => {
        if (err) throw err;
        console.log("delijn parent link data converted");
    });
})()