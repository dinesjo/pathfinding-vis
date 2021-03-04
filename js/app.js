var nodes = [];
var startNode;
var endNode;
var startExists = false;
var endExists = false;

var strokeID = 0;
var erasing = false;

function handleMousemove(event) {
  let c = event.target.classList[0].split("_").pop().split("-");
  nodes[Number(c[0])][Number(c[1])].handleDraw(strokeID);
}

document.querySelector("table").addEventListener("mousedown", (event) => {
  strokeID++;
  if (event.shiftKey) {
    // Erase
    erasing = true;
    document.addEventListener("mousemove", handleMousemove);
  } else if (event.altKey) {
    // Start / End
    let c = event.target.classList[0].split("_").pop().split("-");
    if (!startExists) {
      nodes[Number(c[0])][Number(c[1])].makeStart();
      startExists = true;
    } else if (!endExists) {
      nodes[Number(c[0])][Number(c[1])].makeEnd();
      endExists = true;
    }
  } else {
    // Draw Walls
    erasing = false;
    document.addEventListener("mousemove", handleMousemove);
  }
});
document.addEventListener("mouseup", () => {
  document.removeEventListener("mousemove", handleMousemove);
});


class Node {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.pos = [this.x, this.y];
    this.type = type; // normal, wall, start, end
    this.nbrs = []; // nbring nodes
    this.fDistance = Infinity;
    this.gDistance = Infinity;
    this.hDistance = Infinity;
    this.cameFrom = undefined; // coords for use in pathfinding
    this.usedStrokeIDs = [];
  }


  addClass(c) {
    document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.add(c);
  }

  makeStart() {
    startNode = this;
    this.type = "start";
    this.fDistance = 0; // start at lowest distance
    this.gDistance = 0;
    this.hDistance = 0;
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
    document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.remove("wall");
  }

  setNbrs() {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (!(i === 0 && j === 0)) {
          try {
            this.nbrs.push(nodes[this.x + i][this.y + j]);
          } catch (TypeError) {

          }
        }
      }
    }
    this.nbrs = this.nbrs.filter(el => { // remove "ghost" nodes
      return el !== undefined;
    })
  }

  handleDraw(ID) {
    if (!(this.usedStrokeIDs.includes(ID))) {
      this.usedStrokeIDs.push(ID);
      if (erasing && this.type === "wall") {
        this.makeNormal();
      } else if (!(erasing)) {
        this.makeWall();
      }
    }
  }
}


function getAvailNodes(arr) {
  // Make list with ALL nodes
  let allNodesIncWalls = [];
  arr.forEach(nodeRow => {
    nodeRow.forEach(node => {
      allNodesIncWalls.push(node);
    })
  })
  // Return list without walls
  return allNodesIncWalls.filter(node => {
    return node.type != "wall";
  })
}

var openSet = [];
var closedSet = [];
var curNode;
var id;
var intervalTime = 0; // time between each iteration in milliseconds, 0 = real time

function runPathfinding(nodes) {
  // Make sure start and end exist
  if (startNode == undefined || endNode == undefined) {
    alert("Select a start and an end node!");
    return;
  }

  // Call setNbrs for all available nodes
  getAvailNodes(nodes).forEach(node => {
    node.setNbrs();
  });

  openSet = [startNode];
  closedSet = [];
  curNode = getLowestDistance(openSet);

  switch (selectedAlgorithm) {
    case "A*":
      id = setInterval(runAstarOnce, intervalTime);
      break;

    default:
      id = setInterval(runDijkstraOnce, intervalTime);
      break;
  }
}

function runDijkstraOnce() {
  curNode = getLowestDistance(openSet);

  if (curNode === endNode) {
    // If ended, visualise with a tail
    clearInterval(id);
    visualiseCameFrom(curNode);
  }

  // Add curNode to closedSet and remove from openSet
  closedSet.push(curNode);
  openSet = openSet.filter(node => {
    return node != curNode;
  });

  // Update nbr distances
  curNode.nbrs.forEach(nbr => {
    if (!(closedSet.includes(nbr))) { // if in consideration

      // fDistance represents distance to start in order to
      // still use getLowestDistance function
      provisionalfDistance = curNode.fDistance + getEuclideanDistance(curNode, nbr);
      if (!(openSet.includes(nbr)) || (provisionalfDistance < nbr.fDistance)) {
        nbr.cameFrom = curNode;
        nbr.fDistance = provisionalfDistance;
      }
      if (!(openSet.includes(nbr))) {
        openSet.push(nbr);
      }
      nbr.addClass("considered"); // CSS
    }
  });

  curNode.addClass("visited");
}

function runAstarOnce() {
  curNode = getLowestDistance(openSet);

  if (curNode === endNode) {
    // If ended, visualise with a tail
    clearInterval(id);
    visualiseCameFrom(curNode);
  }

  // Add curNode to closedSet and remove from openSet
  closedSet.push(curNode);
  openSet = openSet.filter(node => {
    return node != curNode;
  });

  // Update each nbrs distance
  curNode.nbrs.forEach(nbr => {
    if (!closedSet.includes(nbr)) { // if in consideration
      
      let provisionalgDistance = curNode.gDistance + getEuclideanDistance(curNode, nbr);
      if (!(openSet.includes(nbr)) || provisionalgDistance < nbr.gDistance) {
        nbr.cameFrom = curNode;
        nbr.gDistance = provisionalgDistance;
        nbr.hDistance = getDistance(nbr, endNode);
        nbr.fDistance = nbr.gDistance + nbr.hDistance;
        if (!(openSet.includes(nbr))) {
          openSet.push(nbr);
        }
        nbr.addClass("considered"); // CSS
      }
    }
  });

  curNode.addClass("visited"); // CSS
}


function getLowestDistance(arr) {
  // Returns node with lowers f-cost, 
  // if two are equal choose closest to
  // end by Euclidean distance

  let lowestyet = arr[0];
  arr.forEach(node => {
    if (node.fDistance === lowestyet.fDistance) {
      if (node.hDistance === lowestyet.hDistance) {
        if (getEuclideanDistance(node, endNode) < getEuclideanDistance(lowestyet, endNode)) {
          lowestyet = node;
        }
      }
    } else if (node.fDistance < lowestyet.fDistance) {
      lowestyet = node;
    }
  })

  return lowestyet;
}

function visualiseCameFrom(latestNode) {
  // Visualise a tail from end to finish with CSS

  let workingNode = latestNode;

  while (workingNode != startNode) {
    workingNode.addClass("tail"); // CSS
    workingNode = workingNode.cameFrom; // get its cameFrom
  }
}


function getDistance(node1, node2) {
  // Returns distance in manhattan measurement

  return Math.abs(node1.x - node2.x) + Math.abs(node1.y - node2.y);
}

function getEuclideanDistance(node1, node2) {
  // Returns distance in Euclidean measurement
  
  return Math.sqrt(Math.pow((node2.x - node1.x), 2) + Math.pow((node2.y - node1.y), 2));
}


var selectedAlgorithm = "Dijkstra's";

function changeAlgorithm() {
  // Change algorithm and refresh display

  const curAlgorithm = document.getElementById("changeAlgorithm");

  switch (curAlgorithm.innerHTML) {
    case "Dijkstra's":
      selectedAlgorithm = "A*";
      break;
    case "A*":
      selectedAlgorithm = "Dijkstra's";
      break;
  }
  // Update display
  document.querySelectorAll("button")[2].innerHTML = selectedAlgorithm;
  curAlgorithm.innerHTML = selectedAlgorithm;
}



// Create HTML table with all cells that represent nodes
const HTMLTABLE = document.querySelector("table");
const SIZE = 20;

let width = window.innerWidth / SIZE;
let height = (window.innerHeight - 150) / SIZE; // minus nav height
let HTMLCode;
for (let y = 0; y < height; y++) {
  HTMLCode = "<tr>";
  for (let x = 0; x < width; x++) {
    HTMLCode += `<td class='_${x}-${y}' style='width: ${SIZE}px; height: ${SIZE}px'></td>\n`;
  }
  HTMLCode += "</tr>";
  HTMLTABLE.innerHTML += HTMLCode;
}

// Create nodes array
let curNodeRow = [];
for (let x = 0; x < width; x++) {
  curNodeRow = [];
  for (let y = 0; y < height; y++) {
    curNodeRow.push(new Node(x, y, "normal"));
  }
  nodes.push(curNodeRow);
}