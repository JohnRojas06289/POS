import { IsString, IsUUID, IsIn, IsEmail } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID()
  planId: string;

  @IsString()
  @IsIn(['wompi_card', 'wompi_nequi', 'wompi_pse'])
  paymentMethod: string;

  @IsEmail()
  customerEmail: string;

  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;
}
