import { TelegramMessage } from "./telegram-message";


export const updateNewMessage = 'updateNewMessage'
export const updateNewChannelMessage = 'updateNewChannelMessage'
export const updateReadHistoryOutbox = 'updateReadHistoryOutbox'


export interface UpdateNewMessage {
    _: 'updateNewMessage';
    message: TelegramMessage; 
    pts: number;
    pts_count: number;
}

export interface UpdateReadHistoryOutbox {
    _: 'UpdateReadHistoryOutboxType';
    peer: any; 
    max_id: number;
    pts: number;
    pts_count: number;
}

export type TelegramUpdate = UpdateNewMessage | UpdateReadHistoryOutbox;


export interface TelegramUpdateInfo {
    _: string
    updates: TelegramUpdate[]
}