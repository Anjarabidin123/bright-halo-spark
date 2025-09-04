import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

interface OperatingHoursProps {
  children: React.ReactNode;
}

export const OperatingHours = ({ children }: OperatingHoursProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const OPEN_HOUR = 6; // 06:00
  const CLOSE_HOUR = 17; // 17:00
  const OVERRIDE_PASSWORD = '122344566';

  useEffect(() => {
    const checkOperatingHours = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Check if current time is within operating hours
      const withinHours = currentHour >= OPEN_HOUR && currentHour < CLOSE_HOUR;
      
      // Check if override is active (stored in sessionStorage)
      const overrideActive = sessionStorage.getItem('pos_override_active') === 'true';
      
      setIsOpen(withinHours || overrideActive);
      setCurrentTime(now);
    };

    // Check immediately
    checkOperatingHours();

    // Update every minute
    const interval = setInterval(checkOperatingHours, 60000);

    return () => clearInterval(interval);
  }, []);

  const handlePasswordSubmit = () => {
    if (password === OVERRIDE_PASSWORD) {
      sessionStorage.setItem('pos_override_active', 'true');
      setIsOpen(true);
      setShowPasswordDialog(false);
      setPassword('');
      toast.success('Akses darurat diaktifkan');
    } else {
      toast.error('Password salah');
      setPassword('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  if (isOpen) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-muted">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Sistem Tutup</h1>
            <p className="text-muted-foreground mb-4">
              Jam operasional: {OPEN_HOUR}:00 - {CLOSE_HOUR}:00
            </p>
            
            <div className="bg-muted rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Waktu saat ini:</p>
              <p className="text-xl font-mono font-bold">{formatTime(currentTime)}</p>
            </div>

            <Button 
              onClick={() => setShowPasswordDialog(true)}
              variant="outline"
              className="w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              Akses Darurat
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5" />
              Akses Darurat
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Masukkan password untuk mengakses sistem di luar jam operasional:
            </p>
            
            <Input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePasswordSubmit();
                }
              }}
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={handlePasswordSubmit}
                className="flex-1"
              >
                Buka Akses
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPassword('');
                }}
                className="flex-1"
              >
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};