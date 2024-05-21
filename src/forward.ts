import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createMyLogger } from './global/logger';

async function bootstrap() {

  const app = await NestFactory.create(AppModule, {
    logger: createMyLogger()
  })

  const port = process.env.PORT ?? 3000
  await app.listen(port);
}
bootstrap();
