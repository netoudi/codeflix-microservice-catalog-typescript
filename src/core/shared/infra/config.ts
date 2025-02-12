import { join } from 'node:path';
import { config as readEnv } from 'dotenv';

export class Config {
  static env: any = null;

  static db() {
    Config.readEnv();
    return {
      dialect: Config.env.DB_CONNECTION,
      host: Config.env.DB_HOST,
      logging: Config.env.DB_LOGGING === 'true',
    };
  }

  static bucketName() {
    Config.readEnv();
    return Config.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME;
  }

  static googleCredentials() {
    Config.readEnv();
    return JSON.parse(Config.env.GOOGLE_CLOUD_CREDENTIALS);
  }

  static rabbitmqUri() {
    Config.readEnv();
    return Config.env.RABBITMQ_URI;
  }

  static readEnv() {
    if (Config.env) return;
    Config.env = readEnv({ path: join(__dirname, `../../../../envs/.env.${process.env.NODE_ENV}`) }).parsed;
  }
}
