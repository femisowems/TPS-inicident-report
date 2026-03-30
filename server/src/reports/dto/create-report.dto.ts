import { IsString, IsEnum, IsNotEmpty, MinLength, IsObject, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { IncidentType } from '../report.entity';

class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsString()
  @IsNotEmpty()
  address: string;
}

export class CreateReportDto {
  @IsEnum(IncidentType)
  type: IncidentType;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsOptional()
  @IsObject()
  extraFields?: Record<string, any>;
}
