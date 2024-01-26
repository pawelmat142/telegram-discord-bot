import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Expose } from "class-transformer";

export type NewsDocuments = HydratedDocument<News>


@Schema()
export class News {

    @Expose() 
    @Prop({ required: true, unique: true })
    name: string

    @Expose() 
    @Prop({ required: true })
    ids: string[]

    @Expose() 
    @Prop({ required: true })
    baseUrl: string

    @Expose() 
    @Prop({ required: true })
    regex: string

    @Expose() 
    @Prop({ required: true })
    discordChannelId: string

    @Expose() 
    @Prop({ required: true })
    modified: Date

}

export const NewsSchema = SchemaFactory.createForClass(News)
