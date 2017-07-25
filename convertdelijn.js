const fs = require("fs");
const lijndata = require("./data/DeLijnDump.json");
let result = [];
let parentStations = {};
let uriTree = {};

(function() {
    for (let stop of lijndata) {
        let uri = `http://belgium.linkedconnections.org/delijn/stops/${stop['stop_code']}`;
        let name = stop["stop_name"];
        let parentName = name.replace(/(\s+)?[-\s]?(\s+)?(?:P|p)(?:E|e)(?:R|r)(?:R|r)(?:O|o)(?:N|n)(\s+)?.+/g, "");
        let parentUri = uri + "_parent";
        if (parentStations[parentName]) {
            parentUri = parentStations[parentName];
        }

        const child = {
            "@id": uri,
            "name": stop["stop_name"]
        };

        if (parentName !== name) {
            const parent = {
                "@id": parentUri,
                "name": parentName
            };

            result.push(parent);

            parentStations[parentName] = parentUri;
            child["parent"] = parentUri;
            uriTree[uri] = parentUri;
        }

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