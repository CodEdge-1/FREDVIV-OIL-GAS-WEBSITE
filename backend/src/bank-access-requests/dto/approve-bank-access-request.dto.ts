import { IsOptional, IsString } from 'class-validator';

export class ApproveBankAccessRequestDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;
}
