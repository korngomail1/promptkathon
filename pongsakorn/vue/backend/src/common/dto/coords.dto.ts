import { Transform } from 'class-transformer';
import { IsLatitude, IsLongitude, IsOptional, IsString, Length } from 'class-validator';

const toNumber = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

export class CoordsQueryDto {
  @Transform(toNumber)
  @IsLatitude({ message: 'lat ต้องเป็นละติจูดระหว่าง -90 ถึง 90' })
  lat!: number;

  @Transform(toNumber)
  @IsLongitude({ message: 'lon ต้องเป็นลองจิจูดระหว่าง -180 ถึง 180' })
  lon!: number;

  /** ชื่อพื้นที่ที่ frontend เลือกไว้ ใช้แสดงผลแทนการ reverse geocode ซ้ำ */
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;
}

export class SearchQueryDto {
  @IsString()
  @Length(1, 80, { message: 'q ต้องมีความยาว 1-80 ตัวอักษร' })
  q!: string;

  @IsOptional()
  @Transform(toNumber)
  limit?: number;
}
