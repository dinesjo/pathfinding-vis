var nodes = [];
var startNode;
var endNode;
var startExists = false;
var endExists = false;
var running = false;


class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.pos = [this.x, this.y];
    this.type = "normal"; // normal, wall, start, end
    this.nbrs = []; // nbring nodes
    this.fDistance = Infinity;
    this.gDistance = Infinity;
    this.hDistance = Infinity;
    this.cameFrom = undefined;
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

  clearVisualisation() {
    if (this.cameFrom != undefined) {
      try {
        document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.remove("considered");
        document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.remove("visited");
        document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.remove("tail");
      } catch (error) { }
    }
  }

  makeStart() {
    startNode = this;
    this.type = "start";
    this.fDistance = 0; // start at lowest distance
    this.gDistance = 0;
    this.hDistance = 0;
    this.addClass("start");
    if (cb) {this.addClass("cb");}
  }
  
  makeEnd() {
    endNode = this;
    this.type = "end";
    this.addClass("end");
    if (cb) {this.addClass("cb");}
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
          } catch (TypeError) { } // Ignore instances where attempt to make nbr outside of table
        }
      }
    }
    this.nbrs = this.nbrs.filter(nbr => nbr !== undefined); // remove "ghost" nbrs
  }

  handleDraw(ID) {
    // Make wall if drawing, make normal if erasing
    // StrokeID to make use to not infinitely switch between types
    if (!(this.usedStrokeIDs.includes(ID))) {
      this.usedStrokeIDs.push(ID);
      if (erasing && this.type === "wall") {
        this.makeNormal();
      } else if (!erasing) {
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
  getNonWallNodes(nodes).forEach(node => {
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

  // END
  if (curNode === endNode) {
    clearInterval(intervalID); // stop loop
    visualiseCameFrom(curNode);
    running = false;
  } else if (curNode === undefined) {
    // End if path can't be found
    clearInterval(intervalID);
    running = false;
    alert("A path between the two objectives could not be found. Ensure there is a route available and try again.");
    return;
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

  // END
  if (curNode === endNode) {
    clearInterval(intervalID); // stop loop
    visualiseCameFrom(curNode);
    running = false;
  } else if (curNode === undefined) {
    // End if path can't be found
    clearInterval(intervalID);
    running = false;
    alert("A path between the two objectives could not be found. Ensure there is a route available and try again.");
    return;
  }

  // Add curNode to closedSet and remove from openSet
  closedSet.push(curNode);
  openSet = openSet.filter(node => node != curNode);

  // Update all nbrs distance
  curNode.nbrs.forEach(nbr => {
    if (!(closedSet.includes(nbr))) { // if not already visited

      let provisionalgDistance = curNode.gDistance + getEuclideanDistance(curNode, nbr);
      if (!(openSet.includes(nbr)) || (provisionalgDistance < nbr.gDistance)) {
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



// GET NON-WALL NODES
function getNonWallNodes(arr) {
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
  // Returns node with lowest f-distance from array (set),
  // if distance is infinite, return undefined

  let lowestyet = arr[0];
  arr.forEach(node => {
    if (node.fDistance < lowestyet.fDistance) {
      lowestyet = node;
    }
  });

  if (lowestyet === undefined || lowestyet.fDistance === Infinity) {
    return undefined;
  }

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

var workingNode;
var intervalID2

function visualiseCameFrom(latestNode) {
  // Visualise a tail from end to finish
  workingNode = latestNode;

  intervalID2 = setInterval(visualiseCameFromIteration, 7);
}

function visualiseCameFromIteration() {
  if (workingNode != startNode) {
    workingNode.addClass("tail");
    workingNode = workingNode.cameFrom;
  } else {
    clearInterval(intervalID2);
  }
}



// HANDLE WHICH ALGORIM USED
var selectedAlgorithm = "A*";
function changeAlgorithm() {
  // Change algorithm used and update text

  const curAlgorithm = document.getElementById("changeAlgorithm");

  switch (curAlgorithm.innerHTML) {
    case "Dijkstra's":
      selectedAlgorithm = "A*";
      break;
    case "A*":
      selectedAlgorithm = "Dijkstra's";
      break;
  }
  // Update text
  curAlgorithm.innerHTML = selectedAlgorithm;
}



// HANDLE CLEAR / RUN BUTTONS
var hasBeenCleared = true;

function handleClearWallsButton() {
  // Reset walls
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
  
  if (endNode) { // if objectives exist
    startNode.makeStart();
    endNode.makeEnd();
  }
  hasBeenCleared = true;
}

function handleClearObjectivesButton() {
  // Stop loop if running
  if (running) {
    clearInterval(intervalID);
    running = false;
  }
  
  // Reset objectives
  try {
    [startNode, endNode].forEach(node => {
      node.type = "normal";
      node.fDistance = Infinity;
      node.gDistance = Infinity;
      node.hDistance = Infinity;
      node.nbrs = [];
      node.usedStrokeIDs = [];
      node.clearClasses();
    });
  } catch (TypeError) { } // catch if startNode or endNode is undefined

  getNonWallNodes(nodes).forEach(node => {
    node.clearVisualisation();
  })

  startExists = false;
  endExists = false;
  startNode = undefined;
  endNode = undefined;
}

function handleRunButton() {
  // Runs pathfinding if first run, 
  // Clear and rerun if already ran once,
  // Restart if already running
  if (startNode == undefined || endNode == undefined) {
    // Make sure start and end exist
    alert("Select a start and an end node!");
    return;
  }

  // If running, stop
  if (running) {
    clearInterval(intervalID); // stop loop
    running = false;
  }

  if (!running) {
    if (hasBeenCleared) {
      runPathfinding(nodes);
    } else {
      nodes.forEach(nodeRow => {
        nodeRow.forEach(node => {
          node.nbrs = [];
          node.clearVisualisation();
        });
      });

      runPathfinding(nodes);
    }
  }
}



// HANDLE MOUSE EVENTS
var strokeID = 0; // ID that increments to avoid infinite switching of erasing
var erasing = false;

function handleMousemove(event) {
  // Draw walls where mouse is
  let coords = event.target.classList[0].split("_").pop().split("-");
  nodes[Number(coords[0])][Number(coords[1])].handleDraw(strokeID);
}

class Table {
  // Class for the table
  cellSize = 40;
  cellSizeChangeAmount = 10;

  constructor() {
    this.table = document.querySelector("table");
    this.setUpMouseListeners();
    this.setUpTable();
  }

  addRow() {
    // Add a row to the table
    let newRow = document.createElement("tr");
    this.table.appendChild(newRow);
  }

  addCell() {
    // Add a cell to the last row
    let lastRow = this.table.lastChild;
    let newCell = document.createElement("td");
    newCell.style.width = `${this.cellSize}px`;
    newCell.style.height = `${this.cellSize}px`;
    newCell.classList.add(`_${lastRow.rowIndex}-${lastRow.childElementCount}`);
    lastRow.appendChild(newCell);
  }

  setUpTable() {
    // Populate table with cells
    let width = Math.floor(window.innerWidth / this.cellSize);
    let height = Math.floor((window.innerHeight - document.getElementsByTagName('nav')[0].offsetHeight) / this.cellSize);

    for (let i = 0; i < height; i++) {
      this.addRow();
      for (let j = 0; j < width; j++) {
        this.addCell();
      }
    }

    // Populate nodes array with nodes
    nodes = [];
    for (let i = 0; i < height; i++) {
      nodes.push([]);
      for (let j = 0; j < width; j++) {
        nodes[i].push(new Node(i, j));
      }
    }
  }

  clearTable() {
    // Clear HTML table and nodes array
    handleClearObjectivesButton();
    handleClearWallsButton();
    this.table.innerHTML = "";
    nodes = [];    
  }

  setUpMouseListeners() {
    // Set up mouse listeners for the table
    this.table.addEventListener("mousedown", (event) => {
      // Listen for mousedown BEFORE listening for mousemove to reduce bkgd-processes.
      strokeID++;
      if (event.shiftKey) {
        // Erase-mode
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
        // Draw-mode
        erasing = false;
        document.addEventListener("mousemove", handleMousemove);
      }
    });

    this.table.addEventListener("mouseup", (_) => {
      // Stop listening for mousemove (performance)
      document.removeEventListener("mousemove", handleMousemove);
    });
  }

  increaseCellSize() {
    if (this.cellSize < 100) {
      this.cellSize += this.cellSizeChangeAmount;
    }
    this.clearTable();
    this.setUpTable();
  }
  
  decreaseCellSize() {
    if (this.cellSize > 20) {
      this.cellSize -= this.cellSizeChangeAmount;
    }
    this.clearTable();
    this.setUpTable();
  }
}
let table = new Table();
