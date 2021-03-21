var nodes = [];
var startNode;
var endNode;
var startExists = false;
var endExists = false;
var running = false;


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

  clearClasses() {
    while (document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.length > 1) {
      document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.remove(document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList[1]);
    }
  }

  clearReRun() {
    try {
      document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.remove("considered");
      document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.remove("visited");
      document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.remove("tail");
    } catch (error) {

    }
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
            // Ignore instances where attempt to make nbr of "thin air"
          }
        }
      }
    }
    this.nbrs = this.nbrs.filter(nbr => nbr !== undefined); // remove "ghost" nbrs
  }

  handleDraw(ID) {
    // Make wall if drawing
    // Make normal if erasing
    // StrokeID to make use to not infinitely switch between types

    if (!(this.usedStrokeIDs.includes(ID))) {
      this.usedStrokeIDs.push(ID);
      if (erasing && this.type === "wall") {
        this.makeNormal();
      } else if (!(erasing)) {
        this.makeWall();
      }
    }
  }

  sharesTwoWallsWith(node) {
    // Returns true if this node shares two walls with argument node

    let thisWallNbrs = this.nbrs.filter(node => node.type === "wall");
    let otherWallNbrs = node.nbrs.filter(node => node.type === "wall");
    let arr = thisWallNbrs.filter(wall => otherWallNbrs.includes(wall));

    return (arr.length > 1);
  }
}




var openSet = [];
var closedSet = [];
var curNode;
var intervalID;
const INTERVALTIME = 0; // time between each iteration in milliseconds, 0 = closest to real time

function runPathfinding(nodes) {
  hasBeenCleared = false;
  running = true;

  // Call setNbrs for all available nodes
  getAvailNodes(nodes).forEach(node => {
    node.setNbrs();
  });

  openSet = [startNode];
  closedSet = [];

  switch (selectedAlgorithm) {
    case "A*":
      intervalID = setInterval(runAstarOnce, INTERVALTIME);
      break;

    default:
      intervalID = setInterval(runDijkstraOnce, INTERVALTIME);
      break;
  }
}



// THE ALGORITHMS
function runDijkstraOnce() {
  curNode = getLowestDistance(openSet);

  if (curNode === endNode) {
    // If ended, visualise with a tail
    clearInterval(intervalID);
    visualiseCameFrom(curNode);
    running = false;
  }

  // Add curNode to closedSet and remove from openSet
  closedSet.push(curNode);
  openSet = openSet.filter(node => node != curNode);

  // Update nbr distances
  curNode.nbrs.forEach(nbr => {
    if (!(closedSet.includes(nbr))) { // if in consideration

      // fDistance represents distance to start in order to
      // still use getLowestDistance function
      provisionalfDistance = curNode.fDistance + getEuclideanDistance(curNode, nbr) + getCross(nbr) * 0.00001; // break ties by favouring a straight line from START to END
      if (!(openSet.includes(nbr)) || (provisionalfDistance < nbr.fDistance)) {
        if ((getManhattanDistance(curNode, nbr) != 1) && (curNode.sharesTwoWallsWith(nbr))) {
          // Check if two diagonally connected nodes share two walls such that:
          //  0 X 0 0
          //  0 0 X 0
          //            0 = node
          //            X = wall

          // Avoid the path slipping through gaps in the users drawn walls "unintentionally"
          nbr.cameFrom = curNode;
          nbr.fDistance = Infinity;
        } else {
          nbr.cameFrom = curNode;
          nbr.fDistance = provisionalfDistance;
        }
      }
      if (!(openSet.includes(nbr))) {
        openSet.push(nbr);
      }
      nbr.addClass("considered");
    }
  });

  curNode.addClass("visited");
}

function runAstarOnce() {
  curNode = getLowestDistance(openSet);

  // If end found
  if (curNode === endNode) {
    clearInterval(intervalID); // stop loop
    visualiseCameFrom(curNode);
    running = false;
  }

  // Add curNode to closedSet and remove from openSet
  closedSet.push(curNode);
  openSet = openSet.filter(node => node != curNode);

  // Update all nbrs distance
  curNode.nbrs.forEach(nbr => {
    if (!closedSet.includes(nbr)) { // if not already visited

      let provisionalgDistance = curNode.gDistance + getEuclideanDistance(curNode, nbr);
      if (!(openSet.includes(nbr)) || provisionalgDistance < nbr.gDistance) {
        if ((getManhattanDistance(curNode, nbr) != 1) && (curNode.sharesTwoWallsWith(nbr))) {
          // Avoid going through diagonal gaps, see equivalent for Dijkstra's
          nbr.cameFrom = curNode;
          nbr.fDistance = Infinity;
        } else {
          nbr.cameFrom = curNode;
          nbr.gDistance = provisionalgDistance;
          nbr.hDistance = getEuclideanDistance(nbr, endNode) + getCross(nbr) * 0.00001; // break ties by favouring a straight line from START to END
          nbr.fDistance = nbr.gDistance + nbr.hDistance;
        }
        if (!(openSet.includes(nbr))) {
          openSet.push(nbr);
        }

        nbr.addClass("considered");
      }
    }
  });

  curNode.addClass("visited");
}



// GET ALL NODES
function getAvailNodes(arr) {
  // Make list with ALL nodes
  let allNodesIncWalls = [];
  arr.forEach(nodeRow => {
    nodeRow.forEach(node => {
      allNodesIncWalls.push(node);
    });
  });

  // Return list without walls
  return allNodesIncWalls.filter(node => node.type != "wall");
}



// DISTANCES
function getLowestDistance(arr) {
  // Returns node with lowest f-distance from array (set)

  let lowestyet = arr[0];
  arr.forEach(node => {
    if (node.fDistance < lowestyet.fDistance) {
      lowestyet = node;
    }
  });

  return lowestyet;
}

function getManhattanDistance(node1, node2) {
  // Returns distance in Manhattan measurement

  return Math.abs(node1.x - node2.x) + Math.abs(node1.y - node2.y);
}

function getEuclideanDistance(node1, node2) {
  // Returns distance in a modified euclidean, diagonal measurement

  let dx = Math.abs(node1.x - node2.x);
  let dy = Math.abs(node1.y - node2.y);
  return (dx + dy) + (1.41421356237 - 2) * Math.min(dx, dy);
}

function getCross(node) {
  // Return how close to the "ideal" straight line between START and END a node is

  let dx1 = node.x - endNode.x;
  let dy1 = node.y - endNode.y;
  let dx2 = startNode.x - endNode.x;
  let dy2 = startNode.y - endNode.y;
  return Math.abs(dx1 * dy2 - dx2 * dy1);
}



// VISUALISE TAIL
function visualiseCameFrom(latestNode) {
  // Visualise a tail from end to finish with CSS

  let workingNode = latestNode;

  while (workingNode != startNode) {
    workingNode.addClass("tail");
    workingNode = workingNode.cameFrom;
  }
}



// HANDLE WHICH ALGORIM USED
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



// HANDLE CLEAR / RUN BUTTONS
var hasBeenCleared = true;

function handleClearButton() {
  // Reset map without reloading
  // Resets all properties of all nodes
  if (running) {
    clearInterval(intervalID); // stop loop
    running = false;
  }

  nodes.forEach(nodeRow => {
    nodeRow.forEach(node => {
      node.type = "normal";
      node.fDistance = Infinity;
      node.gDistance = Infinity;
      node.hDistance = Infinity;
      node.nbrs = [];
      node.usedStrokeIDs = [];
      node.clearClasses();
    });
  });
  startExists = false;
  endExists = false;
  startNode = undefined;
  endNode = undefined;
  hasBeenCleared = true;
}

function handleRunButton() {
  // Runs pathfinding if first run, 
  // Clear and rerun if already ran once
  // Make sure start and end exist
  if (startNode == undefined || endNode == undefined) {
    alert("Select a start and an end node!");
    return;
  }

  if (!running) {
    if (hasBeenCleared) {
      runPathfinding(nodes);
    } else {
      nodes.forEach(nodeRow => {
        nodeRow.forEach(node => {
          node.nbrs = [];
          node.usedStrokeIDs = [];
          node.clearReRun();
        });
      });

      runPathfinding(nodes);
    }
  }
}



// HANDLE MOUSE CLICKS
var strokeID = 0; // used to avoid infinite switching of type
var erasing = false;

function handleMousemove(event) {
  // Draw walls where mouse

  let coords = event.target.classList[0].split("_").pop().split("-");
  nodes[Number(coords[0])][Number(coords[1])].handleDraw(strokeID);
}

document.querySelector("table").addEventListener("mousedown", (event) => {
  strokeID++;
  if (event.shiftKey) {
    // Erase
    erasing = true;
    document.addEventListener("mousemove", handleMousemove);
  } else if (event.ctrlKey) {
    // Place START / END
    let coords = event.target.classList[0].split("_").pop().split("-");
    if (!startExists) {
      nodes[Number(coords[0])][Number(coords[1])].makeStart();
      startExists = true;
    } else if (!endExists) {
      nodes[Number(coords[0])][Number(coords[1])].makeEnd();
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



// Create HTML table with all cells that represent nodes
const HTMLTABLE = document.querySelector("table");
const SIZE = 20;

const WIDTH = window.innerWidth / SIZE;
const HEIGHT = (window.innerHeight - 100) / SIZE; // minus menu heights
let HTMLCode;
for (let y = 0; y < HEIGHT; y++) {
  HTMLCode = "<tr>";
  for (let x = 0; x < WIDTH; x++) {
    HTMLCode += `<td class='_${x}-${y}' style='width: ${SIZE}px; height: ${SIZE}px'></td>\n`;
  }
  HTMLCode += "</tr>";
  HTMLTABLE.innerHTML += HTMLCode;
}

// Create nodes array
let curNodeRow = [];
for (let x = 0; x < WIDTH; x++) {
  curNodeRow = [];
  for (let y = 0; y < HEIGHT; y++) {
    curNodeRow.push(new Node(x, y, "normal"));
  }
  nodes.push(curNodeRow);
}