export class Vector2 {
  x: number = 0;
  y: number = 0;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  sum(other: Vector2): Vector2 {
    return new Vector2(this.x + other?.x, this.y + other?.y);
  }

  sub(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  multi(value: number): Vector2 {
    return new Vector2(this.x * value, this.y * value);
  }

  div(value: number): Vector2 {
    return new Vector2(this.x / value, this.y / value);
  }

  dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vector2 {
    const len = this.length();
    if (len === 0) {
      return new Vector2(0, 0);
    }
    return new Vector2(this.x / len, this.y / len);
  }

  scale(value: number): Vector2 {
    this.x *= value;
    this.y *= value;
    return this;
  }
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  distanceTo(other: Vector2): number {
    const dx = this.x - other?.x;
    const dy = this.y - other?.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getDirection(other: Vector2): Vector2 {
    return new Vector2(other?.x - this.x, other?.y - this.y).normalize();
  }

  selfInterpolate(target: Vector2, factor: number): Vector2 {
    factor = Math.max(0, Math.min(1, factor));
    this.x = this.x + (target.x - this.x) * factor;
    this.y = this.y + (target.y - this.y) * factor;

    return new Vector2(this.x, this.y);
  }

  clamp(other: Vector2): Vector2 {
    return new Vector2(Math.max(Math.min(this.x, other.x), -other.x), Math.max(Math.min(this.y, other.y), -other.y));
  }

  static calculateAngleBetweenVectors(vector1: Vector2, vector2: Vector2): number {
    const dotProduct = vector1.dot(vector2);
    const magnitude1 = vector1.length();
    const magnitude2 = vector2.length();

    const cosTheta = dotProduct / (magnitude1 * magnitude2);

    // Ensure cosTheta is within [-1, 1] to avoid NaN errors
    const clampedCosTheta = Math.max(-1, Math.min(1, cosTheta));

    // Calculate the angle in radians
    const angleInRadians = Math.acos(clampedCosTheta);

    // Convert radians to degrees
    const angleInDegrees = angleInRadians * (180 / Math.PI);

    return angleInDegrees;
  }
}
