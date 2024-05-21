import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { DiscordService } from './discord/discord.service';
import { NewsService } from './news/news.service';

@Controller()
export class AppController {

  private readonly logger = new Logger(AppController.name)

  constructor(
    private readonly discordService: DiscordService,
    private readonly newsSerice: NewsService,
  ) {}

  @Get('test/:name')
  getHello(@Param('name') name: string) {
    // return this.newsSerice.strike(name)
  }

  @Get('news/strike/:name')
  strikeNews(@Param('name') name: string) {
    this.newsSerice.strikeByName(name)
  }

  @Get('news/reset/:name')
  resetNewsIds(@Param('name') name: string) {
    this.newsSerice.resetPreviousIds(name)
  }

  @Post('news/initialize')
  initializeNews(@Body() data: any) {
    this.newsSerice.initialize(data)
  }
}
