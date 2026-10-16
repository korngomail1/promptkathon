import { Module } from '@nestjs/common';
import { RainfallModule } from '../rainfall/rainfall.module';
import { FloodController } from './flood.controller';
import { FloodService } from './flood.service';

@Module({
  imports: [RainfallModule],
  controllers: [FloodController],
  providers: [FloodService],
})
export class FloodModule {}
