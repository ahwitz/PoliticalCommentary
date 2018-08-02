var url = "ws://" + window.location.host;
    
var WebSocket = window['MozWebSocket'] ? MozWebSocket : WebSocket;
var socket = new WebSocket(url, 'pc-audience');

socket.onmessage = function (message)
{
    console.log(message);
    pcSynth.playNote();
    document.getElementById("messages").innerHTML += "<div> - " + JSON.parse(message.data).message + "</div>";
};

document.getElementById("talk").addEventListener("click", function()
{
    socket.send(JSON.stringify({
        test: 'a',
        message: 'b'
    }));
});