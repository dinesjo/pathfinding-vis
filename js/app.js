var nodes = [];
rows = 15;
cols = 25;
const TABLE = document.querySelector("table");
let i;
var startExists = false;
var endExists = false;

class Node {
  constructor(row, col, type) {
    this.row = row;
    this.col = col;
    this.type = type; // normal, wall, start, end
  }

  makeStart() {
    if (!startExists) {
      this.type = "start";
      document.getElementsByClassName(`_${this.row}-${this.col}`)[0].classList.add("start");
      startExists = true;
    } else if (!endExists) {
      this.type = "end";
      document.getElementsByClassName(`_${this.row}-${this.col}`)[0].classList.add("end");
      endExists = true;
    }
  }
}

function handleClick(row, col) {
  nodes[row][col].makeStart();
}

for (let row = 0; row < rows; row++) {
  var currentRow = [];
  i = "<tr>";
  for (let col = 0; col < cols; col++) {
    i += `<td onclick=(handleClick(${row},${col})) class='_${row}-${col}'></td>\n`;
    currentRow.push(new Node(row, col, "normal"));
  }
  i += "</tr>";
  TABLE.innerHTML += i;

  nodes.push(currentRow);
}

// // Two ways to identify cells by coordinates
// document.getElementsByClassName("_1-1")[0].classList.add("visited");
// document.querySelectorAll("tbody")[2].querySelectorAll("td")[4].classList.add("visited");

/**
 * Returns distance from node 1 to node 2
 * @param {Array} node1 - Coords.
 * @param {Array} node2 - Coords.
 */
function distance(node1, node2) {
  let [x1, y1] = node1;
  let [x2, y2] = node2;
  let d = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  return d;
}