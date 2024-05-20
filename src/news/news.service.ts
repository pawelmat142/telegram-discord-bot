import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { News } from './news';
import { InjectModel } from '@nestjs/mongoose';
import { lastValueFrom, map } from 'rxjs';
import { DiscordService } from 'src/discord/discord.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class NewsService implements OnModuleInit{

    private readonly logger = new Logger(NewsService.name)

    constructor(
        @InjectModel(News.name) private newsModel: Model<News>,
        private readonly httpService: HttpService,
        private readonly discordService: DiscordService,
    ) {}

    async onModuleInit() {
        this.discordService.initNews$.subscribe({
            next: res => { if (res) this.initNews() }
        })
    }

    async initNews() {
        const newsDatas = await this.newsModel.find()
        for (let data of newsDatas) {
            await this.resetPreviousIds(data.name)
        }
        this.logger.log(`News initialized!`)
    }

    @Cron('0 * * * *')
    async handleCron() {
        this.logger.debug(`Strikes! ${new Date().toDateString()}`);
        const newsDatas = await this.newsModel.find()
        for (let data of newsDatas) {
            this.logger.log(`[START] strike news for ${data.name}`)
            await this.strike(data)
            this.logger.log(`[STOP] strike news for ${data.name}`)
        }
    }

    async strikeByName(name: string) {
        const newsData = await this.newsModel.findOne({ name: name })
        await this.strike(newsData)
    }

    async strike(newsData: News) {
        const url = newsData.baseUrl
        const previousIds = newsData.ids
        const currentIds = Array.from(await this.getNewsIds(newsData))
        const newIds = currentIds.filter(id => !previousIds.includes(id))
        this.logger.log(`Found new ids: ${newIds.length} for ${newsData.name}`)
        for (let i = 0; i < newIds.length; i++) {
            const message = url + newIds[i]
            this.logger.log(`forwarding ${newsData.name} news message ${newIds[i]}`)
            this.discordService.sendMessageToChannel(message, newsData.discordChannelId)
        }
        if (newIds.length) {
            await this.updatePreviousIds(newsData, currentIds)
        }
    }

    private async updatePreviousIds(newsData: News, currentIds: string[]) {
        newsData.ids = currentIds
        await this.newsModel.updateOne({ name: newsData.name}, newsData)
    }


    private async getNewsIds(newsData: News): Promise<Set<string>> {
        const websiteAsString = await lastValueFrom(this.httpService.get(newsData.baseUrl).pipe(map(r=>r.data)))
        let match
        let regexString = newsData.regex
        const regex = new RegExp(regexString.slice(1, regexString.lastIndexOf("/")), regexString.slice(regexString.lastIndexOf("/") + 1));
        const newIds = new Set<string>()
        while ((match = regex.exec(websiteAsString)) !== null) {
          newIds.add(match[1])
        }
        this.logger.log(`Found ${newIds.size} ids in website ${newsData.baseUrl}`)
        return newIds
    }

    
    public async resetPreviousIds(name: string) {
        const newsData = await this.newsModel.findOne({ name: name }).exec()
        await this.newsModel.deleteOne({ name: name }).exec()
        const ids = await this.getNewsIds(newsData)
        const result = await new this.newsModel({
            name: newsData.name,
            baseUrl: newsData.baseUrl,
            regex: newsData.regex,
            discordChannelId: newsData.discordChannelId,
            ids: Array.from(ids),
            modified: new Date(),
        }).save()
        this.logger.log(`Initialized ${ids.size} ids for news data ${name}`)
        return result
    }

    async initialize(data: any) {
        await this.newsModel.deleteOne({ name: data?.name }).exec()
        const a = await new this.newsModel({
            name: data?.name,
            baseUrl: data?.baseUrl,
            regex: data?.regex,
            discordChannelId: data?.discordChannelId,
            ids: [],
            modified: new Date(),
        }).save()

        this.logger.log(`Initialized news data with name: ${data?.name}`)
        return a
    }

}
