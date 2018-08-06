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

    let overallPower = 0;

    router.mount('*', 'pc-audience', function(request)
    {
        // Variables local to this user
        const clientConnection = request.accept(request.origin);
        const powerHistory = [];

        // Push them in the array to be accessible
        const index = clientConnections.push({
            connection: clientConnection,
            powerHistory: []
        });

        console.log((new Date()) + ' client added at ' + clientConnection.remoteAddress);

        clientConnection.on('message', function(message)
        {
            if (message.type !== 'utf8') return;

            const parsed = JSON.parse(message.utf8Data);

            if (parsed.type === 'power')
            {
                const action = parsed.data.action;
                const order = parsed.data.order;

                let power = action * order;
                console.log("Power:", power);
                powerHistory.push(power);

                if (powerHistory.length >= 10)
                {
                    overallPower += powerHistory.reduce((total, num) => total + num) / powerHistory.length;
                    powerHistory.splice(0);

                    console.log("Overall:", overallPower);
                }
            }
            // clientConnection.sendUTF(JSON.stringify({message: "Received a message."}));
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
