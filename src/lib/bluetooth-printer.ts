import { Capacitor } from '@capacitor/core';
import { BleClient, BleDevice, textToDataView } from '@capacitor-community/bluetooth-le';

declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options: any): Promise<BluetoothDevice>;
    };
  }
}

interface BluetoothDevice {
  gatt?: BluetoothRemoteGATTServer;
  name?: string;
  id: string;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): Promise<void>;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothRemoteGATTService {
  uuid: string;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTCharacteristic {
  uuid: string;
  properties: {
    write: boolean;
    writeWithoutResponse: boolean;
  };
  writeValue(value: ArrayBuffer): Promise<void>;
}

export class BluetoothPrinter {
  private webDevice: BluetoothDevice | null = null;
  private webCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private nativeDevice: BleDevice | null = null;
  private nativeServiceUuid: string = '';
  private nativeCharacteristicUuid: string = '';

  async connect(): Promise<boolean> {
    console.log('🔗 Menginisialisasi koneksi Bluetooth printer...');
    
    if (Capacitor.isNativePlatform()) {
      return await this.connectNative();
    } else {
      return await this.connectWeb();
    }
  }

  private async connectNative(): Promise<boolean> {
    try {
      console.log('📱 Menggunakan native Bluetooth');
      
      await BleClient.initialize();
      
      // Scan untuk printer thermal
      const devices = await BleClient.requestLEScan({
        services: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Thermal printer
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // HM-10
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e'  // Nordic UART
        ]
      }, (result) => {
        console.log('🔍 Device ditemukan:', result.device.name || result.device.deviceId);
      });

      // Stop scan setelah 8 detik
      setTimeout(async () => {
        await BleClient.stopLEScan();
      }, 8000);

      // Ambil device pertama
      const deviceList = await BleClient.getDevices([]);
      
      if (deviceList.length === 0) {
        throw new Error('Tidak ada printer Bluetooth ditemukan');
      }

      this.nativeDevice = deviceList[0];
      console.log(`📞 Menghubungkan ke: ${this.nativeDevice.name || this.nativeDevice.deviceId}`);
      
      await BleClient.connect(this.nativeDevice.deviceId);
      
      // Cari characteristic yang bisa ditulis
      const services = await BleClient.getServices(this.nativeDevice.deviceId);
      
      for (const service of services) {
        for (const characteristic of service.characteristics) {
          if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
            this.nativeServiceUuid = service.uuid;
            this.nativeCharacteristicUuid = characteristic.uuid;
            console.log('✅ Native printer terhubung!');
            return true;
          }
        }
      }

      throw new Error('Tidak ditemukan characteristic yang kompatibel');
    } catch (error: any) {
      console.error('❌ Native Bluetooth gagal:', error);
      return false;
    }
  }

  private async connectWeb(): Promise<boolean> {
    try {
      console.log('🌐 Menggunakan Web Bluetooth');
      
      if (!navigator.bluetooth) {
        throw new Error('Browser tidak mendukung Web Bluetooth');
      }

      console.log('🔍 Scanning untuk semua device Bluetooth...');
      
      this.webDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
        ]
      });

      if (!this.webDevice.gatt) {
        throw new Error('GATT tidak tersedia');
      }

      console.log(`📞 Menghubungkan ke: ${this.webDevice.name || 'Unknown Device'}`);
      
      const server = await this.webDevice.gatt.connect();
      const services = await server.getPrimaryServices();

      console.log(`🔧 Ditemukan ${services.length} service`);

      // Cari characteristic yang bisa ditulis
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              this.webCharacteristic = char;
              console.log('✅ Web Bluetooth printer terhubung!');
              return true;
            }
          }
        } catch (e) {
          console.warn(`⚠️ Error checking service ${service.uuid}:`, e);
        }
      }

      throw new Error('Tidak ditemukan characteristic untuk print');
    } catch (error: any) {
      console.error('❌ Web Bluetooth gagal:', error);
      return false;
    }
  }

  async print(text: string): Promise<boolean> {
    try {
      // ESC/POS commands
      const ESC = '\x1B';
      const GS = '\x1D';
      
      let commands = ESC + '@'; // Initialize printer
      commands += ESC + 'a' + '\x01'; // Center align
      commands += text;
      commands += '\n\n\n';
      commands += GS + 'V' + '\x42' + '\x00'; // Cut paper

      if (Capacitor.isNativePlatform()) {
        return await this.printNative(commands);
      } else {
        return await this.printWeb(commands);
      }
    } catch (error) {
      console.error('❌ Print error:', error);
      return false;
    }
  }

  private async printNative(commands: string): Promise<boolean> {
    if (!this.nativeDevice || !this.nativeServiceUuid || !this.nativeCharacteristicUuid) {
      const connected = await this.connectNative();
      if (!connected) return false;
    }

    try {
      const dataView = textToDataView(commands);
      
      await BleClient.write(
        this.nativeDevice!.deviceId,
        this.nativeServiceUuid,
        this.nativeCharacteristicUuid,
        dataView
      );
      
      console.log('✅ Native print berhasil');
      return true;
    } catch (error) {
      console.error('❌ Native print gagal:', error);
      return false;
    }
  }

  private async printWeb(commands: string): Promise<boolean> {
    if (!this.webCharacteristic) {
      const connected = await this.connectWeb();
      if (!connected) return false;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(commands);
      
      // Kirim dalam chunk kecil
      const chunkSize = 20;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await this.webCharacteristic!.writeValue(chunk);
        
        // Delay kecil antara chunk
        if (i + chunkSize < data.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      console.log('✅ Web print berhasil');
      return true;
    } catch (error) {
      console.error('❌ Web print gagal:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform() && this.nativeDevice) {
        await BleClient.disconnect(this.nativeDevice.deviceId);
        this.nativeDevice = null;
        this.nativeServiceUuid = '';
        this.nativeCharacteristicUuid = '';
      } else if (this.webDevice?.gatt?.connected) {
        await this.webDevice.gatt.disconnect();
        this.webDevice = null;
        this.webCharacteristic = null;
      }
      console.log('🔌 Printer disconnected');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
    }
  }

  isConnected(): boolean {
    if (Capacitor.isNativePlatform()) {
      return this.nativeDevice !== null;
    } else {
      return this.webDevice?.gatt?.connected || false;
    }
  }

  getPlatform(): string {
    return Capacitor.isNativePlatform() ? 'Native App' : 'Web Browser';
  }
}

// Export singleton instance
export const bluetoothPrinter = new BluetoothPrinter();