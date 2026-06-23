import { IsEnum, IsOptional, IsString, IsEmail } from 'class-validator';
import { UserStatus, Role } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

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
  phone?: string;
}
