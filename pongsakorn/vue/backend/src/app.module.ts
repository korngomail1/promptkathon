import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { FloodModule } from './flood/flood.module';
import { LocationsModule } from './locations/locations.module';
import { ProvidersModule } from './providers/providers.module';
import { RainfallModule } from './rainfall/rainfall.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    ProvidersModule,
    LocationsModule,
    RainfallModule,
    FloodModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
