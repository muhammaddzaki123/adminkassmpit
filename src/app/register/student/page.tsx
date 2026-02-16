'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface RegistrationData {
  nisn: string;
  nama: string;
  kelas: string;
  email: string;
  password: string;
  confirmPassword: string;
  noTelp: string;
  alamat: string;
  namaOrangTua: string;
}

export default function StudentRegistrationPage() {
  const [formData, setFormData] = useState<RegistrationData>({
    nisn: '',
    nama: '',
    kelas: '',
    email: '',
    password: '',
    confirmPassword: '',
    noTelp: '',
    alamat: '',
    namaOrangTua: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    vaNumber: string;
    amount: number;
    expiredAt: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      alert('Password dan konfirmasi password tidak cocok!');
      return;
    }

    if (formData.nisn.length !== 10) {
      alert('NISN harus 10 digit!');
      return;
    }

    if (!formData.email.includes('@')) {
      alert('Email tidak valid!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          alert(data.message || 'Pendaftaran gagal');
        } else {
          alert(`Pendaftaran gagal: ${response.status}`);
        }
        setLoading(false);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Expected JSON response but got: ' + contentType);
      }

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setPaymentInfo(data.payment);
      }
    } catch (error) {
      console.error('Error registering:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat pendaftaran';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success && paymentInfo) {
    return (
      <div className="min-h-screen bg-linear-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h1>
            <p className="text-gray-600">Akun Anda sudah dibuat. Silakan lakukan pembayaran untuk melanjutkan.</p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-blue-900 mb-4">Informasi Pembayaran</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-blue-700">Virtual Account</p>
                <p className="text-2xl font-bold text-blue-900 font-mono">{paymentInfo.vaNumber}</p>
              </div>

              <div>
                <p className="text-sm text-blue-700">Nominal Pembayaran</p>
                <p className="text-xl font-bold text-blue-900">Rp {paymentInfo.amount.toLocaleString()}</p>
              </div>

              <div>
                <p className="text-sm text-blue-700">Berlaku Sampai</p>
                <p className="font-medium text-blue-900">
                  {new Date(paymentInfo.expiredAt).toLocaleString('id-ID', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mr-3 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Langkah Selanjutnya:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Transfer ke Virtual Account di atas</li>
                  <li>Tunggu konfirmasi pembayaran (otomatis max 10 menit)</li>
                  <li>Admin akan mereview dan menyetujui pendaftaran Anda</li>
                  <li>Setelah disetujui, Anda bisa login dengan NISN dan password</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="primary" className="w-full" onClick={() => window.location.href = '/student/login'}>
              Ke Halaman Login
            </Button>
            <Button variant="outline" className="w-full" onClick={() => window.print()}>
              Cetak Informasi Pembayaran
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pendaftaran Siswa Baru</h1>
          <p className="text-gray-600">SMPiT Arrasyid - Tahun Ajaran 2024/2025</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data Siswa */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Siswa</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NISN <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="nisn"
                  value={formData.nisn}
                  onChange={handleChange}
                  placeholder="10 digit NISN"
                  maxLength={10}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Nama lengkap siswa"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kelas <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="kelas"
                  value={formData.kelas}
                  onChange={handleChange}
                  placeholder="Contoh: 7A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@contoh.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. Telepon <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  name="noTelp"
                  value={formData.noTelp}
                  onChange={handleChange}
                  placeholder="081234567890"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Orang Tua <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="namaOrangTua"
                  value={formData.namaOrangTua}
                  onChange={handleChange}
                  placeholder="Nama orang tua/wali"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  placeholder="Alamat lengkap"
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Data Akun */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Buat Akun Login</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konfirmasi Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ketik ulang password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-2">
              💡 Username Anda adalah <strong>NISN</strong> yang Anda masukkan
            </p>
          </div>

          {/* Info Pembayaran */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Informasi Biaya Pendaftaran</h3>
            <p className="text-2xl font-bold text-blue-900 mb-2">Rp 500.000</p>
            <p className="text-sm text-blue-700">
              Setelah mendaftar, Anda akan mendapatkan Virtual Account untuk pembayaran. 
              Pendaftaran akan diproses setelah pembayaran dikonfirmasi.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              'Daftar Sekarang'
            )}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Sudah punya akun?{' '}
            <a href="/student/login" className="text-emerald-600 hover:underline font-medium">
              Login di sini
            </a>
          </p>
        </form>
      </Card>
    </div>
  );
}
