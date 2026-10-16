import { Logger } from '@nestjs/common';

const logger = new Logger('HttpUtil');

export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

export interface FetchJsonOptions {
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/** GET JSON พร้อม timeout และ retry แบบ exponential backoff */
export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { timeoutMs = 10_000, retries = 2, headers = {} } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json', 'User-Agent': 'flood-alert-app/1.0', ...headers },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new UpstreamError(
          `${res.status} ${res.statusText} จาก ${new URL(url).host}${body ? `: ${body.slice(0, 200)}` : ''}`,
          res.status,
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
      // 4xx คือคำขอผิดเอง ลองใหม่ก็ได้ผลเดิม
      if (error instanceof UpstreamError && error.status && error.status < 500) break;
      if (attempt < retries) {
        const backoff = 300 * 2 ** attempt;
        logger.warn(`ยิง ${new URL(url).host} ไม่สำเร็จ (ครั้งที่ ${attempt + 1}) รอ ${backoff}ms แล้วลองใหม่`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastError instanceof UpstreamError) throw lastError;
  const reason = lastError instanceof Error ? lastError.message : String(lastError);
  throw new UpstreamError(`เชื่อมต่อ ${new URL(url).host} ไม่สำเร็จ: ${reason}`);
}

export function buildUrl(base: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}
