import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { InstitutionModule } from './institution/institution.module';
import { FleetModule } from './fleet/fleet.module';
import { RosterModule } from './roster/roster.module';

@Module({
  imports: [
    PrismaModule,
    InstitutionModule,
    FleetModule,
    RosterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
