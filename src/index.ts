import { createApp } from './app.js';
import { loadConfig } from './lib/config.js';

const config = loadConfig();
const app = createApp();

app.listen(config.port, () => {
  console.log(`task service ฟังอยู่ที่พอร์ต ${config.port} (${config.environment})`);
});
