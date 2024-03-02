import { Module } from '@nestjs/common';
import { SignalService } from './signal.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SignalController } from './signal.controller';
import { HttpModule } from '@nestjs/axios';
import { LogError, LogErrorSchema } from 'src/discord/log-error';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: LogError.name,
      schema: LogErrorSchema
    }]),
    HttpModule,
  ],
  providers: [SignalService],
  exports: [SignalService],
  controllers: [SignalController]
})
export class SignalModule {}
