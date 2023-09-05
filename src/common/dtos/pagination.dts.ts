import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    default: 10,
    description: 'How many rows do you need',
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number) //alternativa a enableImplicitConversion: true
  limit?: number;

  @ApiProperty({
    default: 0,
    description: 'How many rows do you want to skip',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number) //alternativa a enableImplicitConversion: true
  offset?: number;
}
