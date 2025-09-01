import { Capacitor } from '@capacitor/core';
import { nativeThermalPrinter } from './native-thermal-printer';

// Simple Web Bluetooth types to avoid conflicts
interface WebBluetoothDevice {
  gatt?: {
    connected: boolean;
    connect(): Promise<any>;
    disconnect(): Promise<void>;
  };
  name?: string;
  id: string;
}

export class HybridThermalPrinter {
  private webDevice: WebBluetoothDevice | null = null;
  private webCharacteristic: any = null;

  async connect(): Promise<boolean> {
    // Use native Bluetooth if running in Capacitor (mobile app)
    if (Capacitor.isNativePlatform()) {
      console.log('🤖 Using native Bluetooth (Capacitor app)');
      return await nativeThermalPrinter.connect();
    }

    // Fallback to Web Bluetooth for browser
    console.log('🌐 Using Web Bluetooth (browser)');
    return await this.connectWebBluetooth();
  }

  private async connectWebBluetooth(): Promise<boolean> {
    try {
      console.log('🔍 Checking Web Bluetooth availability...');
      
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth tidak didukung. Install aplikasi mobile atau aktifkan "Experimental Web Platform features" di chrome://flags');
      }

      const isAndroidChrome = /Android.*Chrome/.test(navigator.userAgent);
      const isHTTPS = location.protocol === 'https:';
      
      console.log('📱 User Agent:', navigator.userAgent);
      console.log('🔒 HTTPS:', isHTTPS);
      console.log('🤖 Android Chrome:', isAndroidChrome);
      
      if (!isHTTPS && location.hostname !== 'localhost') {
        throw new Error('Bluetooth memerlukan HTTPS atau localhost untuk bekerja');
      }
      
      if (isAndroidChrome) {
        console.log('✅ Android Chrome detected - using optimized settings');
      } else {
        console.warn('⚠️ Non-Android Chrome browser detected - Bluetooth support may be limited. Gunakan aplikasi mobile untuk hasil terbaik.');
      }

      const requestOptions = {
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          '0000ff00-0000-1000-8000-00805f9b34fb',
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
          '0000180f-0000-1000-8000-00805f9b34fb',
          '0000180a-0000-1000-8000-00805f9b34fb',
          '00001800-0000-1000-8000-00805f9b34fb',
          '00001801-0000-1000-8000-00805f9b34fb'
        ]
      };

      console.log('🔍 Scanning for ALL Bluetooth devices...');
      this.webDevice = await navigator.bluetooth.requestDevice(requestOptions) as any;

      if (!this.webDevice.gatt) {
        throw new Error('GATT not available');
      }

      console.log(`Connecting to device: ${this.webDevice.name || 'Unknown'}`);
      
      const connectionPromise = this.webDevice.gatt.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 15000)
      );
      
      const server = await Promise.race([connectionPromise, timeoutPromise]);
      console.log('Connected to Bluetooth printer');

      const services = await server.getPrimaryServices();
      console.log(`Found ${services.length} services:`, services.map((s: any) => s.uuid));

      for (const service of services) {
        try {
          console.log(`Checking service: ${service.uuid}`);
          const characteristics = await service.getCharacteristics();
          
          for (const char of characteristics) {
            console.log(`Characteristic: ${char.uuid}, Properties:`, {
              write: char.properties.write,
              writeWithoutResponse: char.properties.writeWithoutResponse
            });
            
            if (char.properties.write || char.properties.writeWithoutResponse) {
              this.webCharacteristic = char;
              console.log(`✓ Using characteristic: ${char.uuid}`);
              return true;
            }
          }
        } catch (e) {
          console.warn(`Error checking service ${service.uuid}:`, e);
        }
      }

      throw new Error('Tidak ditemukan characteristic yang bisa ditulis');
    } catch (error: any) {
      console.error('Failed to connect to web printer:', error);
      
      if (error.message?.includes('User cancelled')) {
        console.error('User cancelled device selection');
      } else if (error.message?.includes('Bluetooth adapter not available')) {
        console.error('Bluetooth tidak aktif di perangkat');
      }
      
      return false;
    }
  }

  async print(text: string): Promise<boolean> {
    // Use native printing if available
    if (Capacitor.isNativePlatform()) {
      return await nativeThermalPrinter.print(text);
    }

    // Fallback to web Bluetooth printing
    if (!this.webCharacteristic) {
      const connected = await this.connectWebBluetooth();
      if (!connected) return false;
    }

    try {
      const ESC = '\x1B';
      const GS = '\x1D';
      
      let commands = ESC + '@'; // Initialize
      commands += ESC + 'a' + '\x01'; // Center align
      commands += text;
      commands += '\n\n\n';
      commands += GS + 'V' + '\x42' + '\x00'; // Partial cut
      
      const encoder = new TextEncoder();
      const data = encoder.encode(commands);
      
      if (this.webCharacteristic) {
        const chunkSize = 20;
        const chunks: Uint8Array[] = [];
        
        for (let i = 0; i < data.length; i += chunkSize) {
          chunks.push(data.slice(i, i + chunkSize));
        }
        
        console.log(`Sending ${data.length} bytes in ${chunks.length} chunks`);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          try {
            await this.webCharacteristic.writeValue(chunk);
            
            const delay = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 100 : 50;
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } catch (chunkError) {
            console.error(`Error sending chunk ${i + 1}/${chunks.length}:`, chunkError);
            throw chunkError;
          }
        }
        
        console.log(`✓ Print command sent successfully in ${chunks.length} chunks`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to print:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await nativeThermalPrinter.disconnect();
    } else if (this.webDevice && this.webDevice.gatt?.connected) {
      await this.webDevice.gatt.disconnect();
      console.log('Disconnected from web printer');
    }
    
    this.webDevice = null;
    this.webCharacteristic = null;
  }

  isConnected(): boolean {
    if (Capacitor.isNativePlatform()) {
      return nativeThermalPrinter.isConnected();
    }
    return this.webDevice?.gatt?.connected || false;
  }

  getPlatformInfo(): string {
    if (Capacitor.isNativePlatform()) {
      return `Native App (${Capacitor.getPlatform()})`;
    }
    return 'Web Browser';
  }
}

export const hybridThermalPrinter = new HybridThermalPrinter();