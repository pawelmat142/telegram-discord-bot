import { Controller, Get, Logger } from '@nestjs/common';
import { DiscordService } from './discord/discord.service';

@Controller()
export class AppController {

  private readonly logger = new Logger(AppController.name)

  constructor(
    private readonly discordService: DiscordService,
  ) {}

  @Get('test')
  getHello() {
    return this.logger.log('test')
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
