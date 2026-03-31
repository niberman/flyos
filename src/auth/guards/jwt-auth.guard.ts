// ==========================================================================
// JwtAuthGuard — Authentication Guard
// ==========================================================================
// This guard integrates Passport's JWT strategy with NestJS's guard system.
// When applied to a resolver or controller, it:
//
//   1. Intercepts the incoming request before it reaches the handler.
//   2. Invokes the JwtStrategy to extract and verify the Bearer token.
//   3. If valid, allows the request to proceed with request.user populated.
//   4. If invalid or missing, returns a 401 Unauthorized response.
//
// For GraphQL, the guard needs to extract the request from the GraphQL
// execution context, which differs from a standard HTTP request context.
//
// Usage:
//   @UseGuards(JwtAuthGuard)
//   @Query(() => User)
//   async me(@CurrentUser() user) { ... }
// ==========================================================================

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Override getRequest to handle the GraphQL execution context.
   * In a standard REST controller, the request is directly available.
   * In GraphQL, it must be extracted from the GqlExecutionContext.
   */
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
