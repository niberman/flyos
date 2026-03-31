// ==========================================================================
// AppModule — Root Application Module
// ==========================================================================
// This is the root module of the FlyOS NestJS application. It orchestrates
// all feature modules and configures cross-cutting infrastructure:
//
//   1. ConfigModule:   Loads environment variables (.env) globally.
//   2. GraphQLModule:  Configures Apollo Server with the code-first approach.
//   3. ScheduleModule: Enables @Cron() decorators for background jobs.
//   4. PrismaModule:   Provides global database access via PrismaService.
//   5. AuthModule:     JWT-based authentication and role-based access control.
//   6. Feature Modules: Users, Aircraft, Booking, Ingestion, Maintenance.
//
// MVC Pattern Mapping:
//   - Model:      Prisma schema + PrismaService (data access layer)
//   - View:       GraphQL schema (auto-generated from TypeScript decorators)
//   - Controller: GraphQL Resolvers (handle incoming requests, delegate to services)
//
// Data Flow:
//   Client Request → Apollo Server → GraphQL Resolver (Controller) →
//   Service (Business Logic) → PrismaService (Model) → PostgreSQL →
//   Response flows back through the same layers as GraphQL JSON.
// ==========================================================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AircraftModule } from './aircraft/aircraft.module';
import { BookingModule } from './booking/booking.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    // --- Infrastructure Modules ---

    // ConfigModule loads .env variables and makes them injectable via
    // ConfigService throughout the application. isGlobal: true means
    // every module can access configuration without importing ConfigModule.
    ConfigModule.forRoot({ isGlobal: true }),

    // GraphQLModule configures Apollo Server using the "code-first" approach.
    // Instead of writing .graphql schema files manually, the schema is
    // auto-generated from TypeScript classes decorated with @ObjectType(),
    // @Field(), @Resolver(), @Query(), and @Mutation() decorators.
    // The generated schema is written to src/schema.gql for reference.
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
    }),

    // ScheduleModule enables declarative cron jobs using the @Cron() decorator.
    // The predictive maintenance engine uses this to run every 5 minutes.
    ScheduleModule.forRoot(),

    // PrismaModule is global — provides PrismaService to all modules.
    PrismaModule,

    // --- Feature Modules ---
    AuthModule,
    UsersModule,
    AircraftModule,
    BookingModule,
    IngestionModule,
    MaintenanceModule,
  ],
})
export class AppModule {}
