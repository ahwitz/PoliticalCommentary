function PCSynth ()
{
    var oscillators = [];
    var audioContext = new (window.AudioContext || window.webkitAudioContext);

    var masterGainNode = audioContext.createGain();
    masterGainNode.connect(audioContext.destination);
    masterGainNode.gain.value = 0.1;

    this.setPitches = function(newPitches)
    {
        for (var i = 0; i < 4; i++)
        {
            var newPitch = newPitches[i];
            var osc = oscillators[i];
            if (osc && !newPitch)
            {
                osc.stop();
                delete oscillators[i];
                continue;
            }

            if (!osc)
            {
                osc = audioContext.createOscillator();
                osc.connect(masterGainNode);
                osc.type = 'square'; // [square, sawtooth, triangle, custom?]
                osc.start();

                oscillators[i] = osc;
            }

            osc.frequency.value = newPitch;
        }

        document.getElementById("pitches").innerHTML = newPitches.join(", ");
    }
}

var pcSynth = new PCSynth();
