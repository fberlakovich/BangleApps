// check for alarms
(function () {

    var settings = {};
    var buzzCount = 19;

    function buzz() {
        Bangle.setLCDPower(1);
        Bangle.buzz().then(() => {
            if (buzzCount--) {
                setTimeout(buzz, 500);
            } else {
                // reload to configure for next alarm after finish
                reload();
            }
        });
    }

    // Sleep/Wake detection with Estimation of Stationary Sleep-segments (ESS):
    // Marko Borazio, Eugen Berlin, Nagihan Kücükyildiz, Philipp M. Scholl and Kristof Van Laerhoven, "Towards a Benchmark for Wearable Sleep Analysis with Inertial Wrist-worn Sensing Units", ICHI 2014, Verona, Italy, IEEE Press, 2014.
    // https://ubicomp.eti.uni-siegen.de/home/datasets/ichi14/index.html.en
    //
    // Function needs to be called for every measurement but returns a value at maximum once a second (see winwidth)
    // start of sleep marker is delayed by sleepthresh due to continous data reading
    const winwidth = 13;
    const nomothresh = 0.006;
    const sleepthresh = 600;
    var ess_values = [];
    var slsnds = 0;

    function calc_ess(val) {
        ess_values.push(val);

        if (ess_values.length == winwidth) {
            // calculate standard deviation over ~1s
            const mean = ess_values.reduce((prev, cur) => cur + prev) / ess_values.length;
            const stddev = Math.sqrt(ess_values.map(val => Math.pow(val - mean, 2)).reduce((prev, cur) => prev + cur) / ess_values.length);
            ess_values = [];

            // check for non-movement according to the threshold
            const nonmot = stddev < nomothresh;

            // amount of seconds within non-movement sections
            if (nonmot) {
                slsnds += 1;
                if (slsnds >= sleepthresh) {
                    return true; // awake
                }
            } else {
                slsnds = 0;
                return false; // sleep
            }
        }
    }


    var alarms = require('Storage').readJSON('alarm.json', 1) || [];
    var time = new Date();
    var active = alarms.filter(a => a.on);
    if (active.length) {
        active = active.sort((a, b) => (a.hr - b.hr) + (a.last - b.last) * 24);
        var hr = time.getHours() + (time.getMinutes() / 60) + (time.getSeconds() / 3600);
        if (!require('Storage').read("alarm.js")) {
            console.log("No alarm app!");
            require('Storage').write('alarm.json', "[]");
        } else {
            var t = 3600000 * (active[0].hr - hr);
            if (active[0].last == time.getDate() || t < 0) t += 86400000;
            if (t < 1000) t = 1000;

            Bangle.loadWidgets();
            Bangle.drawWidgets();

            var widget = WIDGETS["alarm"];
            if (active[0].sp) {

                var minAlarm = new Date();

                // minimum alert 30 minutes early
                minAlarm.setTime(time.getTime() + t - (30 * 60 * 1000));
                setInterval(function () {
                    const now = new Date();
                    const acc = Bangle.getAccel().mag;
                    const swest = calc_ess(acc);
                    if (swest !== undefined) {
                        if (Bangle.isLCDOn()) {

                            if (widget) {
                                widget.setStatus(swest ? 1 : 2);
                            }
                        }
                    }

                    if (now >= minAlarm && swest === false) {
                        buzz();
                    }
                }, 80); // 12.5Hz)
            } else {
                widget.setStatus(0);
            }

            /* execute alarm at the correct time. We avoid execing immediately
            since this code will get called AGAIN when alarm.js is loaded. alarm.js
            will then clearInterval() to get rid of this call so it can proceed
            normally. */
            setTimeout(function () {
                load("alarm.js");
            }, t);
        }
    }
})();
