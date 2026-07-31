import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PrintifyModule } from './printify/printify.module';

/**
 * Root module. Owns the two shared infrastructure connections
 * (BullMQ/Redis for queues, Mongoose/MongoDB for raw_products) at the app
 * level via `forRootAsync`, so any feature module can inject queues/models
 * without re-establishing connections. Domain logic itself lives in
 * {@link PrintifyModule}, imported here purely so Nest's DI container
 * bootstraps it — nothing calls PrintifyModule's providers directly from
 * this module.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('REDIS_URL') },
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URL'),
      }),
    }),
    PrintifyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
