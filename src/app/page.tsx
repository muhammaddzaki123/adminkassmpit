'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Wallet, TrendingUp, Users, CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-accent-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-primary to-primary-700 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-neutral-900 text-lg leading-none">T-SMART</h1>
                <p className="text-xs text-neutral-600 font-medium">Treasury System</p>
              </div>
            </div>
            <button
              onClick={handleGetStarted}
              className="px-6 py-2 bg-primary hover:bg-primary-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-soft hover:shadow-medium"
            >
              {isLoggedIn ? 'Dashboard' : 'Masuk'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-6">
            <CheckCircle className="w-4 h-4" />
            Sistem Keuangan Sekolah Modern
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
            Kelola Keuangan Sekolah<br />
            <span className="text-primary">Lebih Mudah & Efisien</span>
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            T-SMART membantu sekolah dalam mengelola pembayaran SPP, keuangan, dan administrasi dengan sistem yang terintegrasi dan mudah digunakan.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-700 text-white rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Mulai Sekarang
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 animate-slide-up">
          <div className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-200">
            <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-neutral-900 mb-2">Keamanan Terjamin</h3>
            <p className="text-sm text-neutral-600">Data keuangan sekolah tersimpan aman dengan enkripsi tingkat tinggi</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-200">
            <div className="w-12 h-12 bg-accent-100 text-accent-700 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-neutral-900 mb-2">Laporan Real-time</h3>
            <p className="text-sm text-neutral-600">Pantau pemasukan dan pengeluaran sekolah secara real-time</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-200">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-neutral-900 mb-2">Multi-User Role</h3>
            <p className="text-sm text-neutral-600">Akses berbeda untuk Admin, Bendahara, Kepsek, dan Orang Tua</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-neutral-200">
            <div className="w-12 h-12 bg-green-100 text-green-700 rounded-xl flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-neutral-900 mb-2">Pembayaran Mudah</h3>
            <p className="text-sm text-neutral-600">Sistem pembayaran SPP yang praktis dengan notifikasi otomatis</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-linear-to-r from-primary to-primary-700 rounded-3xl p-12 text-center shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Siap Modernisasi Sistem Keuangan Sekolah?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Bergabunglah dengan sekolah-sekolah yang telah mempercayai T-SMART
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-neutral-100 text-primary rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Coba Gratis Sekarang
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-linear-to-br from-primary to-primary-700 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg leading-none">T-SMART</h3>
              <p className="text-xs text-neutral-400 font-medium">Treasury System</p>
            </div>
          </div>
          <p className="text-neutral-400 text-sm">
            © 2024 T-SMART. Sistem Manajemen Keuangan Sekolah.
          </p>
        </div>
      </footer>
    </div>
  );
}
