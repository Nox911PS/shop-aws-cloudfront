export function parseAuthorizationCredentials(
  env: NodeJS.ProcessEnv,
): { [key: string]: string } {
  const authorizationCredentials: { [key: string]: string } = {};

  for (const [key, value] of Object.entries(env)) {
    if (
      key.startsWith('AUTHORIZATION_USERNAME_') &&
      typeof value === 'string' &&
      value.length > 0
    ) {
      const username = key.replace('AUTHORIZATION_USERNAME_', '').toLowerCase();
      authorizationCredentials[username] = value;
    }
  }

  return authorizationCredentials;
}

