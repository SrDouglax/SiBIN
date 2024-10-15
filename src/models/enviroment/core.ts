import { Camera } from "../camera";
import { Edge, EdgeType } from "../edge";
import { Vector2 } from "../math/vector";
import { Node } from "../node";
import { User } from "../user";

class Enviroment {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private draggingId: string | null = null;
  private lastFrameTime: number = performance.now();
  private mousePosition: Vector2 = new Vector2();
  private pressedKeys: any[] = [];
  private lastClickedItemId: string | null = null;
  private targetZoom: number = 1;
  private targetCameraPos: Vector2 = new Vector2();
  private info: string = "";
  private bondedNodePairs: Set<string> = new Set<string>();
  private camera: Camera = new Camera();
  private avFps: number = 60;
  private cellSize: number = 250;

  public nodes: Node[] = [];
  public nodesTable: { [key: string]: Node } = {};
  public edges: Edge[] = [];
  public edgesTable: { [key: string]: Edge } = {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });

    // Verifica se o contexto não é nulo antes de prosseguir
    if (!this.ctx) {
      console.error("Failed to get 2D rendering context for canvas.");
      return;
    }

    this.resizeCanvas();
    this.calculateEdges();
    this.setupEventListeners();

    this.iterate();
  }

  // ==== Execution loop ==== \\
  private iterate(): void {
    // - Updates cursor to default, moving camera, etc
    this.updateCursor();

    // - Get deltaTime and updates average FPS
    const deltaTime = this.calculateDt();
    this.updateFps(deltaTime);

    // - Apply movement logic if 's' (stop) isn't pressed
    if (!this.pressedKeys.includes("s")) {
      this.simulateMovement(deltaTime);
    }

    // - Updates dragging node position
    this.updateDraggingNodePosition(this.nodesTable, this.draggingId, this.mousePosition);

    // - Updates camera scale and position smoothly
    this.updateCameraScaleAndPos();

    // - Draw elements on canvas
    this.drawElements(deltaTime);

    requestAnimationFrame(this.iterate.bind(this));
  }

  // ==== Execution lv1 ==== \\
  private updateCursor() {
    const nodeId = this.getNodeIdUnderMouse(this.mousePosition.x, this.mousePosition.y);
    if (this.camera.moving) {
      this.canvas.style.cursor = "move";
    } else if (nodeId) {
      this.canvas.style.cursor = "pointer";
    } else if (!this.draggingId) {
      this.canvas.style.cursor = "default";
    }
  }
  private calculateDt(): number {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = currentTime;
    return deltaTime;
  }
  private updateFps(dt: number): void {
    const avFpsSmooth = 0.05;
    this.avFps = this.avFps !== Infinity ? this.avFps * (1 - avFpsSmooth) + (1 / dt) * avFpsSmooth || 0 : 0;
  }
  private updateDraggingNodePosition(nodesTable: { [key: string]: Node }, draggingId: string | null, mousePosition: Vector2) {
    if (draggingId) {
      nodesTable[draggingId].pos = new Vector2(mousePosition.x, mousePosition.y);
    }
  }
  private simulateMovement(dt: number) {
    // Calcule as forças para cada nó
    this.nodes.forEach((node) => {
      if (node.id !== this.draggingId) {
        let totalForceX = 0;
        let totalForceY = 0;

        // // Obtenha a chave da célula atual
        // const cellKey = this.getCellKey(node.pos.x, node.pos.y);

        // // Verifique os nós nas células adjacentes
        // const cellsToCheck = [
        //   cellKey,
        //   this.getCellKey(node.pos.x - this.cellSize, node.pos.y),
        //   this.getCellKey(node.pos.x + this.cellSize, node.pos.y),
        //   this.getCellKey(node.pos.x, node.pos.y - this.cellSize),
        //   this.getCellKey(node.pos.x, node.pos.y + this.cellSize),
        //   this.getCellKey(node.pos.x - this.cellSize, node.pos.y - this.cellSize),
        //   this.getCellKey(node.pos.x + this.cellSize, node.pos.y - this.cellSize),
        //   this.getCellKey(node.pos.x + this.cellSize, node.pos.y + this.cellSize),
        //   this.getCellKey(node.pos.x - this.cellSize, node.pos.y + this.cellSize),
        // ];

        this.nodes.forEach((otherNode) => {
          if (node !== otherNode) {
            if (this.isConnected(node, otherNode)) {
              const edge = this.edgesTable[this.getConnectionKey(node, otherNode)] || this.edgesTable[this.getConnectionKey(otherNode, node)];
              const score = edge.score;
              const forceX = otherNode.pos.x - node.pos.x;
              const forceY = otherNode.pos.y - node.pos.y;
              const forceMagnitude = Math.log10(node.pos.distanceTo(otherNode.pos));
              totalForceX += forceX * score * forceMagnitude;
              totalForceY += forceY * score * forceMagnitude;
            }

            // Força de repulsão (para todos os nós próximos)
            const dx = otherNode.pos.x - node.pos.x;
            const dy = otherNode.pos.y - node.pos.y;
            const forceMagnitude = 10000 * node.pos.distanceTo(otherNode.pos) ** -2;
            const forceX = forceMagnitude * dx;
            const forceY = forceMagnitude * dy;
            totalForceX -= forceX;
            totalForceY -= forceY;
          }
        });

        // Aplique a força ao nó
        const vDelta = new Vector2(totalForceX || 0, totalForceY || 0);
        node.vel = node.vel
          .selfInterpolate(vDelta, vDelta.length() > 1 ? 0.1 : 0)
          .selfInterpolate(new Vector2().sub(node.pos), 0.2 / Math.sqrt(node.pos.length()))
          // .selfInterpolate(new Vector2(), 0.5);
          // .selfInterpolate(new Vector2().sub(node.pos), Math.max(0.1, Math.min(0.9, 1 / node.pos.length())))
          .selfInterpolate(new Vector2(), 0.5 + Math.min(0.00001 * node.pos.length(), 0.25));
        node.calcPosition(dt);
        // this.quadtree.update(node, node.pos);
      }
    });
  }
  private updateCameraScaleAndPos() {
    const zoomSmooth = 0.1;
    this.camera.scale = this.camera.scale * (1 - zoomSmooth) + this.targetZoom * zoomSmooth;
    const posSmooth = 0.5;
    this.camera.pos = this.camera.pos.multi(1 - posSmooth).sum(this.targetCameraPos.sum(this.camera.scalePos).multi(posSmooth));
  }
  private drawElements(dt: number) {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.save();

      this.edges.forEach((edge) => {
        Edge.draw(this.ctx!, this.camera, edge.node1, edge.node2, EdgeType["Covalent"], edge.score.toFixed(4));
      });

      let selecteds: Node[] = [];
      // const node = this.nodesTable?.[this.getNodeIdUnderMouse(this.mousePosition.x, this.mousePosition.y) || ""];
      // if (node) {
      //   const cellKey = this.getCellKey(node.pos.x, node.pos.y);

      //   // Verifique os nós nas células adjacentes
      //   const cellsToCheck = [
      //     cellKey,
      //     this.getCellKey(node.pos.x - this.cellSize, node.pos.y),
      //     this.getCellKey(node.pos.x + this.cellSize, node.pos.y),
      //     this.getCellKey(node.pos.x, node.pos.y - this.cellSize),
      //     this.getCellKey(node.pos.x, node.pos.y + this.cellSize),
      //     this.getCellKey(node.pos.x - this.cellSize, node.pos.y - this.cellSize),
      //     this.getCellKey(node.pos.x + this.cellSize, node.pos.y - this.cellSize),
      //     this.getCellKey(node.pos.x + this.cellSize, node.pos.y + this.cellSize),
      //     this.getCellKey(node.pos.x - this.cellSize, node.pos.y + this.cellSize),
      //   ];

      //   cellsToCheck.forEach((key) => {
      //     const otherNodes = this.cells[key] || [];
      //     selecteds.push(...otherNodes);
      //   });
      // }
      this.nodes.forEach((node) => {
        const isNodeVisible = true;
        // node.pos.x - this.camera.pos.x + this.camera.scalePos.x < this.canvas.width / this.camera.scale &&
        // node.pos.y - this.camera.pos.y < this.canvas.height / this.camera.scale &&
        // node.pos.x - this.camera.pos.x > 0 &&
        // node.pos.y - this.camera.pos.y > 0;

        if (isNodeVisible) {
          node.draw(this.ctx!, this.camera, selecteds.map((e) => e.id).includes(node.id));
        }
      });

      this.ctx.fillStyle = "white";
      this.ctx.font = "10px Arial";
      this.ctx.fillText(`FPS: ${Math.round(1 / dt)}  |  AvFps: ${Math.round(this.avFps)}  |  ${this.nodes.length}`, 10, 30);
      this.info.split("\n").forEach((e, i) => {
        this.ctx?.fillText(`${e}`, 10, 50 + 10 * i);
      });

      this.ctx.restore();
    }
  }

  // ==== Execution lv2 ==== \\
  private isConnected(node1: Node, node2: Node): boolean {
    const key1 = this.getConnectionKey(node1, node2);
    const key2 = this.getConnectionKey(node2, node1);
    return this.bondedNodePairs.has(key1) || this.bondedNodePairs.has(key2);
  }

  // ==== Public ==== \\
  public destroy() {
    // Remove os event listeners do canvas
    window.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("keydown", this.handleKeyPressed);
    window.removeEventListener("keyup", this.handleKeyReleased);
    window.removeEventListener("focus", this.handleWindowFocus);
  }
  public resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window?.innerWidth;
    this.canvas.height = window?.innerHeight;
  }

  // ==== Input Managers ==== \\
  private setupEventListeners() {
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("keydown", this.handleKeyPressed);
    window.addEventListener("keyup", this.handleKeyReleased);
    window.addEventListener("focus", this.handleWindowFocus);
    window.addEventListener("wheel", this.handleZoom);
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  // ==== Input Actions ==== \\
  private handleKeyPressed = (event: KeyboardEvent) => {
    if (!this.pressedKeys.includes(event.key)) {
      this.pressedKeys.push(event.key);
    }
    if (event.key === " ") {
      this.camera.moving = true;
    }
    if (event.key === "i") {
    }
    if (event.key === "n") {
      const newNode = new Node({
        pos: this.mousePosition.sum(new Vector2(Math.random(), Math.random())),
      });
      this.nodes = [...this.nodes, newNode];
      this.nodesTable[newNode.id] = newNode;
      const nodes = this.calculateEdges(newNode) || [];
      newNode.pos = this.calculateCentroid(nodes).sum(new Vector2(Math.random(), Math.random()));
    }
    if (event.key === "b") {
      this.nodes.forEach((node) => {
        node.vel = new Vector2(0, 0);
      });
    }
    if (event.key === "d") {
      const molecule = this.getNodeIdUnderMouse(this.mousePosition.x, this.mousePosition.y);
      this.nodes = this.nodes.filter((e) => e.id !== molecule);
    }
    if (event.key === "r") {
      this.nodes = [];
      this.edges = [];
      this.draggingId = null;
    }
  };
  private handleKeyReleased = (event: KeyboardEvent) => {
    if (event.key === " ") {
      this.camera.moving = false;
    }
    this.pressedKeys = this.pressedKeys.filter((key) => key !== event.key);
  };
  private handleWindowFocus = () => {
    this.pressedKeys = [];
    this.draggingId = null;
  };
  private handleMouseDown = () => {
    const moleculeId = this.getNodeIdUnderMouse(this.mousePosition.x, this.mousePosition.y);

    if (this.camera.moving) {
      if (this.camera.lastClickedPos) {
      } else {
        this.camera.lastClickedPos = this.mousePosition;
      }
    } else {
      this.lastClickedItemId = null;
      if (moleculeId) {
        this.draggingId = moleculeId;
      }
    }
  };
  private handleMouseMove = (event: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX / this.camera.scale - rect.left;
    const mouseY = event.clientY / this.camera.scale - rect.top;
    const worldPos = new Vector2(mouseX, mouseY).sum(this.camera.pos.sub(this.camera.scalePos));
    this.mousePosition = new Vector2(mouseX, mouseY).sum(this.camera.pos);
    if (this.camera.lastClickedPos) {
      this.targetCameraPos = new Vector2().sum(this.camera.lastClickedPos?.sub(new Vector2(mouseX, mouseY)) || new Vector2());
    }

    const node = this.nodes.find((e) => e.id === this.getNodeIdUnderMouse(this.mousePosition.x, this.mousePosition.y));
    const user = node?.user;
    if (user) {
      const { socialConnections, behaviorHistory, ...userWithoutBehaviorHistory } = { ...user };
      this.info = JSON.stringify({ ...userWithoutBehaviorHistory, ...behaviorHistory }, null, 2);
    } else {
      this.info = "";
    }
  };
  private handleMouseUp = () => {
    this.draggingId = null;
    if (this.camera.lastClickedPos) {
      this.camera.lastClickedPos = null;
    } else {
    }
  };
  private handleZoom = (event: WheelEvent) => {
    const zoomAmount = event.deltaY * -0.0004; // Adjust the sensitivity based on your needs
    const zoomDelta = this.targetZoom - Math.min(Math.max(this.targetZoom + zoomAmount, 0.01), 10);
    this.targetZoom -= zoomDelta;

    console.log(this.camera.scale);
    this.mousePosition = new Vector2(event.clientX, event.clientY).sum(this.targetCameraPos.sum(this.camera.scalePos));
    this.camera.scalePos = this.camera.scalePos.sum(this.mousePosition.multi(-zoomDelta));
  };

  // ==== Others ==== \\
  /**
   * Calculate the edges between nodes based on user similarity scores.
   * For each node, it calculates the similarity score with every other node in the environment.
   * Then, it selects the top nodes with the highest similarity scores and creates edges between them if they are not already connected.
   * The edges are created as covalent bonds with the calculated similarity score.
   * Updates the 'edges' array, 'edgesTable', and 'bondedNodePairs' set accordingly.
   *
   * @returns {Node[]} Connected nodes to a especific node if it exists
   */
  private calculateEdges(especificNode?: Node): Node[] | void {
    this.edges = [];
    this.bondedNodePairs = new Set<string>();
    let especificNodeConnectedNodes: Node[] = [];
    this.nodes.forEach((node) => {
      const score = this.nodes.map((otherNode) => {
        if (node === otherNode) return;

        return { score: User.calculateUserSimilarityScore(node.user, otherNode.user), otherNode };
      });

      const MAX_CONNECTIONS = 3;

      const sortedScore = score.sort((a, b) => ((a?.score || 0) > (b?.score || 0) ? -1 : 1));
      sortedScore.slice(0, MAX_CONNECTIONS).forEach((e) => {
        const score = e?.score;
        const otherNode = e?.otherNode;
        if (!otherNode || score === undefined) return;

        if (!this.isConnected(node, otherNode) && Edge.isEdgeValid(this.edges, node, otherNode)) {
          const bond = new Edge(node, otherNode, EdgeType["Covalent"], score);
          this.edges.push(bond);
          this.edgesTable[this.getConnectionKey(node, otherNode)] = bond;
          this.bondedNodePairs.add(this.getConnectionKey(node, otherNode));
        }
      });
      if (especificNode?.id === node.id) {
        sortedScore
          .map((e) => e?.otherNode)
          .slice(0, MAX_CONNECTIONS)
          .forEach((e) => {
            if (e) especificNodeConnectedNodes.push(e);
          });
      }
    });

    return especificNodeConnectedNodes;
  }

  private calculateCentroid(nodes: Node[]) {
    if (nodes.length === 0) return new Vector2().sum(new Vector2(Math.random(), Math.random()));
    const sumPos = nodes.reduce((acc, node) => {
      acc.x += node.pos.x;
      acc.y += node.pos.y;
      return acc;
    }, new Vector2(0, 0));
    const count = nodes.length;
    return new Vector2(sumPos.x / count, sumPos.y / count);
  }

  // ==== Initializers ==== \\
  private getNodeIdUnderMouse(mouseX: number, mouseY: number): string | null {
    for (const node of this.nodes) {
      const distance = Math.sqrt(Math.pow(mouseX - node.pos.x, 2) + Math.pow(mouseY - node.pos.y, 2));
      if (distance <= node.size) {
        return node.id;
      }
    }
    return null;
  }
  private getConnectionKey(node1: Node, node2: Node): string {
    return `${node1.id}_${node2.id}`;
  }
}

export default Enviroment;
