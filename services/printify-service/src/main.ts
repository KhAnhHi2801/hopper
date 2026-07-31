import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Boots this microservice as a standalone Nest HTTP app. In this MVP the HTTP
// surface is just the default health-check controller — the real work
// (printify-import/printify-catalog processors) starts as soon as AppModule's
// BullMQ workers register, no HTTP request needed to trigger them.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
