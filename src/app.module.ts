import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { AppDiscordModule } from './discord/discord.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegramModule,
    AppDiscordModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
