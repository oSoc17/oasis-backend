const fs = require("fs");
const lijndata = require("./data/DeLijnDump.json");
let result = [];

for (let stop of lijndata) {
    const newstop = {
        uri: "http://belgium.linkedconnections.org/delijn/stops/" + stop["stop_code"],
        standardname: stop["stop_name"]
    };
    result.push(newstop);
}

fs.writeFile('./data/delijn.json', JSON.stringify(result), (err) => {
    if (err) throw err;
    console.log("delijn data converted");
});