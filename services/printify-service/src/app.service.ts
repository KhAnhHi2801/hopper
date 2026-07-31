import { Injectable } from '@nestjs/common';

// Default Nest CLI boilerplate, kept as-is — this service isn't part of the
// printify-import domain logic, just a default health-check endpoint.
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
