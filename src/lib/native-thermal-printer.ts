import { Capacitor } from '@capacitor/core';
import { BleClient, BleDevice, numbersToDataView, textToDataView } from '@capacitor-community/bluetooth-le';

export class NativeThermalPrinter {
  private device: BleDevice | null = null;
  private serviceUuid: string = '';
  private characteristicUuid: string = '';

  async initialize(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await BleClient.initialize();
      console.log('Native BLE initialized');
    }
  }

  async connect(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Native Bluetooth hanya tersedia di aplikasi mobile');
    }

    try {
      console.log('🔍 Scanning for Bluetooth printers...');
      
      await this.initialize();

      // Request permission and scan for devices
      const devices = await BleClient.requestLEScan({
        services: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Thermal printer service
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // HM-10 module
          '0000ff00-0000-1000-8000-00805f9b34fb', // Custom service UUID
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e'  // Nordic UART Service
        ]
      }, (result) => {
        console.log('Found device:', result.device.name || result.device.deviceId);
      });

      // Stop scanning after 10 seconds
      setTimeout(async () => {
        await BleClient.stopLEScan();
      }, 10000);

      // For now, let's use a manual device selection approach
      const deviceList = await BleClient.getDevices([]);
      
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