import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { MongooseModule } from '@nestjs/mongoose';
import { News, NewsSchema } from './news';
import { HttpModule } from '@nestjs/axios';
import { AppDiscordModule } from 'src/discord/discord.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    HttpModule,
    AppDiscordModule,
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([{
      name: News.name,
      schema: NewsSchema
    }]),
  ],
  providers: [NewsService],
  exports: [NewsService]
})
export class NewsModule {}
