import { Controller, Get } from '@nestjs/common';
import { DiscordService } from './discord/discord.service';

@Controller()
export class AppController {
  constructor(
    private readonly discordService: DiscordService
  ) {}

  @Get('test')
  getHello() {
    console.log('test')
  }

  @Get('log-channels')
  logChannels() {
    return this.discordService.logChannels()
  }

  @Get('logs')
  getLogs() {
    return this.discordService.getLogs()
  }
}
