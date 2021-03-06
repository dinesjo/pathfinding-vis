var nodes = [];
var startNode;
var endNode;
var startExists = false;
var endExists = false;
var hasBeenCleared = true;

var strokeID = 0; // used to avoid infinite switching of type
var erasing = false;

// LISTEN FOR MOUSEDOWN
document.querySelector("table").addEventListener("mousedown", (event) => {
  strokeID++;
  if (event.shiftKey) {
    // Erase
    erasing = true;
    document.addEventListener("mousemove", handleMousemove);
  } else if (event.altKey) {
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


function handleMousemove(event) {
  // Draw walls where mouse

  let coords = event.target.classList[0].split("_").pop().split("-");
  nodes[Number(coords[0])][Number(coords[1])].handleDraw(strokeID);
}

function handleClearButton() {
  // Reset map without reloading
  // Resets all properties of all nodes

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

          }
        }
      }
    }
    this.nbrs = this.nbrs.filter(el => { // remove "ghost" nodes
      return el !== undefined;
    })
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
}

function hasTwoCommonWalls(node1, node2) {
  // Returns true if two nodes have at least two nbring walls in common

  node1Walls = node1.nbrs.filter(node => node.type === "wall");
  node2Walls = node2.nbrs.filter(node => node.type === "wall");
  let arr = node1Walls.filter(el => node2Walls.includes(el));
  if (arr.length > 1) {
    return true;
  }
  return false;
}


function getAvailNodes(arr) {
  // Make list with ALL nodes
  let allNodesIncWalls = [];
  arr.forEach(nodeRow => {
    nodeRow.forEach(node => {
      allNodesIncWalls.push(node);
    });
  });

  // Return list without walls
  return allNodesIncWalls.filter(node => {
    return node.type != "wall";
  });
}

var openSet = [];
var closedSet = [];
var curNode;
var id;
var intervalTime = 0; // time between each iteration in milliseconds, 0 = real time

function runPathfinding(nodes) {
  hasBeenCleared = false;
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
      provisionalfDistance = curNode.fDistance + getEuclideanDistance(curNode, nbr) + getCross(nbr) * 0.0001;
      if (!(openSet.includes(nbr)) || (provisionalfDistance < nbr.fDistance)) {
        if ((getDistance(curNode, nbr) != 1) && (hasTwoCommonWalls(curNode, nbr))) {
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
        if ((getDistance(curNode, nbr) != 1) && (hasTwoCommonWalls(curNode, nbr))) {
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
          nbr.gDistance = provisionalgDistance;
          nbr.hDistance = getEuclideanDistance(nbr, endNode) + getCross(nbr) * 0.001;
          nbr.fDistance = nbr.gDistance + nbr.hDistance;
        }
        if (!(openSet.includes(nbr))) {
          openSet.push(nbr);
        }
        nbr.addClass("considered"); // CSS
      }
    }
  });

  curNode.addClass("visited"); // CSS
}

function getCross(node) {
  let dx1 = node.x - endNode.x;
  let dy1 = node.y - endNode.y;
  let dx2 = startNode.x - endNode.x;
  let dy2 = startNode.y - endNode.y;
  let cross = Math.abs(dx1 * dy2 - dx2 * dy1);
  return cross;
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
  // Returns distance in Manhattan measurement

  return Math.abs(node1.x - node2.x) + Math.abs(node1.y - node2.y);
}

function getEuclideanDistance(node1, node2) {
  // Returns distance in euclidean measurement

  // return Math.sqrt(Math.pow((node2.x - node1.x), 2) + Math.pow((node2.y - node1.y), 2));
  let dx = Math.abs(node1.x - node2.x);
  let dy = Math.abs(node1.y - node2.y);
  return (dx + dy) + (Math.sqrt(2) - 2) * Math.min(dx, dy);

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