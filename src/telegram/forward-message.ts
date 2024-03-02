import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Expose } from "class-transformer";
import { HydratedDocument } from "mongoose";

export type ForwardMessageDocument = HydratedDocument<ForwardMessage>


@Schema()
export class ForwardMessage {

    @Expose()
    @Prop({ required: true })
    timestamp: Date

    @Expose()
    @Prop()
    message: string

    @Expose()
    @Prop()
    telegramChannelId?: string

}

export const ForwardMessageSchema = SchemaFactory.createForClass(ForwardMessage)
