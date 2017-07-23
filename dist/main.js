const main = require ("../src/server.js");

/**
 * IIFE to start the server
 */
(() => {
    console.log("====== TRIPSCORE SERVER ======");
    main.init();
})()