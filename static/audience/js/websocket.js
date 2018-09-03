var pcID;

// If there's an ID already set, get it; otherwise, we'll get it later
if (docCookies.getItem("pcid"))
    pcID = docCookies.getItem("pcid");
    
// Connect
var url = "ws://" + window.location.host;
var WebSocket = window['MozWebSocket'] ? MozWebSocket : WebSocket;
var socket = new WebSocket(url, 'pc-audience');

// Other things set on the 'accept' message initialization
var powerInterval;

// Set it up so that the action slider goes down when it's not touched
var actionInterval = window.setInterval(function()
{
    if (!document.getElementById("action-slider")) return window.clearInterval(actionInterval);
    document.getElementById("action-slider").value = document.getElementById("action-slider").value - 0.005;
}, 200)

// Sets a given root-level div to be visible
function setVisible(id)
{
    document.querySelector(".index.visible").classList.remove("visible");
    document.getElementById(id).classList.add('visible');
}

socket.onmessage = function (message)
{
    message = JSON.parse(message.data);

    // Set up message sent by server
    if (message.type === 'accept')
    {
        pcID = message.data.id;
        docCookies.setItem("pcid", pcID);

        powerInterval = window.setInterval(pcSynth.updatePower.bind(pcSynth), 1000);
        if (message.data.pitches && message.data.pitches.length > 0)
            pcSynth.setPitches(message.data.pitches);

        setVisible("s2");
    }

    else if (message.type === 'pitches')
    {
        pcSynth.setPitches(message.data);
    }

    else if (message.type === 'stage')
    {
        console.log(message.data);
    }
};

// Cleanup
socket.onclose = function ()
{
    // If the `accept` message was never sent, this is quick
    if (!pcID) return;

    // Otherwise:
    window.clearInterval(powerInterval);
    pcSynth.end();
    setVisible("c");
}
