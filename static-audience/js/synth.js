function PCSynth ()
{
    var audioContext = new (window.AudioContext || window.webkitAudioContext);

    var masterGainNode = audioContext.createGain();
    masterGainNode.connect(audioContext.destination);
    masterGainNode.gain.value = 0.1;

    this.playNote = function ()
    {
        var osc = audioContext.createOscillator();
        osc.connect(masterGainNode);
        osc.type = 'sawtooth'; // [square, sawtooth, triangle, custom?]

        osc.frequency.value = 440;
        osc.start();

        window.setTimeout(function()
        {
            osc.stop();
        }, 1000)
    }
}

var pcSynth = new PCSynth();
