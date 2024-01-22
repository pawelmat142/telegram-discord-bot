import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Expose } from "class-transformer";
import { HydratedDocument } from "mongoose";

export type LogDocument = HydratedDocument<Log>


@Schema()
export class Log {

    @Expose() 
    @Prop({ required: true })
    telegramChannelId: string

    @Expose() 
    @Prop({ required: true })
    discordChannelId: string

    @Expose() 
    @Prop({ required: true })
    message: string

    @Expose()
    @Prop({ required: true })
    timestamp: Date

    @Expose()
    @Prop()
    telegramChannelName: string

    @Expose()
    @Prop()
    discordChannelName: string

}

export const LogSchema = SchemaFactory.createForClass(Log)
