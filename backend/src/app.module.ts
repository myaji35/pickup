import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { InstitutionModule } from './institution/institution.module';
import { FleetModule } from './fleet/fleet.module';
import { RosterModule } from './roster/roster.module';
import { UserModule } from './user/user.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigModule을 전역으로 사용
    }),
    PrismaModule,
    InstitutionModule,
    FleetModule,
    RosterModule,
    UserModule, // Phase 11: User & Auth
    SubscriptionModule, // Phase 11: Subscription & Plan
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
