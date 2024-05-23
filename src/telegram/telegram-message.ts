import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument } from "mongoose"

export type TelegramMessageDocuments = HydratedDocument<TelegramMessage>

export class Photo {
    @Prop() has_stickers: boolean
    @Prop() id: string
    @Prop() access_hash: string
    file_reference: any
    @Prop() date: number
    sizes: any
    video_sizes: any
    @Prop() dc_id: number
    @Prop() file_id: string
}

export class PeerUser {
    @Prop() _: string
    @Prop() user_id: number
    @Prop() channel_id: string
}

export class MessageMedia {
    @Prop() photo: Photo
}

export type TelegramMessageType = 'message'

@Schema()
export class TelegramMessage {

    _: TelegramMessageType

    @Prop() date: number
    @Prop() message: string
    @Prop() id: number

    @Prop() from_id: PeerUser
    @Prop() peer_id: PeerUser

    @Prop() via_bot_id: number

    @Prop() out: boolean

    @Prop() media: MessageMedia
}

export const TelegramMessageSchema = SchemaFactory.createForClass(TelegramMessage)