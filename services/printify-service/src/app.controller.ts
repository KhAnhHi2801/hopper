import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// Default Nest CLI boilerplate — only HTTP surface on this service, since
// all real work is triggered by BullMQ jobs, not HTTP requests.
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
