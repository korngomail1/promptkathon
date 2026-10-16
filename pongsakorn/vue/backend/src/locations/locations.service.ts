import { Injectable } from '@nestjs/common';
import { GeocodingProvider } from '../providers/geocoding.provider';
import type { LocationRef } from '../types';
import { THAI_LOCATIONS } from './thai-locations.data';

@Injectable()
export class LocationsService {
  constructor(private readonly geocoding: GeocodingProvider) {}

  /** รายการพื้นที่แนะนำสำหรับปุ่มเลือกพื้นที่ */
  presets(): LocationRef[] {
    return THAI_LOCATIONS;
  }

  search(query: string, limit?: number): Promise<LocationRef[]> {
    return this.geocoding.search(query.trim(), limit);
  }

  /** ใช้กับปุ่ม "ใช้ตำแหน่งปัจจุบัน" ที่ frontend ส่งพิกัดจาก Geolocation API มา */
  reverse(lat: number, lon: number): Promise<LocationRef> {
    return this.geocoding.reverse(lat, lon);
  }
}
