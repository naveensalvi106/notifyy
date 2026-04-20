import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.notify.app',
  appName: 'Notify',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'notifyapp' // Example scheme
  }
};


export default config;
