import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { TelegramMessage } from "./telegram-message";
import { Model } from "mongoose";

@Injectable()
export class TelegramMessageRepo {

    constructor(
        @InjectModel(TelegramMessage.name) private telegramMessageModel: Model<TelegramMessage>,
    ) {}

    public save(telegramMessage: TelegramMessage) {
        const msg = new this.telegramMessageModel(telegramMessage)
        return msg.save()
    }

}