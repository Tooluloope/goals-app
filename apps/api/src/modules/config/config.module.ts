import { Module } from '@nestjs/common';

import { WorkspacesModule } from '../workspaces/workspaces.module';

import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';

@Module({
  imports: [WorkspacesModule],
  providers: [ConfigService],
  controllers: [ConfigController],
  exports: [ConfigService],
})
export class ConfigModule {}
