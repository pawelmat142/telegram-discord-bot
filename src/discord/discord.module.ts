import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { ConfigModule } from '@nestjs/config';
import { TelegramModule } from 'src/telegram/telegram.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Log, LogSchema } from './log';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([{
      name: Log.name,
      schema: LogSchema
    }]),
    TelegramModule
  ],
  providers: [DiscordService],
  exports: [DiscordService]
})
export class AppDiscordModule {}
