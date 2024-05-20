import { Injectable, Logger } from '@nestjs/common';
import { TelegramService } from 'src/telegram/telegram.service';
import { AttachmentBuilder, Channel, Client, GatewayIntentBits, MessageCreateOptions, TextChannel } from 'discord.js';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Subject } from 'rxjs';
import { LogError } from './log-error';
import { toDateString } from 'src/global/util';
import { TelegramMessage } from 'src/telegram/telegram-message';

export interface MsgCtx {
    message: TelegramMessage
    telegramChannelId: string
    logs: string[]
}

@Injectable()
export class DiscordService {
    private logger = new Logger(DiscordService.name)

    private readonly mongoOn = process.env.MONGO_ON === 'true'
    private readonly prodEnv = process.env.ENV_TYPE === 'PROD'
    private readonly testMode = process.env.TEST_MODE === 'true'
    private readonly skipDiscord = process.env.SKIP_DISCORD === 'true'

    constructor(
        private readonly telegramService: TelegramService,
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
        this.logger.log('initializing...')
        this.initFlag = true
        await this.telegramService.initService()
        // TODO
        if (this.testMode) {
            return
        }
        await this.initChannels()
        this.subscribeForTelegramMessages()
        this.initNews$.next(true)
        this.logger.log('Initialization completed')
    }



    async sendMessage(message: TelegramMessage, telegramChannelId: string) {
        const ctx: MsgCtx = {
            telegramChannelId: telegramChannelId,
            message: message,
            logs: []
        }
        try {
            this._sendMessage(ctx)
            this.addLog('Message send', ctx)
        } catch (error) {
            this.addError(`while sending message`, ctx, error)
            this.logError(error, telegramChannelId, ctx)
        }
    }


    private async _sendMessage(ctx: MsgCtx) {
        if (!ctx.telegramChannelId) {
            throw new Error(`telegramChannelId not found`)
        }
        const channel: Channel = this.channels.get(ctx.telegramChannelId)
        if (!(channel instanceof TextChannel)) {
            throw new Error(`Channel is not a text channel`)
        }
        if (this.skipDiscord) return
        
        const photoFile = await this.getMessagePhoto(ctx)

        const options: MessageCreateOptions = {
            content: this.prepareMessageSeparator(ctx.message?.message),
            files: photoFile ? [photoFile] : undefined
        }

        await channel.send(options)
    }


    private prepareMessageSeparator(msg: string): string {
        const separator = ":mushroom: :mushroom: :mushroom:\n"
        return separator + msg
    }

    private async getMessagePhoto(ctx: MsgCtx): Promise<AttachmentBuilder | null> {
        try {
            if (ctx.message?.media?.photo) {
                const bytes: Uint8Array = await this.telegramService.getPhoto(ctx.message)
                const file = new AttachmentBuilder(Buffer.from(bytes))
                this.addLog('Photo file found', ctx)
                return file
            }
            this.addLog('Photo file not found', ctx)
        } catch (error) {
            this.addError(`Error while getting msg photo`, ctx, error)
            return null
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
            const lines = [
                `TELEGRAM_CHANNEL_ID: ${key}`,
                `NAME: ${(channel?.['guild']?.['name'])}`,
                `DISCORD_CHANNEL_ID: ${channel['discordChannelId']}`,
                `DISCORD_NAME: ${(channel?.['name'])}`
            ]
            const msg =(lines || []).reduce((acc, line) => acc + line + '\n', '')
            this.logger.log(msg)
        })
    }

    private subscribeForTelegramMessages(): void {
        this.telegramService.channelsMessages$.subscribe((message: TelegramMessage) => {
            const telegramChannelId = message.peer_id?.channel_id
            this.sendMessage(message, telegramChannelId)
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


    public async sendMessageToChannel(message: string, channelId: string) {
        try {
            const channel = await this.client.channels.fetch(channelId)
            if (channel instanceof TextChannel) {
                await channel.send(message)
            }
            return message
        } catch (error) {
            this.logError(error)
            return null
        }
    }


    private logError(error: string, telegramChannelId?: string, ctx?: MsgCtx) {
        this.logger.error(error)
        return new this.logErrorModel({
            error: error,
            reason: 'Discord service',
            timestamp: new Date,
            telegramChannelId: telegramChannelId,
            logs: ctx.logs
        }).save()
    }


    private addLog(log: string, ctx: MsgCtx, prefix?: string) {
        const _prefix = prefix ? `${prefix} ` : ''
        const _log = `[${toDateString(new Date())}] ${_prefix}- ${log}`
        ctx.logs.push(_log)
        this.logger.log(_log)
    }

    private addError(msg: string, ctx: MsgCtx, error?: any) {
        this.addLog(msg, ctx, '[ERROR]')
    }
    
}
