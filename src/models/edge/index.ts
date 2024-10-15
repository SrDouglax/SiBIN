import { CanvasHelper } from "../../utils/canvas";
import { Camera } from "../camera";
import { Vector2 } from "../math/vector";
import { Node } from "../node";

export enum EdgeType {
  Covalent = "covalent",
  Ionic = "ionic",
  Metallic = "metallic",
}

export class Edge {
  node1: Node;
  node2: Node;
  bondType: EdgeType;
  score: number;
  debug: any;

  constructor(node1: Node, node2: Node, bondType: EdgeType = EdgeType["Covalent"], score: number, debug?: any) {
    this.node1 = node1;
    this.node2 = node2;
    this.bondType = bondType;
    this.score = score;
    this.debug = debug;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    CanvasHelper.drawLine({
      ctx,
      start: new Vector2(this.node1.pos.x, this.node1.pos.y),
      end: new Vector2(this.node2.pos.x, this.node2.pos.y),
      strokeColor: this.bondType === EdgeType.Covalent ? "white" : this.bondType === EdgeType.Ionic ? "blue" : "red",
    });
  }

  static draw(ctx: CanvasRenderingContext2D, camera: Camera, node1: Node, node2: Node, bondType: EdgeType, score: string): void {
    const relativePos1 = node1?.pos.sub(camera?.pos).multi(camera.scale)
    const relativePos2 = node2?.pos.sub(camera?.pos).multi(camera.scale)
    // const midPos = relativePos1?.sum(relativePos2).div(2);
    // const circlePos = relativePos1?.sum(relativePos1.getDirection(relativePos2).multi(26 * camera.scale));
    CanvasHelper.drawLine({
      ctx,
      lineWidth: 10 * camera.scale * Number(score),
      start: relativePos1,
      end: relativePos2,
      strokeColor: "hsl(" + relativePos1?.distanceTo(relativePos2) / camera.scale / 5 + ", 100%, 50%)",
    });
    // CanvasHelper.drawCircle({ ctx, x: circlePos?.x, y: circlePos?.y, radius: 5 * camera.scale, fillColor: "aquamarine" });
    // CanvasHelper.drawText({ ctx, text: score, pos: midPos, font: `${14 * camera.scale}px Arial`, fillColor: "gray" });
  }

  static isEdgeValid(existingEdges: Edge[], newNode1: Node, newNode2: Node): boolean {
    for (const bond of existingEdges) {
      if ((bond.node1 === newNode1 && bond.node2 === newNode2) || (bond.node1 === newNode2 && bond.node2 === newNode1)) {
        return false;
      }
    }
    return true;
  }

  static isNodeInEdge(bond: Edge, node: Node) {
    if (bond.node1 === node) {
      return bond.node2;
    } else if (bond.node2 === node) {
      return bond.node1;
    }
    return false;
  }
}
