import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { UpstreamError } from './http.util';

/** แปลง error จาก API ภายนอกเป็น 502 พร้อมข้อความที่หน้าเว็บเอาไปแสดงได้เลย */
@Catch(UpstreamError)
export class UpstreamExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UpstreamExceptionFilter.name);

  catch(exception: UpstreamError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    this.logger.error(exception.message);

    response.status(HttpStatus.BAD_GATEWAY).json({
      statusCode: HttpStatus.BAD_GATEWAY,
      error: 'Bad Gateway',
      message: 'ดึงข้อมูลจากแหล่งข้อมูลภายนอกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
      detail: exception.message,
    });
  }
}
