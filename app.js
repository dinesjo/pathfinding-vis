var grid = [];

// Draw grid using a table
// Coordinates by classname in format "_x-y"
const TABLE = document.querySelector("table");
let rows = (window.innerHeight - 86) / 42;
let cols = window.innerWidth / 40;

var row;
for (let i = 0; i < rows; i++) {
  row = "<tr>";
  for (let j = 0; j < cols; j++) {
    grid.push([i, j]);
    row += `<td class='_${j}-${i}'></td>\n`;
  }
  row += "</tr>";
  TABLE.innerHTML += row;
}

// Two ways to identify cells by coordinates
document.getElementsByClassName("_1-1")[0].classList.add("visited");
document.querySelectorAll("tbody")[2].querySelectorAll("td")[4].classList.add("visited");


function distance(node1, node2) {
  /**
   * Returns distance from node1 to node2.
   */
  let [x1, y1] = node1;
  let [x2, y2] = node2;
  let d = Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
  return d;
}

