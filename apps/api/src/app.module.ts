import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SpotsModule } from './spots/spots.module';
import { GeminiRunnerService } from './gemini/gemini-runner.service';
import { PythonCounterService } from './python-counter/python-counter.service';

@Module({
  imports: [PrismaModule, SpotsModule],
  controllers: [AppController],
  providers: [AppService, GeminiRunnerService, PythonCounterService],
})
export class AppModule {}
