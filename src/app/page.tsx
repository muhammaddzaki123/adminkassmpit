'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  Landmark,
  MapPin,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f7ef_0%,#f7f5ef_35%,#ffffff_100%)] text-neutral-900">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="absolute -right-20 top-[10%] h-64 w-64 rounded-full bg-accent-200/35 blur-3xl" />
        <div className="absolute left-[45%] top-[30%] h-72 w-72 -translate-x-1/2 rounded-full bg-primary-100/40 blur-3xl" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-neutral-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-medium">
              <Image src="/logo.jpg" alt="Logo SMP IT Anak Soleh Mataram" fill sizes="40px" className="object-contain p-1" priority />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">SMP IT ANAK SOLEH MATARAM</p>
              <h1 className="text-sm font-bold leading-tight sm:text-base">Portal Informasi Sekolah</h1>
            </div>
          </div>
          <button
            onClick={handleGetStarted}
            className="rounded-xl bg-neutral-900 px-5 py-2.5 font-semibold text-white shadow-soft transition-all duration-200 hover:bg-neutral-800"
          >
            {isLoggedIn ? 'Buka Dashboard' : 'Masuk Portal'}
          </button>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-10 pt-14 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="animate-fade-in space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-300 bg-white px-3 py-1.5 text-xs font-semibold text-primary-800">
            <CheckCircle2 className="h-4 w-4" />
            Sekolah Islam Terpadu Berkarakter
          </div>

          <div>
            <h2 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>
              Selamat Datang di
              <span className="mt-2 block text-primary-800">SMP IT Anak Soleh Mataram</span>
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-neutral-600">
              Halaman ini adalah pusat informasi resmi sekolah untuk siswa, orang tua, dan civitas.
              Temukan profil sekolah, program unggulan, serta akses cepat ke portal akademik dan keuangan internal.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-6 py-3 font-semibold text-white shadow-medium transition-all hover:bg-primary-800"
            >
              {isLoggedIn ? 'Lanjut ke Dashboard' : 'Masuk Portal Sekolah'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#profil"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-700 transition-all hover:bg-neutral-100"
            >
              Lihat Profil
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-soft">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Pendekatan</p>
              <p className="mt-1 font-semibold">Tahfidz & Akademik Seimbang</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-soft">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Pembinaan</p>
              <p className="mt-1 font-semibold">Karakter Islami Harian</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-soft">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Kolaborasi</p>
              <p className="mt-1 font-semibold">Sinergi Guru & Orang Tua</p>
            </div>
          </div>
        </div>

        <div className="animate-slide-up rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-strong sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-800">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-poppins)' }}>Informasi Singkat Sekolah</h3>
              <p className="text-sm text-neutral-500">SMP IT ANAK SOLEH MATARAM</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <MapPin className="mt-0.5 h-5 w-5 text-primary-700" />
              <div>
                <p className="font-semibold">Lokasi</p>
                <p className="text-sm text-neutral-600">Mataram, Nusa Tenggara Barat</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <GraduationCap className="mt-0.5 h-5 w-5 text-primary-700" />
              <div>
                <p className="font-semibold">Fokus Pendidikan</p>
                <p className="text-sm text-neutral-600">Keislaman, akademik, dan pembentukan adab</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <CalendarDays className="mt-0.5 h-5 w-5 text-primary-700" />
              <div>
                <p className="font-semibold">Layanan Portal</p>
                <p className="text-sm text-neutral-600">Akses data administrasi dan keuangan sekolah secara terarah</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="profil" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h3 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-poppins)' }}>Profil Singkat</h3>
          <p className="mt-2 max-w-3xl text-neutral-600">
            SMP IT Anak Soleh Mataram berkomitmen melahirkan generasi berilmu, berakhlak, dan berdaya saing.
            Pembelajaran dirancang untuk menumbuhkan pemahaman diniyah sekaligus kecakapan akademik modern.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft">
            <BookOpen className="mb-3 h-6 w-6 text-primary-700" />
            <h4 className="mb-2 font-bold">Visi Pendidikan</h4>
            <p className="text-sm text-neutral-600">Membentuk peserta didik yang bertakwa, berilmu, dan siap berkontribusi untuk umat serta bangsa.</p>
          </article>
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft">
            <HeartHandshake className="mb-3 h-6 w-6 text-primary-700" />
            <h4 className="mb-2 font-bold">Misi Pembinaan</h4>
            <p className="text-sm text-neutral-600">Menguatkan adab, ibadah, literasi, dan kepemimpinan siswa melalui kegiatan terstruktur dan pembiasaan.</p>
          </article>
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft">
            <UserRound className="mb-3 h-6 w-6 text-primary-700" />
            <h4 className="mb-2 font-bold">Kolaborasi Orang Tua</h4>
            <p className="text-sm text-neutral-600">Komunikasi dan pendampingan dilakukan bersama orang tua agar perkembangan siswa berjalan optimal.</p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-primary-200/70 bg-[linear-gradient(135deg,rgba(126,194,66,0.08),rgba(242,154,46,0.09))] p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-poppins)' }}>Akses Portal Internal Sekolah</h3>
              <p className="mt-2 max-w-2xl text-neutral-700">
                Untuk kebutuhan administrasi resmi, silakan masuk menggunakan akun yang telah diberikan sekolah.
              </p>
            </div>
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 font-semibold text-white transition-all hover:bg-neutral-800"
            >
              <ShieldCheck className="h-4 w-4" />
              {isLoggedIn ? 'Masuk ke Dashboard' : 'Login Portal'}
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <Image src="/logo.jpg" alt="Logo SMP IT Anak Soleh Mataram" fill sizes="36px" className="object-contain p-1" />
            </div>
            <div>
              <p className="font-semibold">SMP IT ANAK SOLEH MATARAM</p>
              <p className="text-sm text-neutral-500">Portal Informasi dan Administrasi Sekolah</p>
            </div>
          </div>
          <p className="text-sm text-neutral-500">© 2026 SMP IT Anak Soleh Mataram</p>
        </div>
      </footer>
    </div>
  );
}
