/**
 * Coordinates Value Object
 * 위도/경도 좌표
 */

export class Coordinates {
  constructor(
    public readonly lat: number,
    public readonly lng: number,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.lat < -90 || this.lat > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    if (this.lng < -180 || this.lng > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
  }

  /**
   * 두 좌표 간의 거리 계산 (Haversine formula)
   * @returns 거리 (km)
   */
  distanceTo(other: Coordinates): number {
    const R = 6371; // 지구 반경 (km)
    const dLat = this.toRad(other.lat - this.lat);
    const dLng = this.toRad(other.lng - this.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(this.lat)) *
        Math.cos(this.toRad(other.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  equals(other: Coordinates): boolean {
    return (
      Math.abs(this.lat - other.lat) < 0.000001 &&
      Math.abs(this.lng - other.lng) < 0.000001
    );
  }

  toString(): string {
    return `(${this.lat.toFixed(6)}, ${this.lng.toFixed(6)})`;
  }

  toJSON(): { lat: number; lng: number } {
    return { lat: this.lat, lng: this.lng };
  }

  static fromJSON(json: { lat: number; lng: number }): Coordinates {
    return new Coordinates(json.lat, json.lng);
  }
}
