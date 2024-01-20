import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Message } from 'src/telegram/message';
import { TelegramService } from 'src/telegram/telegram.service';
import { Channel, Client, GatewayIntentBits, TextChannel } from 'discord.js';

@Injectable()
export class DiscordService {
    private logger = new Logger(DiscordService.name)

    constructor(
        private readonly telegramService: TelegramService,
    ) {
        this.client = this.initClient()
    }

    private readonly client: Client
    private readonly channels: Map<String, Channel> = new Map() //telegram channel id -> discord Channel
        
    async init() {
        await this.telegramService.initService()
        await this.initChannels()
        this.subscribeForTelegramMessages()
        this.logger.log('Initialization completed')
    }

    async sendMessage(message: Message, telegramChannelId: string) {
        const channel: Channel = this.channels.get(telegramChannelId)
        if (channel instanceof TextChannel) {
            await channel.send(message?.message)
        } else {
            console.error('Channel is not a text channel')
        }
    }

    private async initChannels() {
        var iterator = 1
        var telegramChannelId = ''
        do {
            telegramChannelId = process.env[`TELEGRAM_CHANNEL_ID_${iterator}`]
            if (telegramChannelId) {
                const discordChannelId = process.env[`DISCORD_CHANNEL_ID_${iterator}`]
                if (discordChannelId) {
                    const discordChannel = await this.client.channels.fetch(discordChannelId)
                    if (discordChannel) {
                        this.channels.set(telegramChannelId, discordChannel)
                        this.logger.log(`Initialized discord channel ${iterator} with id ${discordChannelId}`)
                    }
                }
            } else break
        } while(iterator++)

        const channels = Array.from(this.channels.values())
        if (!channels.length) {
            this.logger.error('Not found discord channels')
        }
    }


    private subscribeForTelegramMessages(): void {
        this.telegramService.channelsMessages$.subscribe((message: Message) => {
            const telegramChannelId = message.peer_id?.channel_id
            if (telegramChannelId) {
                this.sendMessage(message, telegramChannelId)
            }
        })
    }



    private initClient(): Client {
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
             GatewayIntentBits.GuildMessages
            ],
        })
        client.once('ready', () => {
            this.logger.log(`Logged in as ${this.client.user.tag}`)
            this.init()
        });
      
        client.login(process.env.DISCORD_BOT_TOKEN)
        return client
    }
}
