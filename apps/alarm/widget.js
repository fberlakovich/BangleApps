(() => {
    var alarms = require('Storage').readJSON('alarm.json', 1) || [];
    alarms = alarms.filter(alarm => alarm.on);
    if (!alarms.length) return; // no alarms, no widget!
    delete alarms;
    var color = "#ffffff";
    var widget = {
        area: "tl",
        width: 24,
        draw: function () {
            g.setColor(color);
            g.drawImage(atob("GBgBAAAAAAAAABgADhhwDDwwGP8YGf+YMf+MM//MM//MA//AA//AA//AA//AA//AA//AB//gD//wD//wAAAAADwAABgAAAAAAAAA"), this.x, this.y);
            g.setColor(-1);
        },
        setStatus: function (status) {
            switch (status) {
                case 0:
                    color = "#ffffff";
                    break;
                case 1:
                    color = "#00aa00";
                    break;
                case 2:
                    color = "#aa0000";
                    break;
            }
            widget.draw();
        }
    };
    WIDGETS["alarm"] = widget;
})()
