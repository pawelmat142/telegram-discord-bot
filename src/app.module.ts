import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { AppDiscordModule } from './discord/discord.module';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { NewsModule } from './news/news.module';
import { SignalModule } from './signal/signal.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    TelegramModule,
    AppDiscordModule,
    NewsModule,
    SignalModule,
  ],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {}
