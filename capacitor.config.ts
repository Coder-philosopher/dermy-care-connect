import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dermon.nitrr.in',
  appName: 'dermon',
  webDir: 'dist',
   plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
    },
  },
};

export default config;


