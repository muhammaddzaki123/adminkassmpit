'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreditCard, Lock, User, GraduationCap, UserCog, Users, AlertCircle } from 'lucide-react';

type UserRole = 'TREASURER' | 'HEADMASTER' | 'ADMIN' | 'PARENT';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    {
      id: 'TREASURER' as UserRole,
      name: 'Bendahara',
      icon: CreditCard,
      color: 'bg-primary',
      hoverColor: 'hover:bg-primary-600',
      description: 'Kelola keuangan sekolah'
    },
    {
      id: 'HEADMASTER' as UserRole,
      name: 'Kepala Sekolah',
      icon: GraduationCap,
      color: 'bg-accent',
      hoverColor: 'hover:bg-accent-600',
      description: 'Lihat laporan & analytics'
    },
    {
      id: 'ADMIN' as UserRole,
      name: 'Admin',
      icon: UserCog,
      color: 'bg-primary-700',
      hoverColor: 'hover:bg-primary-800',
      description: 'Kelola sistem & data'
    },
    {
      id: 'PARENT' as UserRole,
      name: 'Siswa',
      icon: Users,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      description: 'Bayar SPP & lihat riwayat'
    },
  ];

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
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login gagal');
        setIsLoading(false);
        return;
      }

      // Simpan user data ke localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect berdasarkan role
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (data.user.role === 'TREASURER') {
        router.push('/treasurer/dashboard');
      } else if (data.user.role === 'HEADMASTER') {
        router.push('/headmaster');
      } else if (data.user.role === 'PARENT') {
        router.push('/student/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
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

      <div className="max-w-4xl w-full relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-linear-to-br from-primary to-primary-700 rounded-2xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-primary/30 animate-fade-in">
            <CreditCard className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">T-SMART</h1>
          <p className="text-lg text-neutral-600 font-medium">Treasury Smart System</p>
          <p className="text-sm text-neutral-500 mt-2">Digitalisasi Keuangan Sekolah — Cepat, Akurat, dan Real-Time</p>
        </div>

        {!selectedRole ? (
          /* Role Selection */
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-neutral-900 text-center mb-8">Pilih Role Anda</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`${role.color} ${role.hoverColor} text-white p-6 rounded-2xl shadow-medium hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 card-hover group`}
                >
                  <role.icon className="w-12 h-12 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-lg mb-2">{role.name}</h3>
                  <p className="text-sm opacity-90">{role.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Login Form */
          <div className="max-w-md mx-auto animate-slide-up">
            <Card padding="lg" className="shadow-2xl border-2 border-neutral-100">
              <div className="text-center mb-6">
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-sm text-neutral-600 hover:text-neutral-900 mb-4 inline-flex items-center gap-1"
                >
                  ← Kembali ke pilihan role
                </button>
                <div className={`w-16 h-16 ${roles.find(r => r.id === selectedRole)?.color} rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-md`}>
                  {(() => {
                    const RoleIcon = roles.find(r => r.id === selectedRole)?.icon;
                    return RoleIcon ? <RoleIcon className="w-8 h-8" /> : null;
                  })()}
                </div>
                <h2 className="text-2xl font-bold text-neutral-900">Login sebagai {roles.find(r => r.id === selectedRole)?.name}</h2>
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
                    onClick={() => alert('Hubungi admin untuk reset password')}
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
                  Akun default: <code className="bg-neutral-100 px-2 py-1 rounded text-xs">superadmin / admin123</code>
                </p>
              </form>
            </Card>

            <p className="text-center mt-6 text-sm text-neutral-600">
              Belum punya akun? <a href="#" className="text-primary font-semibold hover:underline">Hubungi Admin</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
