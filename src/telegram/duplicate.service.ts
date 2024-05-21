import { Injectable, Logger } from "@nestjs/common";
import { TelegramMessage } from "./telegram-message";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class DuplicateService {

    private readonly logger = new Logger(DuplicateService.name)

    constructor(
    ) {}
    
    private aggregator: string[] = []

    @Cron(CronExpression.EVERY_MINUTE)
    private cleanAgreagotr() {
        this.aggregator = []
    }


    public async saveMessage(message: TelegramMessage) {
        this.aggregator.push(message.message)
    }

    public async messageIsDuplicate(message: TelegramMessage): Promise<boolean> {
        const msg = message?.message
        return this.aggregator.includes(msg)
    }

}