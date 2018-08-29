/**
* Create WebSocket server for live interaction
*/

const WebSocket = require('ws');

function ConfigTracker(clientConnections)
{
    this.activePitches = [];
    this.performerConn;
    this.clientConnections = clientConnections;

    this.setPerformer = performerConn => this.performerConn = performerConn;

    this.updatePower = function()
    {
        if (!this.performerConn || this.performerConn.ws.readyState === 3) return;

        let clients = {};
        let programTotal = 0;
        for (const client of this.clientConnections)
        {
            clients[client.index] = client.runningAverage;
            programTotal += client.runningAverage;
        }

        this.performerConn.ws.send(JSON.stringify({
            type: 'total-update',
            data: {
                clients,
                programTotal
            }
        }));
    }

    this.updatePitchesTo = function(pitches)
    {
        this.activePitches = pitches;
        for (var client of clientConnections)
        {
            if (client.ws.readyState === 3) continue;

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
    this.runningAverage = 0;
    this.index;
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
                this.runningAverage += powerHistory.reduce((total, num) => total + num) / powerHistory.length;
                configTracker.updatePower();
                powerHistory.splice(0);
            }
        }
    });

    // Sends a note to the client to acknowledge its index
    this.identify = function(indexIn)
    {
        this.index = indexIn;
        this.ws.send(JSON.stringify({
            type: 'accept',
            data: {
                index: indexIn,
                pitches: configTracker.activePitches
            }
        }));
    }
};
