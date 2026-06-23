import { IsString, IsIn } from 'class-validator';

export class CreateBankAccessRequestDto {
  @IsString()
  requesterId: string;

  @IsString()
  @IsIn(['uba', 'zenith'])
  bankId: string;
}
