import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { ForwardMessage } from "./forward-message";
import { InjectModel } from "@nestjs/mongoose";
import { TelegramMessage } from "./message";

@Injectable()
export class DuplicateService {

    constructor(
        @InjectModel(ForwardMessage.name) private forwardMessageModel: Model<ForwardMessage>,
    ) {}

    public async saveMessage(message: TelegramMessage) {
        const updateChannelId = message.peer_id?.channel_id
        const msg = new this.forwardMessageModel({
            timestamp: new Date(),
            message: message?.message,
            telegramChannelId: updateChannelId
        })
        return msg.save()
    }

    public async messageIsDuplicate(message: TelegramMessage): Promise<boolean> {
        const msg = message?.message
        // const startsWith = msg.slice(0, 2)
        const endsWith = msg.slice(-20)
        const regex = RegExp(endsWith.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$");
        const element = await this.forwardMessageModel.findOne({ message : regex }).exec()
        return !!element
    }

}