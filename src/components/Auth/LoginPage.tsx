import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export const LoginPage = () => {
  const { signIn, signInWithUsername, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showAfterHoursLogin, setShowAfterHoursLogin] = useState(false);
  const [afterHoursPassword, setAfterHoursPassword] = useState('');

  // Check if current time is within business hours (6 AM to 5 PM)
  const isWithinBusinessHours = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 6 && hour < 17; // 6 AM to 5 PM
  };

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if outside business hours and require password
    if (!isWithinBusinessHours() && !showAfterHoursLogin) {
      setShowAfterHoursLogin(true);
      return;
    }

    setIsLoading(true);
    setError('');

    let result;
    if (formData.email.includes('@')) {
      result = await signIn(formData.email, formData.password);
    } else {
      result = await signInWithUsername(formData.email, formData.password);
    }
    
    if (result.error) {
      setError(result.error.message);
    }
    setIsLoading(false);
  };

  const handleAfterHoursAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (afterHoursPassword === '7654321') {
      setShowAfterHoursLogin(false);
      setAfterHoursPassword('');
      // Continue with normal login
      setIsLoading(true);
      setError('');

      let result;
      if (formData.email.includes('@')) {
        result = await signIn(formData.email, formData.password);
      } else {
        result = await signInWithUsername(formData.email, formData.password);
      }
      
      if (result.error) {
        setError(result.error.message);
      }
      setIsLoading(false);
    } else {
      setError('Kata sandi akses di luar jam buka salah');
      setAfterHoursPassword('');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      setIsLoading(false);
      return;
    }

    const result = await signUp(formData.email, formData.username, formData.password);
    
    if (result.error) {
      setError(result.error.message);
    } else {
      toast.success('Akun berhasil dibuat! Silakan cek email Anda untuk konfirmasi, lalu login.');
      setShowSignUp(false);
      setFormData({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
      });
    }
    setIsLoading(false);
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {showAfterHoursLogin ? 'Akses Di Luar Jam Buka' : (showSignUp ? 'Daftar Akun Baru' : 'Kasir Toko Anjar')}
          </CardTitle>
          <CardDescription>
            {showAfterHoursLogin ? 'Sistem tutup jam 17:00-06:00. Masukkan kata sandi akses:' : (showSignUp ? 'Buat akun baru untuk sistem kasir' : 'Masuk ke sistem kasir')}
          </CardDescription>
          {!showAfterHoursLogin && !showSignUp && (
            <div className="mt-2 p-2 bg-info/10 border border-info/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-info">
                <span className="font-medium">⏰ Jam Operasional Sistem:</span>
                <span>06:00 - 17:00 WIB (Senin - Minggu)</span>
              </div>
              {!isWithinBusinessHours() && (
                <div className="mt-1 text-xs text-warning">
                  ⚠️ Sistem saat ini dalam jam operasional. Sistem tutup jam 17:00-06:00
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {showAfterHoursLogin ? (
            <form onSubmit={handleAfterHoursAccess} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="afterHoursPassword">Kata Sandi Akses</Label>
                <Input
                  id="afterHoursPassword"
                  type="password"
                  value={afterHoursPassword}
                  onChange={(e) => setAfterHoursPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akses"
                  required
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Button type="submit" className="w-full">
                  Akses Sistem
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    setShowAfterHoursLogin(false);
                    setAfterHoursPassword('');
                    setError('');
                  }}
                >
                  Kembali
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={showSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {showSignUp && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    email: e.target.value 
                  })}
                  placeholder="contoh@gmail.com"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">
                {showSignUp ? 'Username' : 'Email / Username'}
              </Label>
              <Input
                id="username"
                type="text"
                value={showSignUp ? formData.username : formData.email}
                onChange={(e) => setFormData(showSignUp ? { 
                  ...formData, 
                  username: e.target.value 
                } : {
                  ...formData,
                  email: e.target.value
                })}
                placeholder={showSignUp ? "username" : "tokoanjar atau email@gmail.com"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            {showSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Loading...' : (showSignUp ? 'Daftar' : 'Masuk')}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setShowSignUp(!showSignUp);
                  setError('');
                  setFormData({
                    email: '',
                    username: '',
                    password: '',
                    confirmPassword: '',
                  });
                }}
              >
                {showSignUp ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
              </Button>
            </div>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};