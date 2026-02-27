/**
 * Optimize Route Command
 */

import { ShuttleType } from '../../domain/entities/route.entity';

export class OptimizeRouteCommand {
  constructor(
    public readonly institutionId: string,
    public readonly vehicleId: string,
    public readonly routeDate: Date,
    public readonly shuttleType: ShuttleType,
    public readonly averageSpeed?: number,
  ) {}
}
