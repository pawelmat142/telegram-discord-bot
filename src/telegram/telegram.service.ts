import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import * as MTProto from '@mtproto/core';
import * as path from 'path';
import * as prompt from 'prompt';
import { TelegramMessage, Photo } from './telegram-message';
import { SignalService } from 'src/signal/signal.service';
import { DuplicateService } from './duplicate.service';
import { TelegramMessageRepo } from './telegram-message.repo';
import { TelegramUpdateInfo, updateNewChannelMessage, UpdateNewMessage, updateNewMessage, UpdateReadHistoryOutbox } from './interfaces';

// https://www.youtube.com/watch?v=TRNeRySFtg0

@Injectable()
export class TelegramService {
    
    private readonly logger = new Logger(TelegramService.name)

    private readonly api_id = parseInt(process.env.TELEGRAM_API_ID)
    private readonly api_hash = process.env.TELEGRAM_API_HASH
    private readonly phoneNumber = process.env.TELEGRAM_PHONE_NUMBER
    private readonly telegramChannelIds: string[] = []

    private mtProto: MTProto

    constructor(
        private readonly signalService: SignalService,
        private readonly duplicateService: DuplicateService,
        private readonly telegramMessageRepo: TelegramMessageRepo,
    ) {}

    private _channelsMessages$ = new Subject<TelegramMessage>()
    public channelsMessages$ = this._channelsMessages$.asObservable()

    private initFlag = false

    public async initService() {
        if (this.initFlag) {
            return
        }
        this.initFlag = true
        this.initChannelIds()
        this.initMTProto()

        await this.auth(this.phoneNumber)
        this.subscribeToUpdates()

        this.logger.log(`Bot is listening for messages from channels: ${this.telegramChannelIds.join(", ")}`)
    }


    private initChannelIds() {
        var iterator = 1
        var channelId = ''
        do {
            channelId = process.env[`TELEGRAM_CHANNEL_ID_${iterator}`]
            if (channelId) {
                this.telegramChannelIds.push(channelId)
            } else break
        } while(iterator++)
        if (!this.telegramChannelIds.length) throw new Error('Not found any channel id')
    }

    private initMTProto(): void {
        this.mtProto = new MTProto({
            api_id: this.api_id,
            api_hash: this.api_hash,
            test: false,
            storageOptions: {
                path: path.resolve(__dirname, `./data/1.json`)
            }
        })
    }

    public async auth(phoneNumber: string): Promise<void> {
        prompt.start()
        try {
            await this.checkLogin()
        } catch (error) {
            this.logger.error(error)

            await this.mtProto.setDefaultDc(4)
            const { phone_code_hash } = await this.sendCode(phoneNumber)
            this.logger.log('sendCode()')

            const { code } = await prompt.get(['code'])
            await this.signIn({ code, phoneNumber, phone_code_hash })
        }
    }

    private subscribeToUpdates(): void {
        this.mtProto.updates.on('updates', (updateInfo: TelegramUpdateInfo) => {
            updateInfo.updates.forEach(async (update: any) => {
                if (this.isMessageUpdate(update)) {
                    const telegramMessage: TelegramMessage = update?.message
                    if (telegramMessage) {
                        this.onMessage(telegramMessage)
                    }
                }
            })
        })
    }

    private isMessageUpdate(update: any) {
        return [updateNewMessage, updateNewChannelMessage].includes(update._)
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


    private sendCode(mobile: string): Promise<any> {
        return this.mtProto.call('auth.sendCode', {
            phone_number: mobile,
            settings: {
                _: 'codeSettings'
            }
        })
        .catch(error => console.error(error))
    }

    private async signIn({ code, phoneNumber, phone_code_hash }) {
        try {
            return await this.mtProto.call('auth.signIn', {
                phone_code: code,
                phone_number: phoneNumber,
                phone_code_hash: phone_code_hash
            })
        } catch (error) {
            this.logger.log(error)
            if (error.error_messahe !== 'SESSION_PASSWORD_NEEDED') {
                return
            }
        }
        return undefined
    }


    private async checkLogin(): Promise<void> {
        await this.mtProto.call("users.getFullUser", {
          id: {
            _: "inputUserSelf",
          },
        });
    }


    public async getPhoto(message: TelegramMessage): Promise<Uint8Array> {
        const photo = message?.media?.photo
        if (photo) {
            try {
                const file = await this.mtProto.call('upload.getFile', {
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