import { Controller, Get } from '@nestjs/common';
import { SignalService } from './signal.service';

@Controller('signal')
export class SignalController {

    constructor(
        private readonly signalService: SignalService
    ) {}

    @Get('/test')
    test() {
        return this.signalService.test()
    }

}
