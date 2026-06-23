import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role, UserStatus } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  pin?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

