const Promise = require('bluebird');
const fs = require('fs');

const generateError = (message, code) => {
    return {
        code: code,
        error: message
    }
}

const sendDocumentation = (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    getDocumentation()
    .then((data) => {
        res.send(data);
    })
    .catch(e => res.send(JSON.stringify(e)));
}

const getDocumentation = () => {
    return new Promise((resolve, reject) => {
        fs.readFile("documentation/index.html", (err, data) => {
            console.log("send file data!");
            if (err) {
                console.log(err);
                return reject(generateError("Invalid request."));
            }
            return resolve(data);
        });
    });
}

module.exports.generateError = generateError;
module.exports.getDocumentation = getDocumentation;
module.exports.sendDocumentation = sendDocumentation;