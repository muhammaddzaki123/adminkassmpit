'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreditCard, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#7ec242] rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-[#7ec242]/20">
            <CreditCard className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#1c1c1c]">T-SMART</h1>
          <p className="text-[#4b5563]">Treasury System</p>
        </div>

        <Card padding="lg" className="shadow-xl">
          <h2 className="text-xl font-semibold mb-6 text-[#1c1c1c]">Login ke Akun Anda</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Username"
              type="text"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-[#d1d5db] text-[#7ec242] focus:ring-[#7ec242]" />
                <span className="text-[#4b5563]">Ingat saya</span>
              </label>
              <a href="#" className="text-[#7ec242] hover:underline font-medium">
                Lupa password?
              </a>
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
            >
              Masuk
            </Button>
          </form>
        </Card>

        <p className="text-center mt-6 text-sm text-[#4b5563]">
          Belum punya akun? <a href="#" className="text-[#7ec242] font-medium hover:underline">Hubungi Admin</a>
        </p>
      </div>
    </div>
  );
}
