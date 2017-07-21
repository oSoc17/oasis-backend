const Promise = require('bluebird');
const fs = require('fs');

/**
 * Generates an custom error object
 * @param {*} message The error message
 * @param {*} code The error code
 */
const generateError = (message, code) => {
    return {
        code: code,
        error: message
    }
}

/**
 * Sends the documentation to the client
 * @param {*} req express request object
 * @param {*} res express result object
 */
const sendDocumentation = (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    getDocumentation()
    .then((data) => {
        res.send(data);
    })
    .catch(e => res.send(JSON.stringify(e)));
}

/**
 * Fetches the documentation from the storage
 */
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