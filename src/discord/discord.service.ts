import { Injectable, Logger, UnsupportedMediaTypeException } from '@nestjs/common';
import { TelegramMessage as TelegramMessage } from 'src/telegram/message';
import { TelegramService } from 'src/telegram/telegram.service';
import { AttachmentBuilder, Channel, Client, GatewayIntentBits, MessageCreateOptions, TextChannel } from 'discord.js';
import { Log } from './log';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Subject } from 'rxjs';
import { LogError } from './log-error';

@Injectable()
export class DiscordService {
    private logger = new Logger(DiscordService.name)

    private readonly mongoOn = process.env.MONGO_ON === 'true'
    private readonly prodEnv = process.env.ENV_TYPE === 'PROD'
    private readonly skipDiscord = process.env.SKIP_DISCORD === 'true'

    constructor(
        private readonly telegramService: TelegramService,
        @InjectModel(Log.name) private logModel: Model<Log>,
        @InjectModel(LogError.name) private logErrorModel: Model<LogError>,
    ) {
        this.client = this.initClient()
    }

    public readonly initNews$ = new Subject<boolean>()

    private readonly client: Client
    private readonly channels: Map<string, Channel> = new Map() //telegram channel id -> discord Channel
        
    private initFlag = false
    async init() {
        if (this.initFlag) {
            return
        }
        this.initFlag = true
        await this.telegramService.initService()
        // TODO
        // if (this.skipDiscord) {
        //     return
        // }
        // await this.initChannels()
        // this.subscribeForTelegramMessages()
        // this.initNews$.next(true)
        this.logger.log('Initialization completed')
    }

    async sendMessage(message: TelegramMessage, telegramChannelId: string) {
        const channel: Channel = this.channels.get(telegramChannelId)
        if (channel instanceof TextChannel) {
            const photoFile = await this.getMessagePhoto(message)
            const options: MessageCreateOptions = {
                content: message?.message,
                files: photoFile ? [photoFile] : []
            }
            await channel.send(options)
            this.putLog(telegramChannelId, channel, message)
        } else {
            console.error('Channel is not a text channel')
        }
    }

    private async getMessagePhoto(message: TelegramMessage): Promise<AttachmentBuilder | null> {
        if (message?.media?.photo) {
            const bytes: Uint8Array = await this.telegramService.getPhoto(message)
            const file = new AttachmentBuilder(Buffer.from(bytes))
            return file
        }
        return null
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
        this.telegramService.channelsMessages$.subscribe((message: TelegramMessage) => {
            try {
                const telegramChannelId = message.peer_id?.channel_id
                if (telegramChannelId) {
                    this.sendMessage(message, telegramChannelId)
                }
            } catch (error) {
                this.logError(error)
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

    private putLog(telegramChannelId: string, channel: Channel, message: TelegramMessage) {
        if (!this.mongoOn || !this.prodEnv) {
            return
        }
        return new this.logModel({
            telegramChannelId: telegramChannelId,
            discordChannelId: channel?.['discordChannelId'],
            message: message?.message,
            timestamp: new Date(),
            discordChannelName: channel?.['guild']?.['name'],
            telegramMessageId: message?.message?.['id']
        }).save()
    }

    public getLogs() {
        if (!this.mongoOn) {
            throw new UnsupportedMediaTypeException()
        }
        return this.logModel.find().exec()
    }

    public async sendMessageToChannel(message: string, channelId: string) {
        try {
            const channel = await this.client.channels.fetch(channelId)
            if (channel instanceof TextChannel) {
                await channel.send(message)
            }
            return message
        } catch (error) {
            console.error(error)
            return null
        }
    }

    private logError(error: string) {
        return new this.logErrorModel({
            error: error,
            reason: 'Discord service',
            timestamp: new Date
        }).save()
    }

}
