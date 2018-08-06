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

    // Set up
    if (message.type === 'accept')
    {
        message.data.index = index;
        stageTwo.classList.remove("loading");

            console.log('setting interval');
        powerInterval = window.setInterval(function()
        {
            console.log('interval');
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

socket.onclose = function ()
{
    if (!index) document.getElementById("loading-message").innerHTML = "The performance has not yet started. Please reload later.";
    if (powerInterval) window.clearInterval(powerInterval);
}
