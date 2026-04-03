// ==========================================================================
// Application Entry Point — FlyOS Flight School Management System
// ==========================================================================
// This file bootstraps the NestJS application. It:
//
//   1. Creates the NestJS application instance from the root AppModule.
//   2. Enables the global ValidationPipe for DTO validation.
//   3. Starts listening on port 3000 (or the PORT environment variable).
//
// MVC Pattern Overview:
//   The entire NestJS application follows the Model-View-Controller pattern:
//
//   MODEL (Data Layer):
//     - Prisma Schema (prisma/schema.prisma) defines the database structure.
//     - PrismaService (src/prisma/) provides typed database access methods.
//     - PostgreSQL stores all persistent data.
//
//   VIEW (Presentation Layer):
//     - GraphQL Object Types (*Type classes) define what clients can see.
//     - The auto-generated GraphQL schema (src/schema.gql) is the API contract.
//     - Apollo Server serializes responses as JSON to the client.
//
//   CONTROLLER (Request Handling Layer):
//     - GraphQL Resolvers receive incoming queries and mutations.
//     - Services contain business logic (validation, conflict detection, etc.).
//     - Guards (JwtAuthGuard, RolesGuard) enforce authentication and authorization.
//
//   Data Flow for a Typical Request:
//     1. Client sends a GraphQL query/mutation with a JWT in the Authorization header.
//     2. Apollo Server parses the GraphQL operation.
//     3. JwtAuthGuard validates the token and attaches user info to the request.
//     4. RolesGuard checks the user's role against the required roles.
//     5. The Resolver (Controller) receives the validated request.
//     6. The Resolver delegates to the appropriate Service (business logic).
//     7. The Service calls PrismaService (Model) to read/write the database.
//     8. PostgreSQL executes the SQL and returns the result.
//     9. The result flows back through the Service → Resolver → Apollo Server.
//    10. Apollo Server serializes the result as JSON and sends it to the client.
// ==========================================================================

import { join } from 'path';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const publicDir = join(process.cwd(), 'public');

  // Bind static HTML before Nest's router so paths are not shadowed by other layers.
  const expressApp = express();
  const sendScheduler = (_req: express.Request, res: express.Response) => {
    res.sendFile(join(publicDir, 'scheduler.html'));
  };
  expressApp.get('/', sendScheduler);
  expressApp.get('/scheduler', sendScheduler);

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  // Static assets for the ribbon UI (scheduler.css, scheduler.js).
  app.useStaticAssets(publicDir);

  // Enable the global ValidationPipe to automatically validate all incoming
  // DTOs using the class-validator decorators (@IsEmail, @MinLength, etc.).
  // - transform: true — automatically transforms plain objects to DTO instances.
  // - whitelist: true — strips properties not defined in the DTO.
  // - forbidNonWhitelisted: true — throws an error if unknown properties are sent.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Start listening for incoming HTTP/GraphQL requests.
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
void bootstrap();
