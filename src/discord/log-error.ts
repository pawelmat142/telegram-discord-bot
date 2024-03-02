import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Expose } from "class-transformer";
import { HydratedDocument } from "mongoose";

export type LogErrorDocument = HydratedDocument<LogError>


@Schema()
export class LogError {

    @Expose() 
    @Prop({ required: true })
    error: string

    @Expose()
    @Prop({ required: true })
    timestamp: Date

    @Expose()
    @Prop()
    reason: string

    @Expose()
    @Prop()
    telegramChannelId?: string

    @Expose()
    @Prop()
    discordChannelId?: string

    @Expose()
    @Prop()
    logs?: string[]

}

export const LogErrorSchema = SchemaFactory.createForClass(LogError)
