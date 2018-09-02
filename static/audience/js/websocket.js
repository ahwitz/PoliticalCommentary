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

// DOM elements
var stageTwo = document.getElementById("stage-two");

socket.onmessage = function (message)
{
    message = JSON.parse(message.data);

    // Set up message sent by server
    if (message.type === 'accept')
    {
        stageTwo.classList.remove("loading");

        pcID = message.data.id;
        docCookies.setItem("pcid", pcID);

        powerInterval = window.setInterval(pcSynth.updatePower.bind(pcSynth), 1000);
        if (message.data.pitches && message.data.pitches.length > 0)
            pcSynth.setPitches(message.data.pitches);
    }
    if (message.type === 'pitches')
    {
        pcSynth.setPitches(message.data);
    }
};

// Cleanup
socket.onclose = function ()
{
    // If the `accept` message was never sent, this is quick
    if (!pcID) return document.getElementById("loading-message").innerHTML = "The performance has not yet started.";

    // Otherwise:
    window.clearInterval(powerInterval);
    pcSynth.end();
    stageTwo.innerHTML = "The performance is complete.";
}
