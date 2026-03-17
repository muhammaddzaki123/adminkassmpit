'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BadgeCheck, Building2, ChartPie, CircleDollarSign, LockKeyhole, Shield, Wallet } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleGetStarted = () => {
    const userData = localStorage.getItem('user');
    
    if (userData) {
      const user = JSON.parse(userData);
      // Redirect based on role
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'TREASURER') {
        router.push('/treasurer');
      } else if (user.role === 'HEADMASTER') {
        router.push('/headmaster');
      } else if (user.role === 'STUDENT') {
        router.push('/student/dashboard');
      } else {
        router.push('/auth/login');
      }
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(126,194,66,0.18),transparent_35%),radial-gradient(circle_at_80%_15%,rgba(242,154,46,0.16),transparent_30%)]" />

      <nav className="border-b border-neutral-200/80 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary-600 to-primary-800 text-white flex items-center justify-center shadow-medium">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">SMP IT ANAK SOLEH MATARAM</p>
              <h1 className="text-sm sm:text-base font-bold text-neutral-900 leading-tight">T-SMART Finance Platform</h1>
            </div>
          </div>
          <button
            onClick={handleGetStarted}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-soft"
          >
            {isLoggedIn ? 'Ke Dashboard' : 'Masuk Sistem'}
          </button>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 bg-white border border-primary-200 rounded-full text-xs font-semibold text-primary-800">
              <BadgeCheck className="w-4 h-4" />
              Platform Keuangan Internal Sekolah
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 leading-tight">
              Transparansi dan Kontrol Keuangan
              <span className="block text-primary-700 mt-1">untuk SMP IT ANAK SOLEH MATARAM</span>
            </h2>

            <p className="mt-5 text-lg text-neutral-600 max-w-xl">
              T-SMART adalah pusat operasional keuangan sekolah untuk pengelolaan tagihan, pembayaran, verifikasi, laporan, dan audit aktivitas secara terintegrasi.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-xl font-semibold transition-all shadow-medium"
              >
                {isLoggedIn ? 'Buka Dashboard' : 'Masuk ke Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#kapabilitas"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl font-semibold transition-all"
              >
                Lihat Kapabilitas
              </a>
            </div>
          </div>

          <div className="relative animate-slide-up">
            <div className="absolute -inset-2 rounded-3xl bg-linear-to-br from-primary-200/40 to-accent-200/30 blur-xl" />
            <div className="relative bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-strong">
              <h3 className="text-xl font-bold text-neutral-900 mb-5">Operasional yang Terkendali</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-2xl border border-neutral-200 bg-neutral-50">
                  <Shield className="w-5 h-5 text-primary-700 mt-0.5" />
                  <div>
                    <p className="font-semibold text-neutral-800">Akses berbasis otorisasi</p>
                    <p className="text-sm text-neutral-600">Hak akses otomatis sesuai akun tanpa pemilihan role manual.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-2xl border border-neutral-200 bg-neutral-50">
                  <CircleDollarSign className="w-5 h-5 text-primary-700 mt-0.5" />
                  <div>
                    <p className="font-semibold text-neutral-800">Monitoring pembayaran real-time</p>
                    <p className="text-sm text-neutral-600">Tagihan, histori, dan status pembayaran terpantau sepanjang waktu.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-2xl border border-neutral-200 bg-neutral-50">
                  <LockKeyhole className="w-5 h-5 text-primary-700 mt-0.5" />
                  <div>
                    <p className="font-semibold text-neutral-800">Jejak audit aktivitas</p>
                    <p className="text-sm text-neutral-600">Perubahan data kritis tercatat untuk kebutuhan kontrol dan pelaporan.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="kapabilitas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-soft">
            <Building2 className="w-6 h-6 text-primary-700 mb-3" />
            <h4 className="font-bold text-neutral-900 mb-2">Administrasi Terpusat</h4>
            <p className="text-sm text-neutral-600">Kelola data pengguna, siswa, tahun ajaran, dan pengaturan sistem dari satu panel.</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-soft">
            <Wallet className="w-6 h-6 text-primary-700 mb-3" />
            <h4 className="font-bold text-neutral-900 mb-2">Tagihan dan Pembayaran</h4>
            <p className="text-sm text-neutral-600">Proses pembayaran manual maupun online dengan status transaksi yang konsisten.</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-soft">
            <ChartPie className="w-6 h-6 text-primary-700 mb-3" />
            <h4 className="font-bold text-neutral-900 mb-2">Laporan Keuangan</h4>
            <p className="text-sm text-neutral-600">Ringkasan pemasukan, tunggakan, dan realisasi untuk monitoring pimpinan sekolah.</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-soft">
            <Shield className="w-6 h-6 text-primary-700 mb-3" />
            <h4 className="font-bold text-neutral-900 mb-2">Data Integrity</h4>
            <p className="text-sm text-neutral-600">Kontrol validasi, jejak aktivitas, dan otorisasi untuk area data finansial yang krusial.</p>
          </div>
        </div>
      </section>

      <footer className="mt-8 border-t border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-primary-600 to-primary-800 text-white flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">T-SMART Finance Platform</p>
              <p className="text-sm text-neutral-500">SMP IT ANAK SOLEH MATARAM</p>
            </div>
          </div>
          <p className="text-sm text-neutral-500">© 2026 Internal Financial Information System</p>
        </div>
      </footer>
    </div>
  );
}
