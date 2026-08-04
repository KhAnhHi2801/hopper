import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CredentialsModule } from './credentials/credentials.module';
import { JobStatusModule } from './job-status/job-status.module';

@Module({
  imports: [PrismaModule, CredentialsModule, JobStatusModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
