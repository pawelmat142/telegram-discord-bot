import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SignalModule } from 'src/signal/signal.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ForwardMessage, ForwardMessageSchema } from './forward-message';
import { DuplicateService } from './duplicate.service';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: ForwardMessage.name,
      schema: ForwardMessageSchema
    }]),
    ConfigModule.forRoot(),
    HttpModule,
    SignalModule
  ],
  providers: [TelegramService, DuplicateService],
  exports: [TelegramService]
})
export class TelegramModule {}
