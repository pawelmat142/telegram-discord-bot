import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { AppDiscordModule } from './discord/discord.module';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { NewsModule } from './news/news.module';

const getMongoOrNot = () => {
  const result = []
  if (process.env.MONGO_ON === 'true') {
    result.push(MongooseModule.forRoot(process.env.MONGO_URI))
  }
  return result
}

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    TelegramModule,
    AppDiscordModule,
    ...getMongoOrNot(),
    NewsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
