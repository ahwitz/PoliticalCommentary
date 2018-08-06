var url = "ws://" + window.location.host;
    
var WebSocket = window['MozWebSocket'] ? MozWebSocket : WebSocket;
var socket = new WebSocket(url, 'pc-audience');

socket.onmessage = function (message)
{
    message = JSON.parse(message.data);
    console.log(message);
    pcSynth.playNote(message.freq);
    document.getElementById("messages").innerHTML += "<div> - received freq: " + message.freq + "</div>";
};

var actionSlider = document.getElementById("action-slider");
var orderSlider = document.getElementById("order-slider");

var powerInterval = window.setInterval(function()
{
    socket.send(JSON.stringify({
        type: 'power',
        data: {
            action: actionSlider.value,
            order: orderSlider.value,
        }
    }));
}, 1000);

socket.onclose = function ()
{
    window.clearInterval(powerInterval);
}
