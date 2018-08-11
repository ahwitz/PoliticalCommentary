function PCSynth ()
{
    var audioContext = new (window.AudioContext || window.webkitAudioContext);

    var masterGainNode = audioContext.createGain();
    masterGainNode.connect(audioContext.destination);
    masterGainNode.gain.value = 0.1;

    this.playNote = function (freq)
    {
        var osc = audioContext.createOscillator();
        osc.connect(masterGainNode);
        osc.type = 'sawtooth'; // [square, sawtooth, triangle, custom?]

        osc.frequency.value = freq;
        osc.start();

        window.setTimeout(function()
        {
            osc.stop();
        }, 1000)
    }

    this.setPitches = function(pitches)
    {
        document.getElementById("pitches").innerHTML = pitches.join(", ");
    }
}

var pcSynth = new PCSynth();
