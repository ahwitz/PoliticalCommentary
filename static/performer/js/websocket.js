var url = "ws://" + window.location.host;
    
var WebSocket = window['MozWebSocket'] ? MozWebSocket : WebSocket;
var socket = new WebSocket(url, 'pc-performer');

socket.onmessage = function (message)
{
};

document.getElementById("talk").addEventListener("click", function()
{
	var freq = document.getElementById("freq-input").value;
    socket.send(JSON.stringify({
        freq: freq
    }));
});