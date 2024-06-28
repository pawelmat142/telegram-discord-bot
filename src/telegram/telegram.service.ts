import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject } from 'rxjs';
import * as path from 'path';
import * as prompt from 'prompt';
import { TelegramMessage, Photo } from './telegram-message';
import { SignalService } from 'src/signal/signal.service';
import { DuplicateService } from './duplicate.service';
import { TelegramMessageRepo } from './telegram-message.repo';
import { MTProtoClient } from './mtproto';
import { AuthResponse, AuthUser, TelegramUpdate, TelegramUpdates } from './model';
import { Cron, CronExpression } from '@nestjs/schedule';

// https://www.youtube.com/watch?v=TRNeRySFtg0

@Injectable()
export class TelegramService implements OnModuleInit {
    
    private readonly logger = new Logger(TelegramService.name)

    private readonly API_ID = parseInt(process.env.TELEGRAM_API_ID)
    private readonly API_HASH = process.env.TELEGRAM_API_HASH
    private readonly API_PHONE_NUMBER = process.env.TELEGRAM_PHONE_NUMBER

    private readonly telegramChannelIds: string[] = []

    client: MTProtoClient

    private _channelsMessages$ = new Subject<TelegramMessage>()
    
    public get channelsMessages$() {
        return this._channelsMessages$.asObservable()
    }
    

    constructor(
        private readonly signalService: SignalService,
        private readonly duplicateService: DuplicateService,
        private readonly telegramMessageRepo: TelegramMessageRepo,
    ) {}

    onModuleInit() {
        this.initMtProtoClient()
    }

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async initMtProtoClient() {
        this.logger.warn(`[START] MTProtoClient initialization`)
        const config = {
            api_id: this.API_ID,
            api_hash: this.API_HASH,
            sessionPath: path.resolve(__dirname, 'your_session_file.json')
        }
        
        this.client = new MTProtoClient(config)
        
        await this.auth()
        
        this.client.mtproto.updates.on('updates', (telegramUpdates: TelegramUpdates) => {
            telegramUpdates.updates.forEach((telegramUpdate: TelegramUpdate) => {
                if (['updateNewMessage', 'updateNewChannelMessage'].includes(telegramUpdate._)) {
                    const telegramMessage = telegramUpdate?.message as TelegramMessage
                    if (telegramMessage?._ === 'message') {
                        this.onMessage(telegramMessage)
                    }
                }
            })
        })
        
        this.client.mtproto.updates.on('error', (error) => {
            this.logger.error('MTProtoClient error:', error);
        });

        this.client.mtproto.updates.on('disconnect', () => {
            this.logger.warn('MTProtoClient disconnected');
        });

        this.client.mtproto.updates.on('reconnect', () => {
            this.logger.log('MTProtoClient reconnected');
        });
        
        this.logger.warn(`[STOP] MTProtoClient initialization`)
    }


    private initFlag = false

    public initChannelIds() {
        if (this.initFlag) {
            return
        }
        this.initFlag = true

        var iterator = 1
        var channelId = ''
        do {
            channelId = process.env[`TELEGRAM_CHANNEL_ID_${iterator}`]
            if (channelId) {
                this.telegramChannelIds.push(channelId)
            } else break
        } while(iterator++)
        if (!this.telegramChannelIds.length) throw new Error('Not found any channel id')

        this.logger.log(`Bot is listening for messages from channels: ${this.telegramChannelIds.join(", ")}`)
    }


    private async auth(): Promise<void> {
        try {
            prompt.start()

            await this.checkLogin()
            this.logger.warn('MTProtoClient already authorized')
        } catch (error) {
            if (error?.error_message === 'AUTH_KEY_UNREGISTERED') {
                this.logger.warn(`Authorization...`)
                await this.client.mtproto.setDefaultDc(4)
                const { phone_code_hash } = await this.sendCode()
                
                this.logger.log('Provide code...')
                const { code } = await prompt.get(['code'])

                const user = await this.signIn({ code, phone_code_hash })
                if (!user) {
                    this.logger.warn('MTProtoClient authorization failed')
                    return
                }
                this.logger.warn('MTProtoClient authorized')
            } else {
                this.logger.error(error)
            }
        }
    }

    private async checkLogin(): Promise<void> {
        await this.client.mtproto.call("users.getFullUser", {
          id: {
            _: "inputUserSelf",
          },
        });
    }

    private sendCode(): Promise<any> {
        return this.client.mtproto.call('auth.sendCode', {
            phone_number: this.API_PHONE_NUMBER,
            settings: {
                _: 'codeSettings'
            }
        })
        .catch(error => console.error(error.error_message ?? error))
    }

    private async signIn({ code, phone_code_hash }): Promise<AuthUser> {
        try {
            const params = {
                phone_code: code,
                phone_number: this.API_PHONE_NUMBER,
                phone_code_hash: phone_code_hash
            }
            const res = await this.client.mtproto.call('auth.signIn', params)

            if (res?._ === 'auth.authorization') {
                const response = res as AuthResponse
                return response.user
            }
        } catch (error) {
            this.logger.error(error.error_message ?? error)
            if (error.error_message !== 'SESSION_PASSWORD_NEEDED') {
                return
            }
        }
    }


    private async onMessage(telegramMessage: TelegramMessage) {
        const telegramChannelId = telegramMessage.peer_id?.channel_id || telegramMessage.peer_id?.user_id.toString()
        if (this.telegramChannelIds.includes(telegramChannelId)) {
            this.telegramMessageRepo.save(telegramMessage)

            this.logger.log(`Received message with id: ${telegramMessage.id}, from telegram: ${telegramChannelId}`)
            if (!telegramMessage?.message) {
                this.logger.log(`Message with id: ${telegramMessage.id}, has no content message`)
                return
            }
            this.logger.debug(telegramMessage?.message)

            if (this.duplicateService.telegramMessageIsDuplicated(telegramMessage)) {
                this.logger.warn(`Telegram message with id [${telegramMessage.id}] duplicate PREVENTED`)
                return
            }

            this.signalService.processIfSignal(telegramMessage)
            this._channelsMessages$.next(telegramMessage)
        } else {
            this.logger.log(`Received message with id [${telegramMessage.id}] - NOT in telegramChannelIds list!`)
        }
    }


    public async getPhoto(message: TelegramMessage): Promise<Uint8Array> {
        const photo = message?.media?.photo
        if (photo) {
            try {
                const file = await this.client.mtproto.call('upload.getFile', {
                    location: {
                      _: 'inputPhotoFileLocation',
                      id: photo.id,
                      access_hash: photo.access_hash,
                      file_reference: photo.file_reference,
                      thumb_size: this.getPhotoThumbSize(photo)
                    },
                    offset: 0,
                    limit: 1048576, //1MB
                })
                return file.bytes
            } catch (error) {
                console.error(error)
                return null
            }
        }
        return null
    }

    private getPhotoThumbSize(photo: Photo): string {
        var size = photo.sizes.find(size => size._ == 'photoSizeProgressive')
        if (!size) {
            size = photo.sizes.find(size => size._ == 'photoSize')
        }
        if (!size) {
            size = photo.sizes[0]
        }
        return size?.type
    }

}