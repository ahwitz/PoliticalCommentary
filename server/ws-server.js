/**
* Create WebSocket server for live interaction
*/

const WebSocket = require('ws');

function ConfigTracker(clientConnections)
{
    this.activePitches = [];
    this.performerConn;
    this.clientConnections = clientConnections;

    let programTotal = 0;

    this.setPerformer = performerConn => this.performerConn = performerConn;

    // Removes expired clients from the clientConnections arr
    this.checkClients = function()
    {
        const toSplice = [];
        for (let cIdx = 0; cIdx < clientConnections.length; cIdx++)
        {
            if (clientConnections[cIdx].ws.readyState === 3)
                toSplice.push(cIdx);
        }

        // remove them in reverse so that indexes are stable
        for (let cIdx of toSplice.reverse())
            clientConnections.splice(cIdx, 1);
    }

    this.updatePowerWith = function(index, clientTotal)
    {
        programTotal += clientTotal;

        performerConn.ws.send(JSON.stringify({
            type: 'total-update',
            data: {
                programTotal,
                clientTotal,
                index
            }
        }));
    }

    this.updatePitchesTo = function(pitches)
    {
        this.checkClients();
        this.activePitches = pitches;
        for (var client of clientConnections)
        {
            client.ws.send(JSON.stringify({
                type: 'pitches',
                data: this.activePitches
            }));
        }
    }
}

module.exports.WSServer = function(url, httpServer)
{
    const clientConnections = [];
    let performerConnection;

    // To be assigned to an instance of PowerHistoryTracker when the performer connects
    let configTracker;

    const wsServer = new WebSocket.Server({
        server: httpServer
    });

    wsServer.on('connection', (ws, req) => {
        if (ws.protocol === 'pc-performer')
        {
            // If the performer already exists, close this
            if (performerConnection) return ws.close();
            
            // Otherwise save
            configTracker = new ConfigTracker(clientConnections);
            performerConnection = new pcPerformer(ws, req, configTracker);
            configTracker.setPerformer(performerConnection);
        }
        else if (ws.protocol === 'pc-audience')
        {
            // If the performer doesn't exist, close
            if (!performerConnection) return ws.close();

            const clientConnection = new pcAudience(ws, req, configTracker);

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

function pcPerformer(ws, req, configTracker)
{
    console.log((new Date()) + ' performer acknowledged at ' + req.connection.remoteAddress);
    this.ws = ws;

    ws.on('message', (message) => {
        const parsed = JSON.parse(message);
        if (!parsed) return;

        if (parsed.type === 'pitches')
        {
            configTracker.updatePitchesTo(parsed.data);
        }
    });
};

function pcAudience(ws, req, configTracker)
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
                configTracker.updatePowerWith(index, runningAverage);
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
