const express = require('express');
const http = require('http');

const port = 12345;

/**
 * Create static Express app for loading static content
 */
const app = express();

// Load a separate set of files for the performer - labeled "admin" here; TODO: logic to protect
app.use('/admin', express.static('static/performer'));

// Load the primary set of static files for the audience
app.use('/', express.static('static/audience'));

const server = http.createServer(app).listen(port);
server.on('listening', function ()
{
    console.log("(re)started.");
});

var WSServer = require("./server/ws-server.js").WSServer;
var PCServer = new WSServer(server);
