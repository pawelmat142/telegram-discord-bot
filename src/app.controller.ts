import { Controller, Get } from '@nestjs/common';
import { DiscordService } from './discord/discord.service';

@Controller()
export class AppController {
  constructor(
  ) {}

  @Get('test')
  getHello() {
    console.log('test')
  }
}
