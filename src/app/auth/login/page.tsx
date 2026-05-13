'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, User, AlertCircle, GraduationCap, BookOpen } from 'lucide-react';
import { clearClientAuthSession } from '@/lib/client-auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void clearClientAuthSession({ skipServerLogout: true });
  }, []);

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

      // Simpan data user di localStorage. Token session disimpan via httpOnly cookie.
      localStorage.setItem('user', JSON.stringify(data.user));
      
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f7ef_0%,#f7f5ef_35%,#ffffff_100%)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-200/40 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent-200/35 blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Section */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg shadow-primary/30">
            <Image src="/logo.jpg" alt="Logo SMP IT Anak Soleh Mataram" fill sizes="80px" className="object-contain p-2" priority />
          </div>
          <h1 className="mb-1 text-3xl font-bold text-neutral-900">SMP IT ANAK SOLEH</h1>
          <p className="text-base font-semibold text-neutral-700">Mataram</p>
          <p className="mt-3 text-sm text-neutral-600">Portal Administrasi Sekolah</p>
        </div>

        {/* Login Card */}
        <Card padding="lg" className="animate-slide-up border-2 border-neutral-100 bg-white shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-primary-800">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">Masuk ke Portal</h2>
            <p className="mt-1 text-sm text-neutral-500">Gunakan username dan password resmi Anda</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 p-3 text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Input
              label="Username"
              type="text"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<User className="h-4 w-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Masukkan password"
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 group">
                <input 
                  type="checkbox" 
                  className="cursor-pointer rounded border-neutral-300 text-primary focus:ring-primary" 
                />
                <span className="text-neutral-600 group-hover:text-neutral-900">Ingat saya</span>
              </label>
              <button 
                type="button" 
                className="font-semibold text-primary hover:text-primary-700 hover:underline"
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
              {isLoading ? 'Memproses...' : 'Masuk ke Portal'}
            </Button>

            <p className="mt-4 text-center text-xs text-neutral-500">
              Akses portal akan ditampilkan sesuai role akun Anda setelah login berhasil.
            </p>
          </form>
        </Card>

        {/* Info Section */}
        <div className="mt-6 space-y-3 animate-slide-up">
          <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-soft">
            <GraduationCap className="mt-0.5 h-5 w-5 text-primary-700 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Untuk Siswa</p>
              <p className="text-sm text-neutral-700">Cek status akademik dan informasi sekolah</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-soft">
            <BookOpen className="mt-0.5 h-5 w-5 text-primary-700 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Untuk Orang Tua</p>
              <p className="text-sm text-neutral-700">Monitor perkembangan dan pembayaran siswa</p>
            </div>
          </div>
        </div>

        {/* Help Link */}
        <p className="mt-6 text-center text-sm text-neutral-600">
          Butuh bantuan? <Link href="/" className="font-semibold text-primary hover:underline">Kembali ke halaman utama</Link>
        </p>
      </div>
    </div>
  );
}
