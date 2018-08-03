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

document.getElementById("talk").addEventListener("click", function()
{
    socket.send(JSON.stringify({
        test: 'a',
        message: 'b'
    }));
});