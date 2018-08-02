const express = require('express');
const http = require('http');
const WebSocketServer = require('websocket').server;

const port = 12345;

/**
 * Create static Express app for loading static content
 */
const app = express();

// Load a separate set of files for the performer - labeled "admin" here; TODO: logic to protect
app.use('/admin', express.static('static-performer'));

// Load the primary set of static files for the audience
app.use('/', express.static('static-audience'));

const server = http.createServer(app).listen(port);
server.on('listening', function ()
{
    console.log("(re)started.");
});

/**
 * Create WebSocket server for live interaction
 */

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // TODO: logic to determine whether something can request?
  return true;
}

wsServer.on('request', function(request)
{
    if (!originIsAllowed(request.origin))
    {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    const connection = request.accept('pc-audience', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            const parsed = JSON.parse(message.utf8Data);
            console.log('Received Message: ' + parsed.message);
            connection.sendUTF(JSON.stringify({message: "Received a message."}));
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });

    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
