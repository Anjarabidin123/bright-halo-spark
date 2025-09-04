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
  private connectionHistory: Set<string> = new Set();

  async connect(): Promise<boolean> {
    // Enhanced platform detection for mobile devices
    const isNativePlatform = Capacitor.isNativePlatform() || 
                            (typeof window !== 'undefined' && 
                             (window as any).Capacitor && 
                             (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios'));
    
    const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('🔍 Platform detection:');
    console.log('  - Capacitor.isNativePlatform():', Capacitor.isNativePlatform());
    console.log('  - Capacitor.getPlatform():', Capacitor.getPlatform());
    console.log('  - User Agent:', navigator.userAgent);
    console.log('  - Is Native Platform:', isNativePlatform);
    console.log('  - Is Mobile Device:', isMobileDevice);

    // Use native Bluetooth if running in Capacitor (mobile app)
    if (isNativePlatform) {
      console.log('🤖 Using native Bluetooth (Capacitor app)');
      try {
        return await nativeThermalPrinter.connect();
      } catch (error) {
        console.error('Native Bluetooth failed, falling back to Web Bluetooth:', error);
        console.log('🌐 Fallback to Web Bluetooth');
        return await this.connectWebBluetooth();
      }
    }

    // For mobile devices in browser, prefer Web Bluetooth with mobile optimizations
    if (isMobileDevice) {
      console.log('📱 Mobile browser detected - using Web Bluetooth with mobile optimizations');
      return await this.connectWebBluetoothMobile();
    }

    // Fallback to Web Bluetooth for desktop browser
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

      return await this.performWebBluetoothConnection();
    } catch (error: any) {
      return this.handleBluetoothError(error);
    }
  }

  private async connectWebBluetoothMobile(): Promise<boolean> {
    try {
      console.log('📱 Checking Mobile Web Bluetooth availability...');
      
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth tidak didukung di browser ini. Gunakan Chrome atau Edge mobile terbaru.');
      }

      // Enhanced mobile detection
      const isAndroidChrome = /Android.*Chrome/.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isHTTPS = location.protocol === 'https:';
      
      console.log('📱 Mobile platform details:');
      console.log('  - Android Chrome:', isAndroidChrome);
      console.log('  - iOS:', isIOS);
      console.log('  - HTTPS:', isHTTPS);
      
      if (isIOS) {
        console.warn('⚠️ iOS detected - Web Bluetooth support may be limited. Gunakan aplikasi mobile untuk hasil terbaik.');
      }
      
      if (!isHTTPS && location.hostname !== 'localhost') {
        throw new Error('Bluetooth memerlukan HTTPS atau localhost untuk bekerja');
      }

      return await this.performWebBluetoothConnection(true);
    } catch (error: any) {
      return this.handleBluetoothError(error);
    }
  }

  private async performWebBluetoothConnection(isMobile: boolean = false): Promise<boolean> {

    // Enhanced request options for better mobile compatibility
    const commonServices = [
      '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer service
      '49535343-fe7d-4ae5-8fa9-9fafd205e455', // HID over GATT
      '0000ff00-0000-1000-8000-00805f9b34fb', // Custom service
      '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
      '0000180f-0000-1000-8000-00805f9b34fb', // Battery service
      '0000180a-0000-1000-8000-00805f9b34fb', // Device info
      '00001800-0000-1000-8000-00805f9b34fb', // Generic access
      '00001801-0000-1000-8000-00805f9b34fb'  // Generic attribute
    ];

    let requestOptions: any;
    
    if (isMobile) {
      // Mobile-optimized scanning - try specific filters first
      console.log('📱 Using mobile-optimized device scanning...');
      try {
        requestOptions = {
          filters: [
            { namePrefix: 'MTP' },
            { namePrefix: 'RPP' },
            { namePrefix: 'Thermal' },
            { namePrefix: 'Printer' },
            { namePrefix: 'POS' },
            { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
            { services: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'] }
          ],
          optionalServices: commonServices
        };
        
        console.log('🔍 Scanning for thermal printers with filters...');
        this.webDevice = await navigator.bluetooth.requestDevice(requestOptions) as any;
      } catch (filterError) {
        console.log('📱 Filter scan failed, falling back to acceptAllDevices...');
        requestOptions = {
          acceptAllDevices: true,
          optionalServices: commonServices
        };
        this.webDevice = await navigator.bluetooth.requestDevice(requestOptions) as any;
      }
    } else {
      // Desktop scanning - accept all devices
      requestOptions = {
        acceptAllDevices: true,
        optionalServices: commonServices
      };
      
      console.log('🔍 Scanning for ALL Bluetooth devices...');
      this.webDevice = await navigator.bluetooth.requestDevice(requestOptions) as any;
    }

    if (!this.webDevice.gatt) {
      throw new Error('GATT not available');
    }

    console.log(`Connecting to device: ${this.webDevice.name || 'Unknown'} (${this.webDevice.id})`);
    
    // Add device to connection history for multi-device support
    if (this.webDevice.id) {
      this.connectionHistory.add(this.webDevice.id);
    }
    
    // Enhanced connection with mobile-specific timeouts
    const connectionTimeout = isMobile ? 20000 : 15000; // Longer timeout for mobile
    const connectionPromise = this.webDevice.gatt.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), connectionTimeout)
    );
    
    const server = await Promise.race([connectionPromise, timeoutPromise]);
    console.log('✅ Connected to Bluetooth printer');

    // Give mobile devices more time to stabilize connection
    if (isMobile) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

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
  }

  private handleBluetoothError(error: any): boolean {
    console.error('Failed to connect to web printer:', error);
    
    // Don't show error toast for user cancellation - this is normal behavior
    if (error.message?.includes('User cancelled') || 
        error.name === 'NotFoundError' ||
        error.message?.includes('cancel')) {
      console.log('User cancelled device selection - this is normal');
      return false;
    } else if (error.message?.includes('Bluetooth adapter not available')) {
      console.error('Bluetooth tidak aktif di perangkat');
    } else if (error.message?.includes('Connection timeout')) {
      console.error('Koneksi timeout - coba lagi atau periksa jarak ke printer');
    }
    
    return false;
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

  getConnectionHistory(): string[] {
    return Array.from(this.connectionHistory);
  }

  clearConnectionHistory(): void {
    this.connectionHistory.clear();
  }
}

export const hybridThermalPrinter = new HybridThermalPrinter();