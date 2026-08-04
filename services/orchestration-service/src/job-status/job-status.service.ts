import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobStatus } from '../generated/prisma/client';

@Injectable()
export class JobStatusService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new job row with the default 'PENDING' status
  async createJob(): Promise<JobStatus> {
    return this.prisma.jobStatus.create({
      data: {
        status: 'PENDING',
      },
    });
  }

  // Updates the status of an existing job, e.g. when a job-events message arrives.
  async updateJobStatus(jobId: string, status: string): Promise<JobStatus> {
    return this.prisma.jobStatus.update({
      where: { id: jobId },
      data: { status },
    });
  }

  // Reads the current status of a job — used by polling endpoints.
  async getJobStatus(jobId: string): Promise<JobStatus> {
    const job = await this.prisma.jobStatus.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error(`No job found with ID: ${jobId}`);
    }

    return job;
  }
}
