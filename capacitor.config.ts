import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.infracridet.app',
  appName: 'InfraCredit',
  webDir: 'out',
  server: {
    url: 'https://infracredit-seven.vercel.app/',
    cleartext: true
  }
};

export default config;
