'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, AlertCircle, CreditCard } from 'lucide-react';

export default function ReRegistrationPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [status] = useState<'PAID' | 'UNPAID' | 'PENDING'>('UNPAID');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'PARENT') {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const registrationFee = 2000000;
  const tahunAjaran = '2025/2026';

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block">
        <StudentSidebar />
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
            <StudentSidebar />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <StudentHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mt-16">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Daftar Ulang</h1>
              <p className="text-neutral-600 mt-1">Pembayaran daftar ulang tahun ajaran {tahunAjaran}</p>
            </div>

            {status === 'PAID' ? (
              <Card className="bg-green-50 border-green-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-2">Pembayaran Berhasil!</h3>
                    <p className="text-green-700 mb-4">
                      Pembayaran daftar ulang Anda untuk tahun ajaran {tahunAjaran} telah berhasil diverifikasi.
                    </p>
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-neutral-600">Total Dibayar</span>
                        <span className="font-bold">{formatCurrency(registrationFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Tanggal Pembayaran</span>
                        <span>20 Desember 2024</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                <Card className="bg-yellow-50 border-yellow-200">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <AlertCircle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-yellow-900 mb-2">Segera Lakukan Pembayaran</h3>
                      <p className="text-yellow-700">
                        Silakan lakukan pembayaran daftar ulang untuk mengonfirmasi keikutsertaan Anda di tahun ajaran {tahunAjaran}.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">Detail Pembayaran</h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-neutral-600">Tahun Ajaran</span>
                      <span className="font-medium">{tahunAjaran}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-neutral-600">Biaya Daftar Ulang</span>
                      <span className="font-medium">{formatCurrency(registrationFee)}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="font-semibold text-neutral-900">Total Pembayaran</span>
                      <span className="font-bold text-2xl text-primary-600">{formatCurrency(registrationFee)}</span>
                    </div>
                  </div>

                  <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-neutral-900 mb-3">Yang Akan Anda Dapatkan:</h3>
                    <ul className="space-y-2 text-sm text-neutral-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Konfirmasi keikutsertaan tahun ajaran baru
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Seragam sekolah baru
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Buku paket pelajaran
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Kartu pelajar baru
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Akses sistem pembelajaran online
                      </li>
                    </ul>
                  </div>

                  <Button
                    fullWidth
                    icon={<CreditCard className="w-5 h-5" />}
                    onClick={() => router.push('/student/spp')}
                  >
                    Bayar Sekarang
                  </Button>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-3">Informasi Penting</h3>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li>• Batas pembayaran: 30 Juni 2025</li>
                    <li>• Pembayaran dapat dilakukan melalui berbagai metode</li>
                    <li>• Status pembayaran akan otomatis diperbarui setelah verifikasi</li>
                    <li>• Untuk pertanyaan, hubungi bagian tata usaha sekolah</li>
                  </ul>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
