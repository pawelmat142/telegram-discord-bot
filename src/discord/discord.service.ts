import { Injectable, Logger, UnauthorizedException, UnsupportedMediaTypeException } from '@nestjs/common';
import { Message } from 'src/telegram/message';
import { TelegramService } from 'src/telegram/telegram.service';
import { Channel, Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { Log } from './log';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class DiscordService {
    private logger = new Logger(DiscordService.name)


    private readonly mongoOn = process.env.MONGO_ON === 'true'
    private readonly prodEnv = process.env.ENV_TYPE === 'PROD'

    constructor(
        private readonly telegramService: TelegramService,
        @InjectModel(Log.name) private logModel: Model<Log>,
    ) {
        this.client = this.initClient()
    }

    private readonly client: Client
    private readonly channels: Map<string, Channel> = new Map() //telegram channel id -> discord Channel
        
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
            this.putLog(telegramChannelId, channel, message)
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
                        discordChannel['discordChannelId'] = discordChannelId
                        this.channels.set(telegramChannelId, discordChannel)
                        this.logger.log(`Initialized discord channel ${iterator} with id ${discordChannelId}`)
                    }
                }
            } else break
        } while(iterator++)

        const channels = Array.from(this.channels.values())
        this.logChannels()
        if (!channels.length) {
            this.logger.error('Not found discord channels')
        }
    }

    public logChannels() {
        this.channels.forEach((channel, key) => {
            const log = `
TELEGRAM_CHANNEL_ID: ${key}
NAME: ${(channel?.['guild']?.['name'])}
DISCORD_CHANNEL_ID: ${channel['discordChannelId']}
DISCORD_NAME: ${(channel?.['name'])}
`
this.logger.log(log)
})
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

    private putLog(telegramChannelId: string, channel: Channel, message: Message) {
        if (!this.mongoOn || !this.prodEnv) {
            return
        }
        return new this.logModel({
            telegramChannelId: telegramChannelId,
            discordChannelId: channel?.['discordChannelId'],
            message: message?.message,
            timestamp: new Date(),
            discordChannelName: channel?.['guild']?.['name']
        }).save()
    }

    public getLogs() {
        if (!this.mongoOn) {
            throw new UnsupportedMediaTypeException()
        }
        return this.logModel.find().exec()
    }

}
