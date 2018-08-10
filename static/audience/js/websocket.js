var url = "ws://" + window.location.host;
    
var WebSocket = window['MozWebSocket'] ? MozWebSocket : WebSocket;
var socket = new WebSocket(url, 'pc-audience');

// Things set when initialized
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
        message.data.index = index;
        stageTwo.classList.remove("loading");

        // todo: set a cookie to save index in case of reload
        // todo: pass stage

        powerInterval = window.setInterval(function()
        {
            socket.send(JSON.stringify({
                type: 'power',
                data: {
                    action: actionSlider.value,
                    order: orderSlider.value,
                }
            }));
        }, 1000);
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
