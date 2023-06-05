var strokeID = 0; // ID that increments to avoid infinite switching between erasing and drawing

class Table {
  // Class for the table
  cellSize = 40;
  cellSizeChangeAmount = 10;

  constructor() {
    this.table = document.querySelector("table");
    this.setUpMouseListeners();
    this.setUpTable();
  }

  /**
   * Add a row to the table
   */
  addRow() {
    let newRow = document.createElement("tr");
    this.table.appendChild(newRow);
  }

  /**
   * Add a cell to the last row
   */
  addCell() {
    let lastRow = this.table.lastChild;
    let newCell = document.createElement("td");
    newCell.style.width = `${this.cellSize}px`;
    newCell.style.height = `${this.cellSize}px`;
    newCell.classList.add(`_${lastRow.rowIndex}-${lastRow.childElementCount}`);
    lastRow.appendChild(newCell);
  }

  /**
   * Populates table with cells and nodes-array with nodes
   */
  setUpTable() {
    // Populate table with cells
    let cols = Math.floor(window.innerWidth / this.cellSize);
    let rows = Math.floor((window.innerHeight - document.getElementsByTagName('nav')[0].offsetHeight) / this.cellSize);
    for (let i = 0; i < rows; i++) {
      this.addRow();
      for (let j = 0; j < cols; j++) {
        this.addCell();
      }
    }

    // Populate nodes-array with nodes
    nodes = [];
    for (let i = 0; i < rows; i++) {
      nodes.push([]);
      for (let j = 0; j < cols; j++) {
        nodes[i].push(new Node(i, j));
      }
    }
  }

  /**
   * Clears the table and nodes-array
   */
  clearTable() {
    handleClearObjectivesButton();
    handleClearWallsButton();
    this.table.innerHTML = "";
    nodes = [];
  }

  /**
   * Set up 3 mouse listeners for the table
   */
  setUpMouseListeners() {
    // Prevent context menu from appearing on RMB
    this.table.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    // Place walls on LMB, erase on SHIFT+LMB, place START/END on RMB
    this.table.addEventListener("mousedown", (event) => {
      // Place START/END on RMB
      if (event.button == 2) { // RMB
        let [nodeX, nodeY] = event.target.classList[0].split("_").pop().split("-"); // get node coords
        // Place START
        if (!startExists) {
          nodes[nodeX][nodeY].makeStart();
          startExists = true;
        }
        // Place END
        else if (!endExists) {
          nodes[nodeX][nodeY].makeEnd();
          endExists = true;
        }
        return;
      }

      strokeID++; // begin new stroke      
      if (event.shiftKey) { // Erase
        document.addEventListener("mousemove", handleErase);
      }
      else { // Draw
        document.addEventListener("mousemove", handleDraw);
      }
    });

    // Remove mouse listeners on mouseup for performance
    document.addEventListener("mouseup", _ => {
      document.removeEventListener("mousemove", handleDraw);
      document.removeEventListener("mousemove", handleErase);
    });
  }

  /**
   * Increase cell size and redraw table
   */
  increaseCellSize() {
    if (this.cellSize < 100) {
      this.cellSize += this.cellSizeChangeAmount;
    }
    this.clearTable();
    this.setUpTable();
  }

  /**
   * Decrease cell size and redraw table
   */
  decreaseCellSize() {
    if (this.cellSize > 20) {
      this.cellSize -= this.cellSizeChangeAmount;
    }
    this.clearTable();
    this.setUpTable();
  }
}


let nodeX, nodeY;
/**
 * Handle drawing walls
 * @param {Event} event event object
 */
function handleDraw(event) {
  try {
    [nodeX, nodeY] = event.target.classList[0].split("_").pop().split("-");
    nodes[nodeX][nodeY].makeWall(strokeID);
  }
  catch (TypeError) { } // ignore if mouse is outside table
}
/**
 * Handle erasing walls
 * @param {Event} event event object
 */
function handleErase(event) {
  try {
    [nodeX, nodeY] = event.target.classList[0].split("_").pop().split("-");
    nodes[nodeX][nodeY].makeNormal(strokeID);
  }
  catch (TypeError) { } // ignore if mouse is outside table
}
