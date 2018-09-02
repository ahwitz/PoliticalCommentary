/**
* Create WebSocket server for live interaction
*/

const WebSocket = require('ws');
const utils = require('./utils');

// Because `ws` doesn't play nicely enough with Express

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
        for (const id in this.clientConnections)
        {
            const client = this.clientConnections[id];
            clients[id] = client.runningAverage;
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
    const clientConnections = {};
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
            if (!configTracker) configTracker = new ConfigTracker(clientConnections);
            performerConnection = new pcPerformer(ws, req, configTracker);
            configTracker.setPerformer(performerConnection);

            // If a close comes through for this, reset it
            ws.on('close', () => {
                performerConnection = null;
                configTracker.activePitches = [];
            });
        }
        else if (ws.protocol === 'pc-audience')
        {
            let pcID;

            // If we're coming in with a pcID, save it
            if (req.headers.cookie && req.headers.cookie.indexOf("pcid") > -1)
            {
                pcID = req.headers.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*pcid\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1');

                // Just in case of error somewhere
                if (!pcID || (pcID === 'undefined'))
                    pcID = utils.guid();
            }

            // Otherwise, set a new one
            else
                pcID = utils.guid();

            // If the performer doesn't exist, close
            if (!performerConnection) return ws.close();

            // If the pcID has been registered already, re-init the websocket
            let clientConnection;
            if (pcID in clientConnections)
                clientConnections[pcID].initWS(ws, req);

            // Otherwise, create one
            else
                clientConnections[pcID] = new pcAudience(ws, req, configTracker, pcID);

            // Identify and register the ID
            clientConnection = clientConnections[pcID];
            clientConnection.identify(pcID);

            performerConnection.ws.send(JSON.stringify({
                type: 'new-client',
                data: {
                    id: pcID
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

function pcAudience(ws, req, configTracker, id)
{
    // Variables needed by this object
    this.id = id;
    this.ws;
    this.runningAverage = 0;
    const powerHistory = [];

    const messageHandler = (message) => {
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
    };

    // Resets this audience member's websocket
    this.initWS = function(ws, req)
    {
        const isNew = !!this.ws;
        console.log((new Date()) + ` client ${id} ${isNew ? 're' : ''}added at ` + req.connection.remoteAddress);
        this.ws = ws;
        this.ws.on('message', messageHandler);
    };

    // Sends a note to the client to acknowledge its id
    this.identify = function(idIn)
    {
        this.id = idIn;
        this.ws.send(JSON.stringify({
            type: 'accept',
            data: {
                id: idIn,
                pitches: configTracker.activePitches
            }
        }));
    };

    // Actually initializes everything
    this.initWS(ws, req);
};
