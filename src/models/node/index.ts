import { CanvasHelper } from "../../utils/canvas";
import { Camera } from "../camera";
import { Edge } from "../edge";
import { Vector2 } from "../math/vector";
import { User } from "../user";

interface NodeConfig {
  pos?: Vector2;
  vel?: Vector2;
  size?: number;
  id?: string;
  friction?: number;
}

export class Node {
  pos: Vector2;
  previousPos: Vector2;
  vel: Vector2;
  selected: boolean;
  size: number;
  id: string;
  friction: number;
  user: User;

  constructor(config?: NodeConfig) {
    this.pos = config?.pos || new Vector2(0, 0);
    this.previousPos = this.pos.clone();
    this.vel = config?.vel || new Vector2(0, 0);
    this.selected = false;
    this.size = config?.size || 25;
    this.id = config?.id || this.generateUniqueID();
    this.friction = config?.friction || 1;
    this.user = User.generateRandomUser();
  }

  getAnimatedSize() {
    return this.size * (1 + Math.min(this.vel.length(), this.size * 2) / (this.size * 10));
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera, selected?: boolean) {
    const radius = this.getAnimatedSize() * camera.scale;
    const relativePos = this.pos.sub(camera.pos).multi(camera.scale);

    if (selected) {
      // Desenha o círculo representando o átomo com espaçamento de borda
      ctx.beginPath();
      ctx.arc(relativePos.x, relativePos.y, radius + 5, 0, Math.PI * 2);
      ctx.fillStyle = "transparent"; // Define a cor de preenchimento como transparente para que apenas a borda seja desenhada
      ctx.lineWidth = 3; // Define a largura da borda
      ctx.strokeStyle = "white";
      ctx.stroke();
      ctx.closePath();
    }

    // function stringToNumber(seed: string): number {
    //   let hash = 0;
    //   if (seed.length === 0) return hash;
    //   for (let i = 0; i < seed.length; i++) {
    //     let char = seed.charCodeAt(i);
    //     hash = (hash << 5) - hash + char;
    //     hash &= hash; // Convert to 32bit integer
    //   }
    //   return Math.abs(hash);
    // }
    // Desenha o círculo interno representando o átomo
    CanvasHelper.drawCircle({
      ctx,
      x: relativePos.x,
      y: relativePos.y,
      radius,
      fillColor: `blue`,
    });

    ctx.save();
    ctx.translate(relativePos.x, relativePos.y);
    ctx.scale(camera.scale, camera.scale);

    if (camera.scale >= 0.5) {
      ctx.font = `16px Arial`;
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(this.user.name.split(" ")[0], 0, 24 / 4 + 2);
    }

    ctx.restore();
  }

  calcPosition(delta: number) {
    // Calculate the mass factor based on the nodeic mass
    const mass = 2;

    // Apply the mass factor to the velocity
    const acceleration = new Vector2((this.vel.x / mass) * 100, (this.vel.y / mass) * 100).clamp(new Vector2(5000, 5000));
    // console.log(acceleration);
    // console.log(this)

    this.previousPos = this.pos.clone();
    this.pos.x += acceleration.x * delta;
    this.pos.y += acceleration.y * delta;
  }

  public isConnectedWith(bonds: Edge[], otherNode: Node): boolean {
    // Verifica se há uma ligação entre dois átomos na lista de vínculos da simulação
    return bonds.some((bond) => (bond.node1 === this && bond.node2 === otherNode) || (bond.node1 === otherNode && bond.node2 === this));
  }

  private generateUniqueID(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5); // Adjust the length of random component as needed
    return timestamp + randomStr;
  }

  static calculateAngle(bonds: Edge[], node1: Node, node2: Node, node3: Node): number | null {
    // Verificar se os três átomos estão conectados
    const isConnected = node1.isConnectedWith(bonds, node2) && node2.isConnectedWith(bonds, node3) && node3.isConnectedWith(bonds, node1);

    if (!isConnected) {
      return null;
    }

    // Calcular os vetores entre os átomos
    const vector1 = node1.pos.sub(node2.pos);
    const vector2 = node3.pos.sub(node2.pos);

    // Calcular o ângulo entre os vetores em radianos
    let angleInRadians = Math.atan2(vector2.y, vector2.x) - Math.atan2(vector1.y, vector1.x);

    // Normalizar o ângulo para o intervalo [0, 2π]
    if (angleInRadians < 0) {
      angleInRadians += 2 * Math.PI;
    }

    // Converter o ângulo de radianos para graus
    const angleInDegrees = angleInRadians * (180 / Math.PI);

    return angleInDegrees;
  }
}
