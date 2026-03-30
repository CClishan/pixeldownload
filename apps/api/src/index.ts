import 'dotenv/config';
import { config } from './config.js';
import { createApp } from './app.js';

const app = createApp();

const start = async () => {
  try {
    await app.listen({
      host: config.host,
      port: config.port
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
