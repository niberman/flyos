// ==========================================================================
// AuthResponse — GraphQL Object Type for Authentication Responses
// ==========================================================================
// This type defines the shape of the data returned by the login and register
// mutations. In the MVC pattern, this is part of the **View** layer — it
// determines what the client sees in the GraphQL response.
// ==========================================================================

import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType({
  description: 'Response returned after successful authentication.',
})
export class AuthResponse {
  @Field(() => String, {
    description: 'Signed JWT token for authenticating subsequent requests.',
  })
  access_token: string;
}
