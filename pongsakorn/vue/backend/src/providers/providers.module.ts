import { Global, Module } from '@nestjs/common';
import { CacheService } from '../common/cache.service';
import { GeocodingProvider } from './geocoding.provider';
import { OpenMeteoProvider } from './open-meteo.provider';

@Global()
@Module({
  providers: [CacheService, OpenMeteoProvider, GeocodingProvider],
  exports: [CacheService, OpenMeteoProvider, GeocodingProvider],
})
export class ProvidersModule {}
