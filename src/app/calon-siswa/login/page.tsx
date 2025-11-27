'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GraduationCap, AlertCircle } from 'lucide-react';

export default function NewStudentLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nisn: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/calon-siswa/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      // Redirect ke dashboard calon siswa
      router.push('/calon-siswa/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Portal Calon Siswa
          </h1>
          <p className="text-gray-600">
            Login untuk melanjutkan pendaftaran
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Login Gagal</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NISN
            </label>
            <Input
              type="text"
              placeholder="Masukkan NISN"
              value={formData.nisn}
              onChange={(e) =>
                setFormData({ ...formData, nisn: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Input
              type="password"
              placeholder="Masukkan password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Login'}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <a
              href="/calon-siswa/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Daftar Sekarang
            </a>
          </p>
          <p className="text-sm text-gray-600">
            Siswa/Guru/Admin?{' '}
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Login di sini
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}
