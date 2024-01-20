import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { ConfigModule } from '@nestjs/config';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegramModule
  ],
  providers: [DiscordService],
  exports: [DiscordService]
})
export class AppDiscordModule {}
