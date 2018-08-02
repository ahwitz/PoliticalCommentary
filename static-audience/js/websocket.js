var url = "ws://" + document.URL.substr(7).split('/')[0];
    
var WebSocket = window['MozWebSocket'] ? MozWebSocket : WebSocket;
var socket = new WebSocket(url, 'pc-audience');

socket.onmessage = function (message)
{
    console.log(message);
    document.getElementById("messages").innerHTML += "<div> - " + JSON.parse(message.data).message + "</div>";
};

document.getElementById("talk").addEventListener("click", function()
{
    socket.send(JSON.stringify({
        test: 'a',
        message: 'b'
    }));
});