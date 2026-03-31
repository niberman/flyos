// ==========================================================================
// @CurrentUser() Decorator — Extract Authenticated User from Request
// ==========================================================================
// This parameter decorator extracts the authenticated user object from
// the GraphQL execution context. After the JwtAuthGuard validates the
// token, the decoded payload is attached to req.user. This decorator
// provides a clean way to access that data in resolver method parameters.
//
// Usage:
//   @Query(() => UserType)
//   async me(@CurrentUser() user: { userId: string; role: string }) {
//     return this.usersService.findById(user.userId);
//   }
//
// Data Flow:
//   JWT Token → JwtAuthGuard → JwtStrategy.validate() → req.user →
//   @CurrentUser() extracts it → Resolver receives { userId, role }
// ==========================================================================

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    // Convert the generic execution context to a GraphQL-specific context
    // so we can access the underlying HTTP request object.
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
