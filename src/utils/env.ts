export const getEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const getEnvVarAsJson = <T>(name: string): T => {
  const value = getEnvVar(name);
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new Error(`Environment variable ${name} could not be parsed as JSON: ${value}`);
  }
};

export const env = {
  COGNITO_USER_POOL_ID: getEnvVar('REACT_APP_COGNITO_USER_POOL_ID'),
  COGNITO_CLIENT_ID: getEnvVar('REACT_APP_COGNITO_CLIENT_ID'),
  COGNITO_DOMAIN: getEnvVar('REACT_APP_COGNITO_DOMAIN'),
  COGNITO_REDIRECT_SIGNIN: getEnvVarAsJson<string[]>('REACT_APP_COGNITO_REDIRECT_SIGNIN'),
  COGNITO_REDIRECT_SIGNOUT: getEnvVarAsJson<string[]>('REACT_APP_COGNITO_REDIRECT_SIGNOUT'),
  API_URL: getEnvVar('REACT_APP_PMS_BE_DOMAIN'),
};
