var nodes = [];
var startNode;
var endNode;
var startExists = false;
var endExists = false;
var running = false;

var openSet = [];
var closedSet = [];
var curNode;
var intervalID;
const INTERVALTIME = 0; // time between each iteration in milliseconds, 0 = closest to real time

function runPathfinding(nodes) {
  hasBeenCleared = false;
  running = true;

  // Call setupNbrs for all available nodes
  getNonWallNodes(nodes).forEach(node => {
    node.setupNbrs();
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
  if (running) {
    clearInterval(intervalID); // stop loop
    running = false;
  }
  
  // Reset walls
  nodes.forEach(nodeRow => {
    nodeRow.forEach(node => {
      node.type = "normal";
      node.fDistance = Infinity;
      node.gDistance = Infinity;
      node.hDistance = Infinity;
      node.nbrs = [];
      node.clearClasses();
    });
  });

  // Try to reinstate objectives
  try {
    startNode.makeStart();
    endNode.makeEnd();
  } catch (TypeError) { } // catch if startNode or endNode is undefined
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

let table = new Table();
