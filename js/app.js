var nodes = new Array();
var startNode;
var endNode;


class Node {
  constructor(row, col, type) {
    this.row = row;
    this.col = col;
    this.pos = [this.row, this.col];
    this.type = type; // normal, wall, start, end
    this.nbrs = []; // nbring nodes
    this.distance = Infinity;
    this.cameFrom = undefined; // coords for use in pathfinding
  }

  addClass(c) {
    document.getElementsByClassName(`_${this.row}-${this.col}`)[0].classList.add(c);
  }

  makeStart() {
    startNode = this;
    this.type = "start";
    this.distance = 0; // start pathfinding at lowest distance
    this.addClass("start");
  }

  makeEnd() {
    endNode = this;
    this.type = "end";
    this.addClass("end");
  }

  makeWall() {
    this.type = "wall";
    this.addClass("wall");
  }

  setnbrs() {
    for (let i = -1; i <= 1; i += 2) {
      try {
        this.nbrs.push(nodes[this.row][this.col + i]);
      } catch (TypeError) {
        this.nbrs.push(undefined);
      }
      try {
        this.nbrs.push(nodes[this.row + i][this.col]);
      } catch (TypeError) {
        this.nbrs.push(undefined);
      }
    }
    // Filter out any non-existant nbrs
    let filtered = this.nbrs.filter(element => {
      return element !== undefined;
    });
    this.nbrs = filtered;
  }
}

var startExists = false;
var endExists = false;

function handleClick(row, col) {
  if (!startExists) {
    nodes[row][col].makeStart();
    startExists = true;
  } else if (!endExists) {
    nodes[row][col].makeEnd();
    endExists = true;
  } else {
    nodes[row][col].makeWall();
  }
}


function runDijkstras(nodes) {
  /**
   * pseudocode
   * 
   * while not found:
   * curNode = node with type start
   * if curNode is end:
   *  nice
   * else:
   *  calc d to nbrs
   *  log them
   *  choose lowest d as curNode
   */
  if (startNode == undefined | endNode == undefined) {
    return "Select a start and an end node!";
  }


  let allNodesIncWalls = [];
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].forEach(node => {
      allNodesIncWalls.push(node);
    })
  }

  availNodes = allNodesIncWalls.filter(node => {
    // Remove all walls from array
    return node.type != "wall";
  })

  availNodes.forEach(node => {
    node.setnbrs();
  });

  console.log(availNodes);

  let curNode = startNode;
  let i = 0; // while in development phase to controll
  while (availNodes.length > 0 && i < 10001) {
    if (curNode === endNode) {
      console.log("FOUND");
      break;
    }

    availNodes.sort((a, b) => a.distance - b.distance);
    curNode = availNodes[0]; // curNode is lowest distance
    availNodes.splice(0, 1); // remove curNode

    curNode.nbrs.forEach(nbr => {
      if (availNodes.includes(nbr)) {
        // Update distance for all nbrs 
        nbr.distance = curNode.distance + getDistance(curNode, nbr);
        if (curNode != endNode) {
          nbr.addClass("visited");
        }
      }
    });

    i++;
  }
}


// Unused rn
function wait(ms) {
  let start = new Date().getTime();
  let end = start;
  while (end < start + ms) {
    end = new Date().getTime();
  }
}


function getDistance(node1, node2) {
  let [x1, y1] = node1.pos;
  let [x2, y2] = node2.pos;
  let d = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  return d;
}


// Create table and nodes
const HTMLTABLE = document.querySelector("table");
rows = 15;
cols = 25;
let HTMLCode;
let curNodeRow = [];
for (let row = 0; row < rows; row++) {
  curNodeRow = []; // empty array
  HTMLCode = "<tr>";
  for (let col = 0; col < cols; col++) {
    HTMLCode += `<td onclick=(handleClick(${row},${col})) class='_${row}-${col}'></td>\n`;
    curNodeRow.push(new Node(row, col, "normal"));
  }
  HTMLCode += "</tr>";
  HTMLTABLE.innerHTML += HTMLCode;

  nodes.push(curNodeRow);
}


// Identify cells by coordinates
// document.getElementsByClassName("_1-1")[0].classList.add("visited");