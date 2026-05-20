import { Module } from '@nestjs/common';
import { DianController } from './dian.controller';
import { DianService } from './dian.service';
import { XmlGeneratorService } from './xml-generator.service';
import { PlanGuard } from './guards/plan.guard';

@Module({
  controllers: [DianController],
  providers: [DianService, XmlGeneratorService, PlanGuard],
  exports: [DianService],
})
export class DianModule {}
