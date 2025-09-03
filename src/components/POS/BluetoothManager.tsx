import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Bluetooth, 
  BluetoothConnected, 
  X, 
  Smartphone,
  Wifi,
  WifiOff,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { hybridThermalPrinter } from '@/lib/hybrid-thermal-printer';

interface ConnectedDevice {
  id: string;
  name: string;
  platform: string;
  connectedAt: Date;
}

export const BluetoothManager = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check connection status on mount and periodically
    const checkConnection = () => {
      const connected = hybridThermalPrinter.isConnected();
      setIsConnected(connected);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      const success = await hybridThermalPrinter.connect();
      
      if (success) {
        const platformInfo = hybridThermalPrinter.getPlatformInfo();
        const deviceName = `Thermal Printer (${platformInfo})`;
        
        // Add to connected devices list
        const newDevice: ConnectedDevice = {
          id: `device-${Date.now()}`,
          name: deviceName,
          platform: platformInfo,
          connectedAt: new Date()
        };
        
        setConnectedDevices(prev => {
          // Remove any existing devices with same platform to avoid duplicates
          const filtered = prev.filter(d => d.platform !== platformInfo);
          return [...filtered, newDevice];
        });
        
        setIsConnected(true);
        toast.success(`Berhasil terhubung ke ${deviceName}`);
      } else {
        toast.error('Gagal terhubung ke thermal printer');
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      
      // Handle user cancellation gracefully
      if (error.message?.includes('User cancelled') || 
          error.message?.includes('cancel') ||
          error.name === 'NotFoundError') {
        toast.info('Koneksi dibatalkan oleh pengguna');
      } else {
        toast.error(`Gagal terhubung: ${error.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (deviceId?: string) => {
    try {
      await hybridThermalPrinter.disconnect();
      
      if (deviceId) {
        setConnectedDevices(prev => prev.filter(d => d.id !== deviceId));
      } else {
        setConnectedDevices([]);
      }
      
      setIsConnected(false);
      toast.success('Berhasil memutuskan koneksi');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Gagal memutuskan koneksi');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Connection Status Badge */}
      <Badge 
        variant={isConnected ? "default" : "secondary"}
        className="flex items-center gap-1"
      >
        {isConnected ? (
          <>
            <BluetoothConnected className="h-3 w-3" />
            <span className="text-xs">Terhubung</span>
          </>
        ) : (
          <>
            <Bluetooth className="h-3 w-3" />
            <span className="text-xs">Terputus</span>
          </>
        )}
      </Badge>

      {/* Connect/Disconnect Button */}
      {!isConnected ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex items-center gap-1"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              <span className="text-xs hidden sm:inline">Menghubungkan...</span>
            </>
          ) : (
            <>
              <Bluetooth className="h-3 w-3" />
              <span className="text-xs hidden sm:inline">Hubungkan</span>
            </>
          )}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDisconnect()}
          className="flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          <span className="text-xs hidden sm:inline">Putus</span>
        </Button>
      )}

      {/* Connected Devices Count */}
      {connectedDevices.length > 0 && (
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <Smartphone className="h-3 w-3" />
          <span>{connectedDevices.length} perangkat</span>
        </div>
      )}
    </div>
  );
};

// Device connection indicator component
export const DeviceConnectionStatus = () => {
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(hybridThermalPrinter.isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!isConnected) return null;

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Bluetooth Aktif</span>
          </div>
          <Badge variant="outline" className="text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Siap Print
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};