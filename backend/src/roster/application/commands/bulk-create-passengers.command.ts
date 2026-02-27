import { ParsedPassengerRow } from '../services/csv-parser.service';

/**
 * T278: BulkCreatePassengersCommand
 * CSV 파일로부터 파싱된 승객 데이터를 일괄 생성하는 Command
 */
export class BulkCreatePassengersCommand {
  constructor(
    public readonly institutionId: string,
    public readonly passengers: ParsedPassengerRow[],
    public readonly skipDuplicates: boolean = true, // Default: skip duplicates
  ) {}
}
