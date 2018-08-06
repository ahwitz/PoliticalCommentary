/**
* Create WebSocket server for live interaction
*/

const WebSocket = require('ws');

function PowerHistoryTracker(performerConn)
{
    this.performerConn = performerConn;

    let programTotal = 0;

    this.updateWith = function(index, clientTotal)
    {
        programTotal += clientTotal;

        console.log('sending totalUpdate with', programTotal);
        performerConn.ws.send(JSON.stringify({
            type: 'total-update',
            data: {
                programTotal,
                clientTotal,
                index
            }
        }))
    }

}

module.exports.WSServer = function(url, httpServer)
{
    const clientConnections = [];
    let performerConnection;

    // To be assigned to an instance of PowerHistoryTracker when the performer connects
    let overallPower;

    const wsServer = new WebSocket.Server({
        server: httpServer
    });

    wsServer.on('connection', (ws, req) => {
        if (ws.protocol === 'pc-performer')
        {
            // If the performer already exists, close this
            if (performerConnection) return ws.close();
            
            // Otherwise save
            performerConnection = new pcPerformer(ws, req);
            overallPower = new PowerHistoryTracker(performerConnection);
        }
        else if (ws.protocol === 'pc-audience')
        {
            // If the performer doesn't exist, close
            if (!performerConnection) return ws.close();

            const clientConnection = new pcAudience(ws, req, overallPower);

            // Push them in the array to be accessible
            const index = clientConnections.push(clientConnection);
            clientConnection.identify(index);

            performerConnection.ws.send(JSON.stringify({
                type: 'new-client',
                data: {
                    index: index
                }
            }));
        }
        else ws.close();
    });
};

function pcPerformer(ws, req, powerTracker)
{
    console.log((new Date()) + ' performer acknowledged at ' + req.connection.remoteAddress);
    this.ws = ws;

    ws.on('message', (message) => {
        if (message.type !== 'utf8') return;

        const parsed = JSON.parse(message.utf8Data);
        console.log('Received frequency: ' + message.utf8Data);
        for (const conn of clientConnections)
            conn.ws.send(JSON.stringify({freq: parsed.freq}));
    });
};

function pcAudience(ws, req, powerTracker)
{
    console.log((new Date()) + ' client added at ' + req.connection.remoteAddress);

    // Variables needed by this object
    this.ws = ws;
    let index;
    const powerHistory = [];

    // WS message handler
    ws.on('message', (message) => {
        const parsed = JSON.parse(message);
        if (!parsed) return;

        if (parsed.type === 'power')
        {
            const action = parsed.data.action;
            const order = parsed.data.order;

            let power = action * order;
            powerHistory.push(power);

            if (powerHistory.length >= 2)
            {
                const runningAverage = powerHistory.reduce((total, num) => total + num) / powerHistory.length;
                powerTracker.updateWith(index, runningAverage);
                powerHistory.splice(0);
            }
        }
    });

    // Sends a note to the client to acknowledge its index
    this.identify = function(indexIn)
    {
        index = indexIn;
        this.ws.send(JSON.stringify({
            type: 'accept',
            data: {
                index: indexIn
            }
        }));
    }
};
