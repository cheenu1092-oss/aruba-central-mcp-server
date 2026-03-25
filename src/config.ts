// Aruba Central OAuth configuration and token management

export interface Config {
  clientId: string;
  clientSecret: string;
  customerId: string;
  username: string;
  password: string;
  baseUrl: string;
  verifySsl: boolean;
  enableWrite: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

export function loadConfig(): Config {
  const requiredVars = [
    "ARUBA_CLIENT_ID",
    "ARUBA_CLIENT_SECRET",
    "ARUBA_CUSTOMER_ID",
    "ARUBA_USERNAME",
    "ARUBA_PASSWORD",
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  const config: Config = {
    clientId: process.env.ARUBA_CLIENT_ID!,
    clientSecret: process.env.ARUBA_CLIENT_SECRET!,
    customerId: process.env.ARUBA_CUSTOMER_ID!,
    username: process.env.ARUBA_USERNAME!,
    password: process.env.ARUBA_PASSWORD!,
    baseUrl:
      process.env.ARUBA_BASE_URL ||
      "https://apigw-prod2.central.arubanetworks.com",
    verifySsl: process.env.ARUBA_VERIFY_SSL !== "false",
    enableWrite: process.env.ARUBA_ENABLE_WRITE === "true",
  };

  // Check for --enable-write flag
  if (process.argv.includes("--enable-write")) {
    config.enableWrite = true;
  }

  return config;
}
