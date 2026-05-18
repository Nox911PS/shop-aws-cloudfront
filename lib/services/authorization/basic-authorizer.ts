import type { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import { StatementEffect } from 'aws-lambda/trigger/api-gateway-authorizer';

export async function basicAuthorizer(
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> {
  console.log('Authorization header:', event.authorizationToken);
  console.log('Method ARN:', event.methodArn);

  const authToken = event.authorizationToken;

  if (!authToken) {
    throw new Error('Unauthorized');
  }

  const encodedCredentials = authToken.split(' ')[1];
  if (!encodedCredentials) {
    throw new Error('Unauthorized');
  }

  const credentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8').split(':');
  const username = credentials[0];
  const password = credentials[1];

  if (!username || !password) {
    throw new Error('Unauthorized');
  }

  const validCredentials: { [key: string]: string } = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string') {
      validCredentials[key.toLowerCase()] = value;
    }
  }

  console.log('Valid credentials keys:', Object.keys(validCredentials));
  console.log('Attempting login with username:', username);

  if (validCredentials[username.toLowerCase()] !== password) {
    console.log('Credentials mismatch. Expected password for user:', username);
    return generatePolicy('user', 'Deny', event.methodArn);
  }

  return generatePolicy(username, 'Allow', event.methodArn);
}

const generatePolicy = (
  principalId: string,
  effect: StatementEffect,
  resource: string,
): APIGatewayAuthorizerResult => ({
  principalId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
      },
    ],
  },
});
