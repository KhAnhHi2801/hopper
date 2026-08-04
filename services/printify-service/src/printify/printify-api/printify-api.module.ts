import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PrintifyApiService } from './printify-api.service';

/**
 * Isolates the real Printify HTTP client behind its own module so
 * `PrintifyApiService` can be imported/exported independently of the
 * cache and queue plumbing.
 */
@Module({
  imports: [HttpModule],
  providers: [PrintifyApiService],
  exports: [PrintifyApiService],
})
export class PrintifyApiModule {}
