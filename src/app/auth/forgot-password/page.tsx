'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AlertCircle, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugResetUrl, setDebugResetUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDebugResetUrl('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Permintaan reset password gagal diproses');
        return;
      }

      setSuccess(result.message || 'Tautan reset password telah diproses.');
      if (result.debugResetUrl) {
        setDebugResetUrl(result.debugResetUrl);
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <Card className="shadow-2xl border-neutral-200" padding="lg">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary text-white mx-auto mb-4 flex items-center justify-center">
              <Mail className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Lupa Password</h1>
            <p className="text-sm text-neutral-600 mt-2">
              Masukkan username atau email akun Anda untuk menerima tautan reset password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {debugResetUrl && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                <p className="font-semibold mb-1">Mode Pengembangan</p>
                <a href={debugResetUrl} className="underline break-all">{debugResetUrl}</a>
              </div>
            )}

            <Input
              label="Username atau Email"
              type="text"
              placeholder="contoh: bendahara01 atau email@sekolah.sch.id"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
              {isLoading ? 'Memproses...' : 'Kirim Tautan Reset'}
            </Button>
          </form>

          <div className="mt-5 rounded-xl bg-neutral-50 border border-neutral-200 p-3 text-xs text-neutral-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 mt-0.5 text-primary-700 shrink-0" />
            <span>Tautan reset bersifat sementara dan akan kedaluwarsa otomatis demi keamanan data finansial sekolah.</span>
          </div>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
