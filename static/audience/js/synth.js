function pitchController(synthRef)
{
    this.osc;
    this.gain;
    this.synth = synthRef;
    this.context = this.synth.audioContext;

    this.gain = this.context.createGain();
    this.gain.connect(this.context.destination);
    this.gain.gain.value = 0.05;

    this.end = function()
    {
        this.osc.stop();
    };

    this.updatePitch = function(pitch)
    {
        if (this.osc && !pitch)
        {
            this.osc.stop();
            delete this.osc;
            return;
        }

        if (!this.osc)
        {
            this.osc = this.context.createOscillator();
            this.osc.connect(this.gain);
            this.osc.type = 'square'; // [square, sawtooth, triangle, custom?]
            this.osc.start();
        }
        
        this.osc.frequency.value = pitch;
    };
}

function PCSynth ()
{
    this.audioContext = new (window.AudioContext || window.webkitAudioContext);

    this.actionValue = 0;
    this.orderValue = 0;

    this.controllers = [];
    for (var i = 0; i < 4; i++)
    {
        this.controllers.push(new pitchController(this));
    }

    this.end = function()
    {
        for (var i = 0; i < 4; i++)
        {
            this.controllers[i].end();
        }
    };

    this.updatePower = function()
    {
        this.actionValue = actionSlider.value;
        this.orderValue = orderSlider.value;

        socket.send(JSON.stringify({
            type: 'power',
            data: {
                action: this.actionValue,
                order: this.orderValue
            }
        }));
    };

    this.setPitches = function(newPitches)
    {
        for (var i = 0; i < 4; i++)
        {
            var newPitch = newPitches[i];
            this.controllers[i].updatePitch(newPitch);
        }

        document.getElementById("pitches").innerHTML = newPitches.join(", ");
    };
}

var pcSynth = new PCSynth();
