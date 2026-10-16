import { Controller, Get, Query } from '@nestjs/common';
import { CoordsQueryDto, SearchQueryDto } from '../common/dto/coords.dto';
import type { LocationRef } from '../types';
import { LocationsService } from './locations.service';

@Controller('api/locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get('presets')
  presets(): { items: LocationRef[] } {
    return { items: this.locations.presets() };
  }

  @Get('search')
  async search(@Query() query: SearchQueryDto): Promise<{ items: LocationRef[] }> {
    return { items: await this.locations.search(query.q, query.limit) };
  }

  @Get('reverse')
  reverse(@Query() query: CoordsQueryDto): Promise<LocationRef> {
    return this.locations.reverse(query.lat, query.lon);
  }
}
