class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.type = "normal"; // normal, wall, start, end
    this.nbrs = []; // nbring nodes
    this.fDistance = Infinity;
    this.gDistance = Infinity;
    this.hDistance = Infinity;
    this.cameFrom = undefined;
    this.usedStrokeIDs = [];
  }

  /**
   * Add HTML-class to node
   * @param {String} newClass HTML-class to add
   */
  addClass(newClass) {
    document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.add(newClass);
  }

  /**
   * Clear all HTML-classes except for the node's coordinates
   */
  clearClasses() {
    while (document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.length > 1) {
      document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.remove(document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList[1]);
    }
  }

  /**
   * Clear all visualisation classes (considered, visited, tail)
   */
  clearVisualisation() {
    if (this.cameFrom != undefined) {
      try {
        document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.remove("considered");
        document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.remove("visited");
        document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.remove("tail");
      } catch (error) { }
    }
  }

  /**
   * Make this node the start node
   */
  makeStart() {
    startNode = this;
    this.type = "start";
    this.fDistance = 0; // start at lowest distance
    this.gDistance = 0;
    this.hDistance = 0;
    this.addClass("start");
    if (cb) { this.addClass("cb"); }
  }

  /**
   * Make this node the end node
   */
  makeEnd() {
    endNode = this;
    this.type = "end";
    this.addClass("end");
    if (cb) { this.addClass("cb") }
  }

  /**
   * Make this node a wall
   */
  makeWall() {
    // Avoid making wall if already start or end
    if (this.type === "start" || this.type === "end") { return; }

    this.type = "wall";
    this.addClass("wall");
  }

  /**
   * Make this node normal
   */
  makeNormal() {
    if (this.type === "normal") { return; }
    this.type = "normal";
    document.getElementsByClassName(`_${this.x}-${this.y}`)[0].classList.remove("wall");
  }

  /**
   * Set up this node's nbrs array
   */
  setupNbrs() {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        // ignore self
        if (i === 0 && j === 0) { continue }

        // add nbr if it exists
        try {
          this.nbrs.push(nodes[this.x + i][this.y + j]);
        } catch (TypeError) { } // ignore instances where attempt to make nbr outside of table
      }
    }
    this.nbrs = this.nbrs.filter(nbr => nbr !== undefined); // remove "ghost" nbrs
  }

  /**
   * "Erase" node by making it normal
   * @param {Number} ID StrokeID of stroke that called this function
   */
  erase(ID) {
    // Improve performance by not erasing if already erased
    if (this.usedStrokeIDs.includes(ID)) { return; }

    this.usedStrokeIDs.push(ID);
    this.makeNormal();
  }

  /**
   * "Draw" node by making it a wall
   * @param {Number} ID StrokeID of stroke that called this function
   */
  draw(ID) {
    // Improve performance by not drawing if already drawn
    if (this.usedStrokeIDs.includes(ID)) { return; }

    this.usedStrokeIDs.push(ID);
    this.makeWall();
  }

  /**
   * Determine if this node shares at lease two walls with argument node
   * @param {Node} node other node
   * @returns {Boolean} true if this node shares two walls with argument node
   */
  sharesTwoWallsWith(node) {
    let thisWallNbrs = this.nbrs.filter(node => node.type === "wall");
    let otherWallNbrs = node.nbrs.filter(node => node.type === "wall");
    let arr = thisWallNbrs.filter(wall => otherWallNbrs.includes(wall));
    return (arr.length >= 2);
  }
}