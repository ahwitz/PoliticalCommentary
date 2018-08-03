/**
* Create WebSocket server for live interaction
*/

const WebSocketServer = require('websocket').server;
const WebSocketRouter = require('websocket').router;

module.exports.WSServer = function(httpServer)
{
    const wsServer = new WebSocketServer({
      httpServer: httpServer,
      autoAcceptConnections: false
    });

    const router = new WebSocketRouter();
    router.attachServer(wsServer);

    function originIsAllowed(origin) {
        // TODO: logic to determine whether something can request?
        return true;
    }

    const clientConnections = [];
    let performerConnection;

    router.mount('*', 'pc-audience', function(request)
    {
        const clientConnection = request.accept(request.origin);
        clientConnections.push(clientConnection);

        console.log((new Date()) + ' client added at ' + clientConnection.remoteAddress);

        clientConnection.on('message', function(message)
        {
            if (message.type === 'utf8') {
                const parsed = JSON.parse(message.utf8Data);
                console.log('Received Message: ' + parsed.message);
                clientConnection.sendUTF(JSON.stringify({message: "Received a message."}));
            }
            else if (message.type === 'binary') {
                console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
                clientConnection.sendBytes(message.binaryData);
            }
        });
    });

    router.mount('*', 'pc-performer', function(request)
    {
        if (performerConnection) return;

        performerConnection = request.accept(request.origin);
        console.log((new Date()) + ' performer acknowledged at ' + performerConnection.remoteAddress);
        
        performerConnection.on('message', function(message)
        {
            if (message.type === 'utf8') {
                const parsed = JSON.parse(message.utf8Data);
                console.log('Received frequency: ' + message.utf8Data);
                for (const conn of clientConnections)
                    conn.sendUTF(JSON.stringify({freq: parsed.freq}));
            }
            else if (message.type === 'binary') {
                console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
                performerConn.sendBytes(message.binaryData);
            }
        });
    });

    return wsServer;
};
