function pitchController(synthRef)
{
    // WebAudio stuff
    this.osc;
    this.gain;
    this.synth = synthRef;
    this.context = this.synth.audioContext;

    // Volume controls
    var maxGainVolume = 0.05;
    this.gain = this.context.createGain();
    this.gain.connect(this.context.destination);
    this.gain.gain.value = 0;

    // Pitch-playing information
    this.pitchStartTime;
    this.pitchInterval;
    this.pitchObj;

    this.end = function()
    {
        if (this.osc)
            this.osc.stop();
    };

    this.setPitch = function(pitch)
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
            // this.osc.start();
        }
        
        this.osc.frequency.value = pitch;
        this.playPitch();
    };

    this.playPitch = function()
    {
        // Generate the config object for the current pitch
        this.pitchStartTime = (new Date()).getTime();
        this.pitchObj = {
            loudest: Math.random() * 0.05,
            pitch: ((Math.random() - 0.5) * 20) + this.osc.frequency.value,
            duration: Math.random() * 5
        };

        console.log("Creating a new pitch: loudest gain " + this.pitchObj.loudest + "; central pitch " + this.osc.frequency.value +
            "; random pitch " + this.pitchObj.pitch + "; duration " + this.pitchObj.duration);

        // Set the interval to update the pitch volume
        this.pitchInterval = window.setInterval(this.updatePitch.bind(this), 100);

        // Set the timeout to turn the interval off (technically unnecessary as it could behandled between playP and updateP)
        window.setTimeout(this.endPitch.bind(this), this.pitchObj.duration * 1000);
    };

    this.updatePitch = function()
    {

    };

    this.endPitch = function()
    {
        console.log("Ending pitch.");
        window.clearInterval(this.pitchInterval);
        this.playPitch();
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
            this.controllers[i].setPitch(newPitch);
        }

        document.getElementById("pitches").innerHTML = newPitches.join(", ");
    };
}

var pcSynth = new PCSynth();
