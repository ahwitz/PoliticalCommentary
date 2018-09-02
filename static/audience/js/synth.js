function pitchController(synthRef)
{
    // Preferences
    var minMaxGainVolume = 0.02;
    var maxMaxGainVolume = 0.05;

    var minPitchDifference = 0;
    var maxPitchDifference = 60;

    var minDuration = 2;
    var maxDuration = 6;

    var minSilenceDuration = 2;
    var maxSilenceDuration = 4;

    // WebAudio stuff
    this.osc;
    this.gain;
    this.synth = synthRef;
    this.context = this.synth.audioContext;

    // Volume controls
    this.gain = this.context.createGain();
    this.gain.connect(this.context.destination);
    this.gain.gain.value = 0;

    // Pitch-playing information
    this.centralPitch;
    this.pitchInterval;
    this.pitchObj;

    this.end = function()
    {
        if (this.osc)
            this.osc.stop();
    };

    this.setPitch = function(pitch)
    {
        if (!pitch)
        {
            if (this.osc)
            {
                this.osc.stop();
                delete this.osc;
            }

            return;
        }

        if (!this.osc)
        {
            this.osc = this.context.createOscillator();
            this.osc.connect(this.gain);
            this.osc.type = 'square'; // [square, sawtooth, triangle, custom?]
            this.osc.start();
        }

        this.centralPitch = parseInt(pitch, 10);
        this.playPitch();
    };

    this.playPitch = function()
    {
        if (!this.osc || !this.osc.frequency.value) return;

        // Get the slider values, out of 1
        var actionValue = 1 - this.synth.getActionValue();
        var orderValue = (this.synth.getOrderValue() + 1) / 2;

        var localDurationBase = ((maxDuration - minDuration) * actionValue);
        var localPitchDifference = ((maxPitchDifference - minPitchDifference) * orderValue);

        // Generate the config object for the current pitch
        var duration = minDuration + (Math.random() * localDurationBase);
        var pitch = this.centralPitch + minPitchDifference + ((Math.random() - 0.5) * localPitchDifference);

        this.pitchObj = {
            loudest: Math.random() * maxMaxGainVolume,
            pitch: pitch,
            duration: duration,
            breakpoint: duration / 2,
            start: (new Date()).getTime()
        };

        this.osc.frequency.value = pitch;

        console.log("Creating a new pitch: loudest gain " + this.pitchObj.loudest + "; central pitch " + this.centralPitch +
            "; random pitch " + this.pitchObj.pitch + "; duration " + this.pitchObj.duration);

        // Set the interval to update the pitch volume
        this.pitchInterval = window.setInterval(this.updatePitch.bind(this), 10);

        // Set the timeout to turn the interval off (technically unnecessary as it could behandled between playP and updateP)
        window.setTimeout(this.endPitch.bind(this), this.pitchObj.duration * 1000);
    };

    this.updatePitch = function()
    {
        var timeElapsed = ((new Date()).getTime() - this.pitchObj.start) / 1000;
        var percentElapsed = timeElapsed / this.pitchObj.duration;

        var multiplier;
        if (timeElapsed <= this.pitchObj.breakpoint)
        {
            multiplier = (percentElapsed * 2);
        }
        else
        {
            multiplier = (2 - (percentElapsed * 2));
        }

        var gainVal = this.pitchObj.loudest * multiplier;
        this.gain.gain.value = gainVal;
    };

    this.endPitch = function()
    {
        // Calculate how long we'll be silent for
        var actionValue = 1 - this.synth.getActionValue();
        var localSilenceBase = ((maxSilenceDuration - minSilenceDuration) * actionValue);

        var silenceDuration = minSilenceDuration + (Math.random() + localSilenceBase);

        console.log("Ending pitch; silent for " + silenceDuration);

        window.clearInterval(this.pitchInterval);
        window.setTimeout(this.playPitch.bind(this), silenceDuration * 1000);
    };
}

function PCSynth ()
{
    this.audioContext = new (window.AudioContext || window.webkitAudioContext);

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

    this.getActionValue = function()
    {
        return document.getElementById("action-slider").value;
    };

    this.getOrderValue = function()
    {
        return document.getElementById("order-slider").value;
    };

    this.updatePower = function()
    {
        socket.send(JSON.stringify({
            type: 'power',
            data: {
                action: this.getActionValue(),
                order: this.getOrderValue()
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
