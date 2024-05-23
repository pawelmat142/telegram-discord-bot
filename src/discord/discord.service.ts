import { Injectable, Logger } from '@nestjs/common';
import { TelegramService } from 'src/telegram/telegram.service';
import { AttachmentBuilder, Channel, Client, GatewayIntentBits, MessageCreateOptions, TextChannel } from 'discord.js';
import { Subject } from 'rxjs';
import { TelegramMessage } from 'src/telegram/telegram-message';

export interface MsgCtx {
    message: TelegramMessage
    telegramChannelId: string
    discordChannel: TextChannel
}

@Injectable()
export class DiscordService {

    private readonly logger = new Logger(DiscordService.name)

    private readonly mongoOn = process.env.MONGO_ON === 'true'
    private readonly prodEnv = process.env.ENV_TYPE === 'PROD'
    private readonly testMode = process.env.TEST_MODE === 'true'
    private readonly skipDiscord = process.env.SKIP_DISCORD === 'true'

    constructor(
        private readonly telegramService: TelegramService,
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
        this.logger.log('[START] Initialization')
        this.initFlag = true
        await this.telegramService.initService()
        // TODO
        if (this.testMode) {
            return
        }
        await this.initChannels()
        this.subscribeForTelegramMessages()
        this.initNews$.next(true)
        this.logger.log('[STOP] Initialization')
    }


    async sendMessage(message: TelegramMessage) {
        if (process.env.SKIP_DISCORD === 'true') {
            this.logger.debug(`SKIP DISCORD`)
            return
        }
        const telegramChannelId = message.peer_id?.channel_id
        const channel: Channel = this.channels.get(telegramChannelId)
        const discordChannelId = channel['discordChannelId']

        if (!(channel instanceof TextChannel)) {
            this.logger.error(`Channel ${discordChannelId} is not a text channel`)
            return
        }

        const ctx: MsgCtx = {
            telegramChannelId: message.peer_id?.channel_id,
            message: message,
            discordChannel: channel
        }
        try {
            this._sendMessage(ctx)
            this.logger.log(`Send message ${message.id} from telegram: ${message.peer_id?.channel_id} to discord: ${discordChannelId}`)
        } 
        catch (error) {
            this.logger.error(`Error sending message from telegram: ${message.peer_id?.channel_id} to discord: ${discordChannelId}`)
            this.logger.error(error)
        }
    }


    private async _sendMessage(ctx: MsgCtx) {
        if (!ctx.telegramChannelId) {
            throw new Error(`telegramChannelId not found`)
        }
        if (this.skipDiscord) return
        
        const photoFile = await this.getMessagePhoto(ctx)

        const options: MessageCreateOptions = {
            content: this.prepareMessageSeparator(ctx.message?.message),
            files: photoFile ? [photoFile] : undefined
        }

        await ctx.discordChannel.send(options)
    }


    private prepareMessageSeparator(msg: string): string {
        const separator = ":mushroom: :mushroom: :mushroom:\n"
        return separator + msg
    }

    private async getMessagePhoto(ctx: MsgCtx): Promise<AttachmentBuilder | null> {
        const telegramChannelId = ctx.message?.peer_id?.channel_id
        try {
            if (ctx.message?.media?.photo) {
                const bytes: Uint8Array = await this.telegramService.getPhoto(ctx.message)
                const file = new AttachmentBuilder(Buffer.from(bytes))
                this.logger.debug(`Photo file found in message: ${ctx.message.id}, telegram: ${telegramChannelId}`)
                return file
            }
            this.logger.log(`Not found photo file in message ${ctx.message.id} telegram: ${telegramChannelId}`)
        } catch (error) {
            this.logger.error(`Error getting msg photo ${ctx.message.id} telegram: ${telegramChannelId}`)
            this.logger.error(error)
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

    private logChannels() {
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
            this.logger.debug(`Subscruption for message with id: [${message.id}]`)
            this.sendMessage(message)
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
            this.logger.error(`When sending message to discord: ${channelId}`)
            this.logger.error(error)
            return null
        }
    }


}
