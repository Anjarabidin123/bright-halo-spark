import { Capacitor } from '@capacitor/core';
import { BleClient, BleDevice, numbersToDataView, textToDataView } from '@capacitor-community/bluetooth-le';

export class NativeThermalPrinter {
  private device: BleDevice | null = null;
  private serviceUuid: string = '';
  private characteristicUuid: string = '';

  async initialize(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        // Request Bluetooth permissions first
        await BleClient.initialize({ androidNeverForLocation: true });
        console.log('Native BLE initialized with permissions');
      } catch (error) {
        console.error('Failed to initialize BLE:', error);
        throw error;
      }
    }
  }

  async connect(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Native Bluetooth hanya tersedia di aplikasi mobile');
    }

    try {
      console.log('🔍 Scanning for Bluetooth printers...');
      
      await this.initialize();

      // Check if Bluetooth is enabled
      const isEnabled = await BleClient.isEnabled();
      if (!isEnabled) {
        throw new Error('Bluetooth tidak aktif. Mohon aktifkan Bluetooth terlebih dahulu.');
      }

      // Start scanning with timeout
      const scanPromise = new Promise<BleDevice[]>((resolve, reject) => {
        const foundDevices: BleDevice[] = [];
        
        const scanTimeout = setTimeout(async () => {
          try {
            await BleClient.stopLEScan();
            if (foundDevices.length === 0) {
              reject(new Error('Tidak ditemukan printer thermal dalam jangkauan'));
            } else {
              resolve(foundDevices);
            }
          } catch (e) {
            reject(e);
          }
        }, 10000);

        BleClient.requestLEScan({
          // Scan for all devices first, then filter
          allowDuplicates: false
        }, (result) => {
          console.log('Found device:', result.device.name || result.device.deviceId);
          
          // Add devices with name containing thermal/printer keywords or known service UUIDs
          const deviceName = (result.device.name || '').toLowerCase();
          if (deviceName.includes('thermal') || 
              deviceName.includes('printer') || 
              deviceName.includes('pos') ||
              deviceName.includes('mtp') ||
              deviceName.includes('rpp') ||
              result.device.name) { // Include all named devices for user selection
            
            const existing = foundDevices.find(d => d.deviceId === result.device.deviceId);
            if (!existing) {
              foundDevices.push(result.device);
            }
          }
        }).catch((error) => {
          clearTimeout(scanTimeout);
          reject(error);
        });
      });

      const deviceList = await scanPromise;
      
      if (deviceList.length === 0) {
        throw new Error('Tidak ditemukan printer thermal Bluetooth');
      }

      // Use the first available device (in a real app, you'd show a selection UI)
      this.device = deviceList[0];
      
      console.log(`Connecting to: ${this.device.name || this.device.deviceId}`);
      
      // Connect to the device
      await BleClient.connect(this.device.deviceId);
      
      // Discover services
      const services = await BleClient.getServices(this.device.deviceId);
      console.log(`Found ${services.length} services`);

      // Find writable characteristic
      for (const service of services) {
        console.log(`Checking service: ${service.uuid}`);
        
        for (const characteristic of service.characteristics) {
          console.log(`Characteristic: ${characteristic.uuid}, Properties:`, characteristic.properties);
          
          if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
            this.serviceUuid = service.uuid;
            this.characteristicUuid = characteristic.uuid;
            console.log(`✓ Using service: ${this.serviceUuid}, characteristic: ${this.characteristicUuid}`);
            return true;
          }
        }
      }

      throw new Error('Tidak ditemukan characteristic yang bisa ditulis');
    } catch (error: any) {
      console.error('Failed to connect to native printer:', error);
      return false;
    }
  }

  async print(text: string): Promise<boolean> {
    if (!this.device || !this.serviceUuid || !this.characteristicUuid) {
      const connected = await this.connect();
      if (!connected) return false;
    }

    try {
      // ESC/POS commands for thermal printing
      const ESC = '\x1B';
      const GS = '\x1D';
      
      // Initialize printer
      let commands = ESC + '@'; // Initialize
      commands += ESC + 'a' + '\x01'; // Center align
      
      // Add the text content
      commands += text;
      
      // Cut paper and eject
      commands += '\n\n\n';
      commands += GS + 'V' + '\x42' + '\x00'; // Partial cut
      
      // Convert text to DataView for native BLE
      const dataView = textToDataView(commands);
      
      // Write to characteristic
      await BleClient.write(
        this.device!.deviceId,
        this.serviceUuid,
        this.characteristicUuid,
        dataView
      );
      
      console.log('✓ Native print command sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to print via native BLE:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      await BleClient.disconnect(this.device.deviceId);
      console.log('Disconnected from native printer');
    }
    this.device = null;
    this.serviceUuid = '';
    this.characteristicUuid = '';
  }

  isConnected(): boolean {
    return this.device !== null;
  }
}

export const nativeThermalPrinter = new NativeThermalPrinter();