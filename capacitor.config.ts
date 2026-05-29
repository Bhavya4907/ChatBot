import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.Paneer.Kikar',
  appName: 'Kikar',
  webDir: 'out',
  server: {
    url: 'https://chat-bot-k6kp.vercel.app/', // ← paste your Vercel URL here
    cleartext: true
  }
};

export default config;