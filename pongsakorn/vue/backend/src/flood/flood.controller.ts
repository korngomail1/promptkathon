import { Controller, Get, Query } from '@nestjs/common';
import { CoordsQueryDto } from '../common/dto/coords.dto';
import type { FloodStatus } from '../types';
import { FloodService } from './flood.service';

@Controller('api/flood')
export class FloodController {
  constructor(private readonly flood: FloodService) {}

  /** ข้อมูลสำหรับหน้าแจ้งเตือน: พื้นที่นี้น้ำท่วมไหม */
  @Get('status')
  getStatus(@Query() query: CoordsQueryDto): Promise<FloodStatus> {
    return this.flood.getStatus(query.lat, query.lon, query.name);
  }
}
