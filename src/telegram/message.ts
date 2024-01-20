export interface Message {

    date: number
    message: string
    id: number

    from_id: PeerUser
    peer_id: PeerUser

    via_bot_id: number

    out: boolean

    messageMedia: MessageMedia
}

export interface PeerId {
    channel_id: string
}

export interface PeerUser {
    user_id: number
    channel_id: string
}

export interface MessageMedia {
    photo: Photo
}

export interface Photo {
    has_stickers: boolean
    id: number
    access_hash: number
    file_reference: number
    date: number
    sizes: any
    video_sizes: any
    dc_id: number
}