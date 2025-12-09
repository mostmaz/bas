import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bascavarat.app',
  appName: 'bascavarat',
  webDir: 'out',
  server: {
    url: 'https://urchin-app-osd67.ondigitalocean.app/',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
