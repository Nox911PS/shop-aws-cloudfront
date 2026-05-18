export async function basicAuthorizer(event: any) {
  console.log('Authorization header:', event.authorizationToken);
  console.log('Method ARN:', event.methodArn);

  // Get authorization header
  const authToken = event.authorizationToken;

  if (!authToken) {
    throw new Error('Unauthorized');
  }

  const encodedCreds = authToken.split(' ')[1];
  if (!encodedCreds) {
    throw new Error('Unauthorized');
  }

  const creds = Buffer.from(encodedCreds, 'base64').toString('utf-8').split(':');
  const username = creds[0];
  const password = creds[1];

  // Get credentials from environment variables
  // Format: {username}={password}
  const validCredentials: { [key: string]: string } = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (
      key !== 'PATH' &&
      key !== 'NODE_ENV' &&
      key !== 'LAMBDA_TASK_ROOT' &&
      key !== 'LAMBDA_RUNTIME_DIR' &&
      !key.startsWith('AWS_') &&
      !key.startsWith('_X_AMZN_') &&
      typeof value === 'string' &&
      value.includes('=') === false
    ) {
      // This is a credentials variable
      validCredentials[key.toLowerCase()] = value;
    }
  }

  console.log('Valid credentials keys:', Object.keys(validCredentials));
  console.log('Attempting login with username:', username);

  // Check if user and password match
  if (validCredentials[username.toLowerCase()] !== password) {
    console.log('Credentials mismatch. Expected password for user:', username);
    throw new Error('Unauthorized');
  }

  // Generate IAM policy
  const policy = generatePolicy('user', 'Allow', event.methodArn);
  return policy;
}

function generatePolicy(principalId: string, effect: string, resource: string) {
  const authResponse: any = {
    principalId: principalId,
  };

  if (effect && resource) {
    const policyDocument: any = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    };
    authResponse.policyDocument = policyDocument;
  }

  authResponse.context = {
    stringKey: 'value',
    numberKey: 123,
    booleanKey: true,
  };

  return authResponse;
}

