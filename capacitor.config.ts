import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bc79829a70164168911a446c693a79f5',
  appName: 'kak-ros-hello-world',
  webDir: 'dist',
  server: {
    url: 'https://bc79829a-7016-4168-911a-446c693a79f5.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;