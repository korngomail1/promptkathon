import { Controller, Get, Query } from '@nestjs/common';
import { CoordsQueryDto } from '../common/dto/coords.dto';
import type { RainfallReport } from '../types';
import { RainfallService } from './rainfall.service';

@Controller('api/rainfall')
export class RainfallController {
  constructor(private readonly rainfall: RainfallService) {}

  /** ข้อมูลสำหรับแดชบอร์ดปริมาณน้ำฝน */
  @Get()
  getReport(@Query() query: CoordsQueryDto): Promise<RainfallReport> {
    return this.rainfall.getReport(query.lat, query.lon, query.name);
  }
}
