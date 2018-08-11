var url = "ws://" + window.location.host;
    
var WebSocket = window['MozWebSocket'] ? MozWebSocket : WebSocket;
var socket = new WebSocket(url, 'pc-audience');

// Things set on the 'accept' message initialization
var index, powerInterval;

// DOM elements
var stageTwo = document.getElementById("stage-two");
var actionSlider = document.getElementById("action-slider");
var orderSlider = document.getElementById("order-slider");

socket.onmessage = function (message)
{
    message = JSON.parse(message.data);

    // Set up message sent by server
    if (message.type === 'accept')
    {
        stageTwo.classList.remove("loading");
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
    if (!index) return document.getElementById("loading-message").innerHTML = "The performance has not yet started.";

    // Otherwise:
    window.clearInterval(powerInterval);
    stageTwo.innerHTML = "The performance is complete.";
}