import { Injectable, Logger } from "@nestjs/common";
import { Model } from "mongoose";
import { ForwardMessage } from "./forward-message";
import { InjectModel } from "@nestjs/mongoose";
import { TelegramMessage } from "./message";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class DuplicateService {

    private readonly logger = new Logger(DuplicateService.name)

    constructor(
        @InjectModel(ForwardMessage.name) private forwardMessageModel: Model<ForwardMessage>,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    private async cleanForwardMessages() {
        const latest50Documents = await this.forwardMessageModel
            .find({}, { _id: true })
            .sort({ _id: -1 })
            .limit(50)
            .exec()

        const latest50Ids = latest50Documents.map(d => d._id)
        const res = await this.forwardMessageModel.deleteMany({ _id: { $nin: latest50Ids } }).exec()
        this.logger.log(`Cleaned up ${res?.deletedCount} messages `)
    }


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