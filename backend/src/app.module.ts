import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import { RedisModule } from './modules/redis/redis.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { PlayersModule } from './modules/players/players.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { GameplayModule } from './modules/gameplay/gameplay.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        database: config.get<string>('database.name'),
        username: config.get<string>('database.user'),
        password: config.get<string>('database.password'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // auto-creates tables; replace with migrations post-MVP
        logging: config.get<string>('app.env') === 'development',
      }),
    }),
    RedisModule,
    SessionsModule,
    PlayersModule,
    QuestionsModule,
    RealtimeModule,
    GameplayModule,
  ],
})
export class AppModule {}
