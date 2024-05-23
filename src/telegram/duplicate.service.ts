import { Injectable } from "@nestjs/common";
import { TelegramMessage } from "./telegram-message";

@Injectable()
export class DuplicateService {

    constructor(
    ) {}
    
    private telegramMessageIdsAggregator: number[] = []


    public telegramMessageIdDuplicated(message: TelegramMessage): boolean {
        const messaggeId = message.id

        const isDuplicated = this.telegramMessageIdsAggregator.includes(messaggeId)
        if (isDuplicated) {
            return true
        } else {
            this.telegramMessageIdsAggregator.pop()
            this.telegramMessageIdsAggregator.push(messaggeId)
            return false
        }
    }

}