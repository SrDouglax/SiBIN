import { Vector2 } from "../math/vector";

export class Camera {
  pos: Vector2;
  scale: number;
  scalePos: Vector2;
  targetScale: number;
  moving: boolean;
  lastClickedPos: Vector2 | null;

  constructor(pos: Vector2 = new Vector2(0, 0), scale: number = 1) {
    this.pos = pos;
    this.scalePos = pos.multi(scale);
    this.targetScale = scale;
    this.scale = scale;
    this.moving = false;
    this.lastClickedPos = null;
  }
}
