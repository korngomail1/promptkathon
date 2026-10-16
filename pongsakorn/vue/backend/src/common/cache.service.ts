import { Injectable, Logger } from '@nestjs/common';

interface Entry<T> {
  value: T;
  expiresAt: number;
}

/**
 * แคชในหน่วยความจำแบบง่าย กันไม่ให้ยิง API ภายนอกถี่เกินไป
 * (Open-Meteo มี rate limit สำหรับการใช้งานแบบฟรี)
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, Entry<unknown>>();

  async wrap<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    const hit = this.store.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value as T;
    }

    const value = await factory();
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    this.prune();
    return value;
  }

  private prune(): void {
    if (this.store.size < 500) return;
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }
    this.logger.debug(`pruned cache, size=${this.store.size}`);
  }
}
