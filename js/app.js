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
    this.distance = 0; // start at lowest distance
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

  makeNormal() {
    this.type = "normal";
    document.getElementsByClassName(`_${this.row}-${this.col}`)[0].classList.remove("wall");
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
    // Filter out "ghost" nbrs
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
    // toggle wall
    if (nodes[row][col].type === "normal") {
      nodes[row][col].makeWall();
    } else {
      nodes[row][col].makeNormal();
    }
  }
}

function getAvailNodes(nodes) {
  // Make list with all nodes
  let allNodesIncWalls = [];
  nodes.forEach(nodeRow => {
    nodeRow.forEach(node => {
      allNodesIncWalls.push(node);
    })
  })
  // Return list without walls
  return allNodesIncWalls.filter(node => {
    return node.type != "wall";
  })
}

function runDijkstras(nodes) {
  // Make sure start and end exist
  if (startNode == undefined | endNode == undefined) {
    alert("Select a start and an end node!");
    return;
  }

  let availNodes = getAvailNodes(nodes);

  // Call set nbrs
  availNodes.forEach(node => {
    node.setnbrs();
  });

  let curNode;
  while (availNodes.length > 0) {
    // If ended
    if (curNode === endNode) {
      // Visualise with "breadcrumbs"
      let workingNode = endNode;

      while (workingNode != startNode) {
        // Add class and get its cameFrom node
        workingNode.addClass("tail");
        workingNode = workingNode.cameFrom;
      }

      break;
    }

    availNodes.sort((a, b) => a.distance - b.distance); // sort nodes by distance
    curNode = availNodes[0]; // set curNode to lowest distance
    availNodes.splice(0, 1); // remove previous node from array

    // Update each nbr
    curNode.nbrs.forEach(nbr => {
      if (availNodes.includes(nbr)) { // only if nbr is valud
        // Update distance for nbr
        nbr.distance = curNode.distance + getDistance(curNode, nbr);
        nbr.cameFrom = curNode;
      }
    });

    curNode.addClass("visited");
  }
}

function runAStar(nodes) {

}

function runSelectedAlgorithm() {
  const selectedAlgorithm = document.getElementsByClassName("curAlgorithm")[0];
  switch (selectedAlgorithm.innerHTML) {
    case "Dijkstra's":
      runDijkstras(nodes);
      break;
    case "A*":
      runAStar(nodes);
      break;
  }
}

function getDistance(node1, node2) {
  let [x1, y1] = node1.pos;
  let [x2, y2] = node2.pos;
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function changeAlgorithm() {
  const curAlgorithm = document.getElementsByClassName("curAlgorithm")[0];
  switch (curAlgorithm.innerHTML) {
    case "Dijkstra's":
      curAlgorithm.innerHTML = "A*";
      break;
    case "A*":
      curAlgorithm.innerHTML = "Dijkstra's";
      break;
  }
}

// Create table and nodes
const HTMLTABLE = document.querySelector("table");
rows = 15;
cols = 25;
let HTMLCode;
let curNodeRow = [];
for (let row = 0; row < rows; row++) {
  curNodeRow = [];
  HTMLCode = "<tr>";
  for (let col = 0; col < cols; col++) {
    HTMLCode += `<td onclick=(handleClick(${row},${col})) class='_${row}-${col}'></td>\n`;
    curNodeRow.push(new Node(row, col, "normal"));
  }
  HTMLCode += "</tr>";
  HTMLTABLE.innerHTML += HTMLCode;

  nodes.push(curNodeRow);
}