import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { ConfigModule } from '@nestjs/config';
import { TelegramModule } from 'src/telegram/telegram.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Log, LogSchema } from './log';
import { LogError, LogErrorSchema } from './log-error';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([{
      name: Log.name,
      schema: LogSchema
    }, {
      name: LogError.name,
      schema: LogErrorSchema
    }]),
    TelegramModule
  ],
  providers: [DiscordService],
  exports: [DiscordService]
})
export class AppDiscordModule {}
