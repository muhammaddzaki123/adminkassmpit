'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreditCard, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          setError(data.error || 'Login gagal');
        } else {
          setError(`Login gagal: ${response.status}`);
        }
        setIsLoading(false);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Expected JSON response but got: ' + contentType);
      }

      const data = await response.json();

      // Simpan user data dan token ke localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      // Redirect berdasarkan role
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (data.user.role === 'TREASURER') {
        router.push('/treasurer/dashboard');
      } else if (data.user.role === 'HEADMASTER') {
        router.push('/headmaster');
      } else if (data.user.role === 'STUDENT') {
        router.push('/student/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-5xl w-full relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-linear-to-br from-primary to-primary-700 rounded-2xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-primary/30 animate-fade-in">
            <CreditCard className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">T-SMART</h1>
          <p className="text-lg text-neutral-700 font-medium">Portal Keuangan SMP IT ANAK SOLEH MATARAM</p>
          <p className="text-sm text-neutral-500 mt-2">Sistem akses tunggal untuk operasional keuangan yang aman dan terkontrol.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 animate-slide-up">
          <Card className="lg:col-span-2 bg-neutral-900 text-white border-neutral-800 shadow-2xl">
            <div className="space-y-5">
              <h2 className="text-2xl font-bold leading-tight">Akses Profesional Tanpa Pilih Role</h2>
              <p className="text-neutral-200 text-sm">
                Cukup masukkan kredensial akun. Sistem akan mendeteksi otorisasi secara otomatis sesuai profil Anda.
              </p>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 mt-0.5 text-primary-300" />
                  <span>Role ditentukan otomatis dari data akun tervalidasi.</span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 mt-0.5 text-primary-300" />
                  <span>Semua aktivitas kritis tercatat untuk audit internal.</span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 mt-0.5 text-primary-300" />
                  <span>Perlindungan sesi dan validasi akses untuk data finansial.</span>
                </div>
              </div>

              <div className="rounded-xl bg-white/10 border border-white/20 p-3 text-xs text-neutral-100">
                Halaman ini khusus pengguna resmi SMP IT ANAK SOLEH MATARAM.
              </div>
            </div>
          </Card>

          <div className="lg:col-span-3">
            <Card padding="lg" className="shadow-2xl border-2 border-neutral-100 bg-white">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-md">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900">Masuk ke Sistem</h2>
                <p className="text-sm text-neutral-500 mt-1">Gunakan username dan password resmi Anda</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-xl p-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Input
                  label="Username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  icon={<User className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Masukkan password"
                  icon={<Lock className="w-4 h-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="rounded border-neutral-300 text-primary focus:ring-primary cursor-pointer" 
                    />
                    <span className="text-neutral-600 group-hover:text-neutral-900">Ingat saya</span>
                  </label>
                  <button 
                    type="button" 
                    className="text-primary hover:text-primary-700 font-semibold hover:underline"
                    onClick={() => router.push('/auth/forgot-password')}
                  >
                    Lupa password?
                  </button>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  className="mt-6!"
                >
                  {isLoading ? 'Memproses...' : 'Login'}
                </Button>

                <p className="text-center text-sm text-neutral-500 mt-4">
                  Role akses akan dipetakan otomatis setelah login berhasil.
                </p>
              </form>
            </Card>

            <p className="text-center mt-6 text-sm text-neutral-600">
              Butuh bantuan akun? <a href="#" className="text-primary font-semibold hover:underline">Hubungi Admin Sekolah</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
