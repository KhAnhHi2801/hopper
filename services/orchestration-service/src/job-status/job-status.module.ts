import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JobStatusService } from './job-status.service';

@Module({
  imports: [PrismaModule],
  providers: [JobStatusService],
  exports: [JobStatusService],
})
export class JobStatusModule {}
