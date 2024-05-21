import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { TelegramMessage } from 'src/telegram/telegram-message';

@Injectable()
export class SignalService {

    private readonly logger = new Logger(SignalService.name)

    private readonly signalMessageForwardUrl = process.env.SIGNAL_MESSAGE_FORWARD_URL

    private readonly signalTelegramChannelId = process.env.SIGNAL_TELEGRAM_CHANNEL_ID

    constructor(
        private readonly http: HttpService
    ) {}

    async processIfSignal(message: TelegramMessage) {
        if (this.isSignalTelegramMessage(message)) {
            if (this.signalMessageForwardUrl) {
                try {
                    await lastValueFrom(this.http.post(process.env.SIGNAL_MESSAGE_FORWARD_URL, message))
                    this.logger.log('Posted signal message to binance bot! ')
                } catch (error) {
                    const errorMessage = error?.response?.data?.message ?? error
                    this.logger.error(errorMessage)
                }
            }
        }
        return null
    }

    private isSignalTelegramMessage(message: TelegramMessage): boolean {
        const updateChannelId = message.peer_id?.channel_id
        return updateChannelId === this.signalTelegramChannelId
    }

}
