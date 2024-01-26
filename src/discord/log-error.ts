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

}

export const LogErrorSchema = SchemaFactory.createForClass(LogError)
