var url = "ws://" + window.location.host;
    
var WebSocket = window['MozWebSocket'] ? MozWebSocket : WebSocket;
var socket = new WebSocket(url, 'pc-performer');

socket.onmessage = function (message)
{
};

var inputs = document.getElementsByClassName("pitch-input");
for (var iIdx = 0; iIdx < inputs.length; iIdx++)
{
    inputs[iIdx].addEventListener("change", function(e)
    {
        var target = e.target;
        var newValue = target.value;
        target.nextSibling.textContent = newValue;

        var values = [];
        for (var iIdx = 0; iIdx < inputs.length; iIdx++)
            values.push(inputs[iIdx].value);

        socket.send(JSON.stringify({
            type: 'pitches',
            data: values
        }));
    });
}