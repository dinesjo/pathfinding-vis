var cb = false;
var cbButton = document.getElementById("toggleColorblind");
var clearObj = document.getElementById("clearObjectives");
var greens = document.getElementsByClassName("green");
var reds = document.getElementsByClassName("red");
var start = document.getElementsByClassName("start");
var end = document.getElementsByClassName("end");
var defaultCbButtonBGColor = cbButton.style.backgroundColor;

function toggleColorblind() {
  if (!cb) {
    // apply colorblind mode
    cbButton.innerText = "On";
    cbButton.style.backgroundColor = "deeppink";
    cbButton.style.fontSize = "1.2em";
    cbButton.style.fontWeight = "bold";
    clearObj.classList.add("cb");
    greens[0].classList.add("cb");
    reds[0].classList.add("cb");
    try {
      start[0].classList.add("cb");
      end[0].classList.add("cb");
    } catch (TypeError) {} // if either start or end not yet placed
    
    cb = true;
  } else {
    // Reset to default
    cbButton.innerText = "Off";
    cbButton.style.backgroundColor = defaultCbButtonBGColor;
    cbButton.style.fontSize = "1em";
    cbButton.style.fontWeight = "normal";
    clearObj.classList.remove("cb");
    greens[0].classList.remove("cb");
    reds[0].classList.remove("cb");
    try {
      start[0].classList.remove("cb");
      end[0].classList.remove("cb");
    } catch (TypeError) {} // if either start or end not yet placed

    cb = false;
  }
}

