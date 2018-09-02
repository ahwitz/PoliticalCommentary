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
    var maxSilenceDuration = 3;

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
        // If pitch was cleared, end
        if (!pitch)
        {
            // (and stop/delete oscillator if it exists)
            if (this.osc)
            {
                this.osc.stop();
                delete this.osc;
            }

            return;
        }

        // If we're not changing, end it here
        var intPitch = parseInt(pitch, 10);
        if (intPitch === this.centralPitch) return;

        // Cache the pitch, start the process
        this.centralPitch = intPitch;

        // Create oscillator/start pitch playing if necessary
        // - if already created, pitch will reset on next scheduled playPitch
        if (!this.osc)
        {
            this.osc = this.context.createOscillator();
            this.osc.connect(this.gain);
            this.osc.type = 'square'; // [square, sawtooth, triangle, custom?]
            this.osc.start();

            this.playPitch();
        }
    };

    this.playPitch = function()
    {
        if (!this.osc || !this.osc.frequency.value) return;

        // Get the slider values, out of 1
        var actionValue = 1 - this.synth.getActionValue();
        var orderValue = (this.synth.getOrderValue() + 1) / 2;

        var localDurationBase = (maxDuration - minDuration) * actionValue;
        var localPitchDifference = (maxPitchDifference - minPitchDifference) * orderValue;
        var localGainBase = (maxMaxGainVolume - minMaxGainVolume) * actionValue;

        // Generate local values
        var duration = minDuration + (Math.random() * localDurationBase);
        var pitch = this.centralPitch + minPitchDifference + ((Math.random() - 0.5) * localPitchDifference);
        var loudest = minMaxGainVolume + (Math.random() * localGainBase);

        // Make the config obj
        this.pitchObj = {
            loudest: loudest,
            duration: duration,
            breakpoint: duration / 2,
            start: (new Date()).getTime()
        };

        // Set the pitch
        this.osc.frequency.value = pitch;

        console.log("Creating a new pitch: loudest gain " + this.pitchObj.loudest + "; central pitch " + this.centralPitch +
            "; random pitch " + pitch + "; duration " + this.pitchObj.duration);

        // Set the interval to update the pitch volume
        this.pitchInterval = window.setInterval(this.updatePitch.bind(this), 10);

        // Set the timeout to turn the interval off (technically unnecessary as it could behandled between playP and updateP)
        window.setTimeout(this.endPitch.bind(this), this.pitchObj.duration * 1000);
    };

    this.updatePitch = function()
    {
        // Get the amount we've elapsed so far
        var timeElapsed = ((new Date()).getTime() - this.pitchObj.start) / 1000;
        var percentElapsed = timeElapsed / this.pitchObj.duration;

        var multiplier;
        // If we're before the breakpoint, we want to get louder up to there
        if (timeElapsed <= this.pitchObj.breakpoint)
            multiplier = (percentElapsed * 2);

        // Otherwise get softer
        else
            multiplier = (2 - (percentElapsed * 2));

        // Set gain
        this.gain.gain.value = this.pitchObj.loudest * multiplier;
    };

    this.endPitch = function()
    {
        // Calculate how long we'll be silent for
        var actionValue = 1 - this.synth.getActionValue();
        var localSilenceBase = ((maxSilenceDuration - minSilenceDuration) * actionValue);
        var silenceDuration = minSilenceDuration + (Math.random() + localSilenceBase);

        console.log("Ending pitch; silent for " + silenceDuration);

        // Reset timers
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
        return parseFloat(document.getElementById("action-slider").value);
    };

    this.getOrderValue = function()
    {
        return parseFloat(document.getElementById("order-slider").value);
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
