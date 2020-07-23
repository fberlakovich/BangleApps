(() => {
  var settings = {};
  var hrmToggle = true; // toggles once for each reading
  var current = 0;
  var recFile; // file for heart rate recording
  var width = 24;

  // draw your widget
  function draw() {
    if (!settings.isRecording) return;
    g.reset();
    g.setFont("6x8", 1);
    g.setFontAlign(-1, 0);
    g.clearRect(this.x,this.y,this.x+width,this.y+23); // erase background
    g.setColor(hrmToggle?"#ff0000":"#ff8000");
    g.drawString(current, this.x+5, this.y+10);
    g.setColor(-1); // change color back to be nice to other apps
  }

  function onHRM(hrm) {
    hrmToggle = !hrmToggle;
    current = hrm.bpm
    WIDGETS["heart"].draw();
    if (recFile) recFile.write([getTime().toFixed(0),hrm.bpm,hrm.confidence].join(",")+"\n");
  }

  // Called by the heart app to reload settings and decide what's
  function reload() {
    settings = require("Storage").readJSON("heart.json",1)||{};
    settings.fileNbr |= 0;

    Bangle.removeListener('HRM',onHRM);
    if (settings.isRecording) {
      WIDGETS["heart"].width = 24;
      Bangle.on('HRM',onHRM);
      Bangle.setHRMPower(1);
      var n = settings.fileNbr.toString(36);
      recFile = require("Storage").open(".heart"+n,"a");
    } else {
      WIDGETS["heart"].width = 0;
      Bangle.setHRMPower(0);
      recFile = undefined;
    }
  }
  // add the widget
  WIDGETS["heart"]={area:"tl",width:24,draw:draw,reload:function() {
    reload();
    Bangle.drawWidgets(); // relayout all widgets
  }};
  // load settings, set correct widget width
  reload();
})()
