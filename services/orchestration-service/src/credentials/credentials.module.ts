import { Module } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JobStatusService } from '../job-status/job-status.service';

@Module({
  imports: [PrismaModule],
  providers: [CredentialsService, JobStatusService],
  exports: [CredentialsService],
})
export class CredentialsModule {}
