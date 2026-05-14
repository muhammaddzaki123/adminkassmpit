'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { normalizePaymentAmount } from '@/lib/payment-amount';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft, Building, CheckCircle, Clock, Copy,
  CreditCard, Landmark, Smartphone, AlertTriangle,
} from 'lucide-react';

interface Billing {
  id: string;
  billNumber: string;
  type: string;
  description: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  allowInstallments?: boolean;
  month: number | null;
  year: number | null;
  dueDate: string | null;
}

interface PaymentData {
  id: string;
  paymentNumber: string;
  externalId?: string;
  bankCode?: string;
  amount: number;
  adminFee: number;
  totalPaid: number;
  status: string;
  method: string;
  vaNumber?: string;
  qrCode?: string;
  deeplink?: string;
  expiredAt?: string;
}

const BANK_OPTIONS = [
  { value: 'bca', label: 'BCA' },
  { value: 'bni', label: 'BNI' },
  { value: 'bri', label: 'BRI' },
  { value: 'bsm', label: 'BSI' },
  { value: 'cimb', label: 'CIMB Niaga' },
  { value: 'permata', label: 'Permata' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const getMonthName = (month: number | null) => {
  if (!month) return '-';
  return ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][month - 1] ?? '-';
};

const getBankLabel = (code?: string | null) =>
  BANK_OPTIONS.find((b) => b.value === code)?.label ?? code ?? '-';

const getMethodLabel = (method?: string | null) => {
  if (method === 'VIRTUAL_ACCOUNT') return 'Virtual Account';
  if (method === 'TRANSFER_BANK') return 'Transfer Bank Manual';
  if (method === 'EWALLET') return 'QRIS / E-Wallet';
  return method ?? '-';
};

function ReRegistrationPayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<'method' | 'process' | 'payment' | 'success'>('method');
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'VIRTUAL_ACCOUNT' | 'TRANSFER_BANK' | 'EWALLET' | null>(null);
  const [paymentBankCode, setPaymentBankCode] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchBillings = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/billing/student', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      const unpaid: Billing[] = result.data.billings.filter(
        (b: Billing) => ['BILLED', 'OVERDUE', 'PARTIAL'].includes(b.status)
      );

      const ids = (searchParams.get('billingIds') ?? '')
        .split(',').map((s) => s.trim()).filter(Boolean);

      // Prioritaskan DAFTAR_ULANG; jika ada banyak, pilih yang pertama
      const matched = unpaid.filter((b) => ids.includes(b.id));
      const rereg = matched.find((b) => b.type === 'DAFTAR_ULANG') ?? matched[0] ?? null;
      setSelectedBilling(rereg);
    } catch (err) {
      console.error(err);
      alert('Gagal memuat data tagihan. Silakan kembali dan coba lagi.');
      router.push('/student/re-registration');
    } finally {
      setLoading(false);
    }
  }, [searchParams, router]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/auth/login'); return; }
    const user = JSON.parse(userData);
    if (user.role !== 'STUDENT') { router.push('/auth/login'); return; }
    fetchBillings();
  }, [router, fetchBillings]);

  const adminFee = (() => {
    if (!paymentMethod) return 0;
    const amt = normalizePaymentAmount(paymentAmount || (selectedBilling?.remainingAmount ?? 0));
    if (paymentMethod === 'VIRTUAL_ACCOUNT') return 2500;
    if (paymentMethod === 'EWALLET') return Math.ceil(amt * 0.007);
    return 0;
  })();

  const grandTotal = normalizePaymentAmount(paymentAmount || (selectedBilling?.remainingAmount ?? 0)) + adminFee;

  const handleCreatePayment = async () => {
    if (!paymentMethod || !selectedBilling) return;
    if ((paymentMethod === 'VIRTUAL_ACCOUNT' || paymentMethod === 'TRANSFER_BANK') && !paymentBankCode) {
      alert('Pilih bank tujuan terlebih dahulu'); return;
    }
    const amount = normalizePaymentAmount(paymentAmount || selectedBilling.remainingAmount);
    if (amount <= 0 || amount > selectedBilling.remainingAmount) {
      alert(`Nominal harus antara Rp 1 – ${formatCurrency(selectedBilling.remainingAmount)}`); return;
    }
    if (amount < selectedBilling.remainingAmount && !selectedBilling.allowInstallments) {
      alert('Tagihan ini harus dibayar penuh.'); return;
    }

    setIsProcessing(true);
    setStep('process');
    try {
      const res = await fetchWithAuth('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingId: selectedBilling.id,
          amount,
          method: paymentMethod,
          bankCode: paymentBankCode || null,
          notes: `Pembayaran Daftar Ulang ${selectedBilling.billNumber}`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setPayment(result.data.payment);
      setIsProcessing(false);
      setStep(paymentMethod === 'TRANSFER_BANK' ? 'success' : 'payment');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      alert(msg);
      setStep('method');
      setIsProcessing(false);
    }
  };

  const syncStatus = useCallback(async () => {
    if (!payment?.id) return;
    try {
      const res = await fetchWithAuth('/api/payment/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.id }),
      });
      if (!res.ok) return;
      const result = await res.json();
      if (!result?.success) return;
      const status = result.data.status as string;
      setPayment((prev) => prev ? { ...prev, status } : prev);
      if (status === 'COMPLETED') { await fetchBillings(); setStep('success'); }
    } catch { /* silent */ }
  }, [payment?.id, fetchBillings]);

  useEffect(() => {
    if (step !== 'payment' || !payment?.id || payment.status === 'COMPLETED') return;
    syncStatus();
    const iv = setInterval(syncStatus, 10000);
    return () => clearInterval(iv);
  }, [step, payment?.id, payment?.status, syncStatus]);

  const copy = (text: string) => { navigator.clipboard.writeText(text); alert('Disalin!'); };

  const Layout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block"><StudentSidebar /></div>
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"><StudentSidebar /></div>
        </>
      )}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <StudentHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mt-16">
          <div className="max-w-2xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );

  if (loading) return (
    <Layout>
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        <p className="mt-4 text-neutral-600">Memuat tagihan...</p>
      </div>
    </Layout>
  );

  if (!selectedBilling) return (
    <Layout>
      <Card className="text-center py-12">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-neutral-900">Tidak ada tagihan aktif</h2>
        <p className="text-neutral-600 mt-2">Semua tagihan daftar ulang sudah lunas.</p>
        <Button className="mt-6" onClick={() => router.push('/student/re-registration')}>Kembali</Button>
      </Card>
    </Layout>
  );

  // --- SUCCESS ---
  if (step === 'success') return (
    <Layout>
      <Card className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Pembayaran Berhasil!</h2>
        <p className="text-neutral-600 mb-6">
          {payment?.status === 'COMPLETED'
            ? 'Pembayaran telah dikonfirmasi dan tagihan diperbarui.'
            : 'Silakan selesaikan pembayaran sesuai instruksi.'}
        </p>
        {payment && (
          <div className="bg-neutral-50 rounded-lg p-4 text-left mb-6 space-y-2">
            <div className="flex justify-between"><span className="text-neutral-500">No. Pembayaran</span><span className="font-semibold">{payment.paymentNumber}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Metode</span><span className="font-semibold">{getMethodLabel(payment.method)}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Total Bayar</span><span className="font-bold text-primary-600">{formatCurrency(payment.totalPaid)}</span></div>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <Button variant="primary" onClick={() => router.push('/student/dashboard')}>Dashboard</Button>
          <Button variant="secondary" onClick={() => router.push('/student/history')}>Riwayat</Button>
        </div>
      </Card>
    </Layout>
  );

  // --- WAITING PAYMENT ---
  if (step === 'payment' && payment) return (
    <Layout>
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/student/re-registration')} className="text-neutral-500 hover:text-neutral-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-neutral-900">Menunggu Pembayaran</h1>
      </div>
      <Card>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800">Selesaikan pembayaran Anda</p>
              <p className="text-sm text-blue-700 mt-1">Status akan diperbarui otomatis setelah pembayaran terverifikasi.</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-neutral-50 rounded-lg p-4">
            <div><p className="text-xs text-neutral-500">No. Pembayaran</p><p className="font-mono font-bold">{payment.paymentNumber}</p></div>
            <button onClick={() => copy(payment.paymentNumber)}><Copy className="w-4 h-4 text-primary-600" /></button>
          </div>
          {payment.vaNumber && (
            <div className="flex items-center justify-between bg-neutral-50 rounded-lg p-4">
              <div><p className="text-xs text-neutral-500">Virtual Account {payment.bankCode && `- ${getBankLabel(payment.bankCode)}`}</p><p className="font-mono font-bold text-lg">{payment.vaNumber}</p></div>
              <button onClick={() => copy(payment.vaNumber!)}><Copy className="w-4 h-4 text-primary-600" /></button>
            </div>
          )}
          {payment.qrCode && (
            <a href={payment.qrCode} target="_blank" rel="noreferrer" className="block w-full text-center py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold">
              Buka QR Pembayaran
            </a>
          )}
          {payment.deeplink && (
            <a href={payment.deeplink} target="_blank" rel="noreferrer" className="block w-full text-center py-2.5 rounded-lg border border-primary-300 text-primary-700 hover:bg-primary-50 font-semibold">
              Buka Aplikasi E-Wallet
            </a>
          )}
          {payment.expiredAt && (
            <p className="text-xs text-neutral-500">Berlaku sampai: {new Date(payment.expiredAt).toLocaleString('id-ID')}</p>
          )}
          <div className="bg-primary-600 text-white rounded-lg p-4 mt-4">
            <p className="text-sm opacity-80">Total yang Harus Dibayar</p>
            <p className="text-3xl font-bold">{formatCurrency(payment.totalPaid)}</p>
            {payment.adminFee > 0 && <p className="text-xs opacity-80 mt-1">Termasuk biaya admin {formatCurrency(payment.adminFee)}</p>}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="flex-1" onClick={() => router.push('/student/dashboard')}>Dashboard</Button>
          <Button variant="primary" className="flex-1" onClick={syncStatus}>Refresh Status</Button>
        </div>
      </Card>
    </Layout>
  );

  // --- PROCESSING ---
  if (step === 'process') return (
    <Layout>
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4" />
        <p className="text-lg font-semibold text-neutral-900">Memproses Pembayaran...</p>
        <p className="text-neutral-500 mt-2">Mohon tunggu sebentar</p>
      </div>
    </Layout>
  );

  // --- METHOD SELECTION (default) ---
  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/student/re-registration')} className="text-neutral-500 hover:text-neutral-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Pembayaran Daftar Ulang</h1>
          <p className="text-sm text-neutral-500">Pilih metode dan selesaikan pembayaran</p>
        </div>
      </div>

      {/* Billing summary */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-neutral-900">
                {selectedBilling.type === 'DAFTAR_ULANG' ? 'Daftar Ulang Kenaikan Kelas' : `SPP ${getMonthName(selectedBilling.month)} ${selectedBilling.year}`}
              </h2>
              <Badge variant={selectedBilling.status === 'OVERDUE' ? 'error' : selectedBilling.status === 'PARTIAL' ? 'warning' : 'default'}>
                {selectedBilling.status === 'OVERDUE' ? 'Lewat Jatuh Tempo' : selectedBilling.status === 'PARTIAL' ? 'Cicilan' : 'Belum Bayar'}
              </Badge>
            </div>
            <p className="text-xs text-neutral-500">No. {selectedBilling.billNumber}</p>
            {selectedBilling.dueDate && (
              <p className="text-xs text-neutral-500 mt-0.5">
                Jatuh tempo: {new Date(selectedBilling.dueDate).toLocaleDateString('id-ID')}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-neutral-500">Sisa bayar</p>
            <p className="text-2xl font-bold text-neutral-900">{formatCurrency(selectedBilling.remainingAmount)}</p>
            {selectedBilling.paidAmount > 0 && (
              <p className="text-xs text-green-600">Terbayar: {formatCurrency(selectedBilling.paidAmount)}</p>
            )}
          </div>
        </div>

        {/* Installment input */}
        {selectedBilling.allowInstallments && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nominal Pembayaran (opsional untuk cicilan)</label>
            <CurrencyInput
              value={paymentAmount || ''}
              onValueChange={(amount) => setPaymentAmount(amount ? Number(amount) : 0)}
              max={selectedBilling.remainingAmount}
              placeholder={`Maks. ${formatCurrency(selectedBilling.remainingAmount)}`}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-neutral-100 space-y-1">
          <div className="flex justify-between text-sm"><span className="text-neutral-500">Subtotal</span><span>{formatCurrency(paymentAmount || selectedBilling.remainingAmount)}</span></div>
          {adminFee > 0 && <div className="flex justify-between text-sm"><span className="text-neutral-500">Biaya admin</span><span>{formatCurrency(adminFee)}</span></div>}
          <div className="flex justify-between font-bold text-base pt-1 border-t border-neutral-100">
            <span>Total</span><span className="text-primary-600">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </Card>

      {/* Metode Pembayaran */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-neutral-900">Pilih Metode Pembayaran</h2>
        </div>

        <div className="space-y-3">
          {/* VA */}
          <div
            role="button" tabIndex={0}
            onClick={() => setPaymentMethod('VIRTUAL_ACCOUNT')}
            onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod('VIRTUAL_ACCOUNT')}
            className={`rounded-xl border-2 p-4 cursor-pointer transition ${paymentMethod === 'VIRTUAL_ACCOUNT' ? 'border-primary-600 bg-primary-50' : 'border-neutral-200 hover:border-primary-300'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Virtual Account Bank</p>
                  <p className="text-xs text-neutral-500">Bayar via ATM / m-banking</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">+Rp 2.500</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {BANK_OPTIONS.map((b) => (
                <button key={b.value} type="button"
                  onClick={(e) => { e.stopPropagation(); setPaymentMethod('VIRTUAL_ACCOUNT'); setPaymentBankCode(b.value); }}
                  className={`rounded-lg border px-2 py-1.5 text-sm font-medium transition ${paymentMethod === 'VIRTUAL_ACCOUNT' && paymentBankCode === b.value ? 'border-primary-600 bg-primary-100 text-primary-700' : 'border-neutral-200 text-neutral-600 hover:border-primary-300'}`}
                >{b.label}</button>
              ))}
            </div>
          </div>

          {/* QRIS */}
          <div
            role="button" tabIndex={0}
            onClick={() => { setPaymentMethod('EWALLET'); setPaymentBankCode(''); }}
            onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod('EWALLET')}
            className={`rounded-xl border-2 p-4 cursor-pointer transition ${paymentMethod === 'EWALLET' ? 'border-primary-600 bg-primary-50' : 'border-neutral-200 hover:border-primary-300'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">QRIS</p>
                  <p className="text-xs text-neutral-500">GoPay, DANA, OVO, ShopeePay, dll.</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">+0.7%</span>
            </div>
          </div>

          {/* Transfer Manual */}
          <div
            role="button" tabIndex={0}
            onClick={() => setPaymentMethod('TRANSFER_BANK')}
            onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod('TRANSFER_BANK')}
            className={`rounded-xl border-2 p-4 cursor-pointer transition ${paymentMethod === 'TRANSFER_BANK' ? 'border-primary-600 bg-primary-50' : 'border-neutral-200 hover:border-primary-300'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Transfer Bank Manual</p>
                  <p className="text-xs text-neutral-500">Dikonfirmasi bendahara</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Gratis</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {BANK_OPTIONS.map((b) => (
                <button key={b.value} type="button"
                  onClick={(e) => { e.stopPropagation(); setPaymentMethod('TRANSFER_BANK'); setPaymentBankCode(b.value); }}
                  className={`rounded-lg border px-2 py-1.5 text-sm font-medium transition ${paymentMethod === 'TRANSFER_BANK' && paymentBankCode === b.value ? 'border-primary-600 bg-primary-100 text-primary-700' : 'border-neutral-200 text-neutral-600 hover:border-primary-300'}`}
                >{b.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 rounded p-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">Untuk pembayaran tunai, hubungi bendahara sekolah secara langsung.</p>
        </div>
      </Card>

      <Button
        variant="primary"
        className="w-full"
        disabled={!paymentMethod || isProcessing}
        onClick={handleCreatePayment}
      >
        {isProcessing ? 'Memproses...' : 'Bayar Sekarang'}
      </Button>
    </Layout>
  );
}

export default function ReRegistrationPayPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    }>
      <ReRegistrationPayContent />
    </Suspense>
  );
}
