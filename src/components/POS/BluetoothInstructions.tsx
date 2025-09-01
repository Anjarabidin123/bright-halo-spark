import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Chrome, Bluetooth, Settings, Wifi } from 'lucide-react';

export const BluetoothInstructions = () => {
  const isAndroid = /Android/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent);
  
  if (!isAndroid) {
    return (
      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertDescription>
          Fitur Bluetooth printer hanya tersedia di <strong>Android Chrome</strong>. 
          iOS Safari tidak mendukung Web Bluetooth API.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isChrome) {
    return (
      <Alert>
        <Chrome className="h-4 w-4" />
        <AlertDescription>
          Gunakan <strong>Google Chrome</strong> untuk mengakses fitur Bluetooth printer.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bluetooth className="h-4 w-4" />
          Setup Bluetooth di Android Chrome
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <strong>Langkah 1:</strong> Aktifkan Web Bluetooth di Chrome
          </AlertDescription>
        </Alert>
        
        <div className="pl-4 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">1</Badge>
            <span>Buka Chrome, ketik: <code className="bg-muted px-1 rounded">chrome://flags</code></span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">2</Badge>
            <span>Cari: <strong>"Experimental Web Platform features"</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">3</Badge>
            <span>Ubah ke <strong>"Enabled"</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">4</Badge>
            <span>Restart Chrome</span>
          </div>
        </div>

        <Alert>
          <Bluetooth className="h-4 w-4" />
          <AlertDescription>
            <strong>Langkah 2:</strong> Pastikan Bluetooth aktif di Android
          </AlertDescription>
        </Alert>

        <Alert>
          <Wifi className="h-4 w-4" />
          <AlertDescription>
            <strong>Alternatif:</strong> Gunakan printer WiFi/Network untuk kompatibilitas yang lebih baik
          </AlertDescription>
        </Alert>

        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
          <strong>Printer yang didukung:</strong> MTP, POS, EPSON, STAR, BIXOLON, CITIZEN, dan printer thermal lain dengan Bluetooth LE
        </div>
      </CardContent>
    </Card>
  );
};