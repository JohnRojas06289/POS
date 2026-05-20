import { IsString, IsNumber, IsObject } from 'class-validator';

export class WompiTransactionDto {
  id: string;
  status: 'APPROVED' | 'DECLINED' | 'ERROR' | 'PENDING';
  reference: string;
  amount_in_cents: number;
  customer_email: string;
}

export class WompiWebhookDto {
  @IsString()
  event: string;

  @IsObject()
  data: { transaction: WompiTransactionDto };

  @IsObject()
  signature: { properties: string[]; checksum: string };

  @IsNumber()
  timestamp: number;
}
