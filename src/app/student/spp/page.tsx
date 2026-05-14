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
import { CreditCard, Building, Smartphone, CheckCircle, Clock, Copy, ArrowLeft, AlertTriangle, Landmark, Sparkles } from 'lucide-react';

interface PendingPaymentData {
  id: string;
  paymentNumber: string;
  externalId?: string | null;
  amount: number;
  adminFee: number;
  totalPaid: number;
  status: string;
  method: string;
  vaNumber?: string | null;
  qrCode?: string | null;
  deeplink?: string | null;
  expiredAt?: string | null;
}

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
  createdAt: string;
  pendingPayment?: PendingPaymentData | null;
}

function SPPPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'method' | 'process' | 'payment' | 'success'>('select');
  const [billings, setBillings] = useState<Billing[]>([]);
  const [selectedBillings, setSelectedBillings] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'VIRTUAL_ACCOUNT' | 'TRANSFER_BANK' | 'EWALLET' | null>(null);
  const [paymentBankCode, setPaymentBankCode] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [payment, setPayment] = useState<{
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
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBillings = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/billing/student', { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Expected JSON response but got: ' + contentType);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Filter only unpaid and partial billings
        const unpaidBillings = result.data.billings.filter(
          (b: Billing) => ['BILLED', 'OVERDUE', 'PARTIAL'].includes(b.status)
        );
        setBillings(unpaidBillings);

        // Auto-resume if any billing already has a PENDING payment
        // This handles the page-refresh scenario: no duplicate is created
        const billingWithPending = unpaidBillings.find(
          (b: Billing) => b.pendingPayment != null
        );

        if (billingWithPending?.pendingPayment) {
          const pending = billingWithPending.pendingPayment;
          setPayment({
            id: pending.id,
            paymentNumber: pending.paymentNumber,
            externalId: pending.externalId ?? undefined,
            bankCode: undefined,
            amount: pending.amount,
            adminFee: pending.adminFee,
            totalPaid: pending.totalPaid,
            status: pending.status,
            method: pending.method,
            vaNumber: pending.vaNumber ?? undefined,
            qrCode: pending.qrCode ?? undefined,
            deeplink: pending.deeplink ?? undefined,
            expiredAt: pending.expiredAt ?? undefined,
          });
          // Go directly to the waiting-for-payment screen
          if (pending.method === 'VIRTUAL_ACCOUNT' || pending.method === 'EWALLET') {
            setStep('payment');
          } else {
            setStep('success');
          }
          return;
        }

        // Auto-select billing from URL if provided
        const billingIdsParam = searchParams.get('billingIds');
        const billingId = searchParams.get('billingId');

        if (billingIdsParam) {
          const requestedIds = billingIdsParam
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean);
          const matchedIds = unpaidBillings
            .filter((billing: Billing) => requestedIds.includes(billing.id))
            .map((billing: Billing) => billing.id);

          if (matchedIds.length > 0) {
            setSelectedBillings(matchedIds);
          }
        } else if (billingId && unpaidBillings.find((b: Billing) => b.id === billingId)) {
          setSelectedBillings([billingId]);
        }
      }
    } catch (error) {
      console.error('Error fetching billings:', error);
      alert('Gagal memuat data tagihan. Silakan refresh halaman.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'STUDENT') {
      router.push('/auth/login');
      return;
    }

    fetchBillings();
  }, [router, fetchBillings]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month: number | null): string => {
    if (!month) return '-';
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return months[month - 1];
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIAL':
        return 'warning';
      case 'OVERDUE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Lunas';
      case 'PARTIAL':
        return 'Cicilan';
      case 'OVERDUE':
        return 'Jatuh Tempo';
      case 'BILLED':
        return 'Belum Bayar';
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method?: string | null) => {
    switch (method) {
      case 'VIRTUAL_ACCOUNT':
        return 'Virtual Account';
      case 'TRANSFER_BANK':
        return 'Transfer Bank Manual';
      case 'EWALLET':
        return 'QRIS / E-Wallet';
      default:
        return method || '-';
    }
  };

  const getPaymentMethodHint = (method?: string | null) => {
    switch (method) {
      case 'VIRTUAL_ACCOUNT':
        return 'Bayar lewat nomor VA bank yang ditampilkan sistem';
      case 'TRANSFER_BANK':
        return 'Transfer manual sesuai instruksi yang muncul';
      case 'EWALLET':
        return 'Scan QR atau buka aplikasi e-wallet';
      default:
        return '';
    }
  };

  const getBankLabel = (bankCode?: string | null) => {
    switch (bankCode) {
      case 'bca':
        return 'BCA';
      case 'bni':
        return 'BNI';
      case 'bri':
        return 'BRI';
      case 'bsm':
        return 'BSI';
      case 'cimb':
        return 'CIMB Niaga';
      case 'permata':
        return 'Permata';
      default:
        return bankCode || '-';
    }
  };

  const bankOptions = [
    { value: 'bca', label: 'BCA' },
    { value: 'bni', label: 'BNI' },
    { value: 'bri', label: 'BRI' },
    { value: 'bsm', label: 'BSI' },
    { value: 'cimb', label: 'CIMB Niaga' },
    { value: 'permata', label: 'Permata' },
  ];

  const selectPaymentMethod = (method: 'VIRTUAL_ACCOUNT' | 'TRANSFER_BANK' | 'EWALLET') => {
    setPaymentMethod(method);
    if (method === 'EWALLET') {
      setPaymentBankCode('');
    }
  };

  const toggleBillingSelection = (billingId: string) => {
    if (selectedBillings.includes(billingId)) {
      setSelectedBillings(selectedBillings.filter(id => id !== billingId));
    } else {
      setSelectedBillings([...selectedBillings, billingId]);
    }
  };

  const getTotalAmount = () => {
    return billings
      .filter(b => selectedBillings.includes(b.id))
      .reduce((sum, billing) => sum + billing.remainingAmount, 0);
  };

  const getAdminFee = () => {
    if (!paymentMethod) return 0;
    const amount = paymentAmount || getTotalAmount();
    return paymentMethod === 'VIRTUAL_ACCOUNT' ? 2500 : 
           paymentMethod === 'EWALLET' ? Math.ceil(amount * 0.007) : 0;
  };

  const handleProceedToMethod = () => {
    if (selectedBillings.length === 0) {
      alert('Pilih minimal 1 tagihan');
      return;
    }
    // Extra guard: prevent proceeding if any selected billing has a pending payment
    const hasPending = selectedBillings.some((id) =>
      billings.find((b) => b.id === id)?.pendingPayment != null
    );
    if (hasPending) {
      alert('Tagihan ini sudah memiliki pembayaran yang menunggu konfirmasi. Silakan selesaikan pembayaran sebelumnya terlebih dahulu.');
      return;
    }
    setStep('method');
  };

  const handleCreatePayment = async () => {
    if (!paymentMethod || selectedBillings.length === 0) return;

    // Validate payment amount
    if (selectedBillings.length > 1) {
      alert('Untuk cicilan, hanya bisa pilih 1 tagihan');
      return;
    }

    const billing = billings.find(b => b.id === selectedBillings[0]);
    if (!billing) return;

    if ((paymentMethod === 'VIRTUAL_ACCOUNT' || paymentMethod === 'TRANSFER_BANK') && !paymentBankCode) {
      alert('Pilih bank tujuan terlebih dahulu');
      return;
    }

    const amount = normalizePaymentAmount(paymentAmount || billing.remainingAmount);
    if (amount <= 0 || amount > billing.remainingAmount) {
      alert(`Nominal pembayaran harus antara Rp 1 - ${formatCurrency(billing.remainingAmount)}`);
      return;
    }

    if (amount < billing.remainingAmount && !billing.allowInstallments) {
      alert('Tagihan ini tidak mengizinkan cicilan. Harus dibayar penuh.');
      return;
    }

    setIsProcessing(true);
    setStep('process');

    try {
      const response = await fetchWithAuth('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingId: billing.id,
          amount: amount,
          method: paymentMethod,
          bankCode: paymentBankCode || null,
          notes: `Pembayaran ${billing.type} ${billing.month ? getMonthName(billing.month) : billing.billNumber}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Expected JSON response but got: ' + contentType);
      }

      const result = await response.json();

      if (result.success) {
        setPayment(result.data.payment);
        setIsProcessing(false);
        
        if (paymentMethod === 'VIRTUAL_ACCOUNT' || paymentMethod === 'EWALLET') {
          setStep('payment');
        } else {
          setStep('success');
        }
      } else {
        throw new Error(result.error || 'Payment creation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pembayaran';
      alert(errorMessage);
      setStep('method');
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Berhasil disalin!');
  };

  const syncPaymentStatus = useCallback(async () => {
    if (!payment?.id) return;

    try {
      const response = await fetchWithAuth('/api/payment/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.id }),
      });

      if (!response.ok) {
        return;
      }

      const result = await response.json();
      if (!result?.success || !result?.data?.status) {
        return;
      }

      const latestStatus = result.data.status as string;
      setPayment((prev) => (prev ? { ...prev, status: latestStatus } : prev));

      if (latestStatus === 'COMPLETED') {
        await fetchBillings();
        setStep('success');
      }
    } catch (error) {
      console.warn('Failed to sync payment status:', error);
    }
  }, [payment?.id, fetchBillings]);

  useEffect(() => {
    if (step !== 'payment' || !payment?.id || payment.status === 'COMPLETED') {
      return;
    }

    syncPaymentStatus();

    const interval = setInterval(() => {
      syncPaymentStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [step, payment?.id, payment?.status, syncPaymentStatus]);

  // Success screen
  if (step === 'success') {
    return (
      <div className="flex min-h-screen bg-neutral-50">
        <div className="hidden lg:block">
          <StudentSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
          <StudentHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mt-16">
            <div className="max-w-2xl mx-auto">
              <Card className="text-center py-12">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Pembayaran Berhasil Dibuat!</h2>
                <p className="text-neutral-600 mb-6">
                  {payment?.status === 'COMPLETED' 
                    ? 'Pembayaran Anda telah dikonfirmasi dan tagihan telah diperbarui.'
                    : 'Silakan selesaikan pembayaran melalui metode yang Anda pilih.'
                  }
                </p>
                
                {payment && (
                  <div className="bg-neutral-50 rounded-lg p-6 mb-6 text-left">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-neutral-600">Nomor Pembayaran</p>
                        <p className="font-semibold">{payment.paymentNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-600">Metode</p>
                        <p className="font-semibold">{getPaymentMethodLabel(payment.method)}</p>
                        <p className="text-xs text-neutral-500 mt-1">{getPaymentMethodHint(payment.method)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-600">Nominal</p>
                        <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-600">Total Bayar</p>
                        <p className="font-semibold text-primary-600">{formatCurrency(payment.totalPaid)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <Button onClick={() => router.push('/student/dashboard')} variant="primary">
                    Kembali ke Dashboard
                  </Button>
                  <Button onClick={() => router.push('/student/history')} variant="secondary">
                    Lihat Riwayat
                  </Button>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Payment waiting screen (for VA/E-wallet)
  if (step === 'payment' && payment) {
    return (
      <div className="flex min-h-screen bg-neutral-50">
        <div className="hidden lg:block">
          <StudentSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
          <StudentHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mt-16">
            <div className="max-w-2xl mx-auto">
              <Card>
                <h2 className="text-xl font-bold text-neutral-900 mb-6">Menunggu Pembayaran</h2>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-800">Pembayaran Belum Selesai</p>
                      <p className="text-sm text-blue-700 mt-1">
                        {payment.method ? `${getPaymentMethodLabel(payment.method)} dipilih. ` : ''}
                        Silakan ikuti instruksi sesuai metode dan tunggu konfirmasi otomatis dari sistem.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-lg p-6 mb-6">
                  <p className="text-sm text-neutral-600 mb-2">Nomor Pembayaran</p>
                  <div className="flex items-center justify-between bg-white rounded-lg p-4 mb-4">
                    <p className="font-mono font-bold text-lg">{payment.paymentNumber}</p>
                    <button onClick={() => copyToClipboard(payment.paymentNumber)} className="text-primary-600">
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>

                    {payment.bankCode && (
                      <>
                        <p className="text-sm text-neutral-600 mb-2">Bank</p>
                        <div className="flex items-center justify-between bg-white rounded-lg p-4 mb-4">
                          <p className="font-semibold text-neutral-900">{getBankLabel(payment.bankCode)}</p>
                        </div>
                      </>
                    )}

                  {payment.externalId && (
                    <>
                      <p className="text-sm text-neutral-600 mb-2">Order ID Midtrans</p>
                      <div className="flex items-center justify-between bg-white rounded-lg p-4 mb-4">
                        <p className="font-mono text-sm font-semibold break-all">{payment.externalId}</p>
                        <button onClick={() => copyToClipboard(payment.externalId || '')} className="text-primary-600">
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}

                  {payment.vaNumber && (
                    <>
                      <p className="text-sm text-neutral-600 mb-2">Virtual Account / Nomor Bayar{payment.bankCode ? ` - ${getBankLabel(payment.bankCode)}` : ''}</p>
                      <div className="flex items-center justify-between bg-white rounded-lg p-4 mb-4">
                        <p className="font-mono text-base font-bold">{payment.vaNumber}</p>
                        <button onClick={() => copyToClipboard(payment.vaNumber || '')} className="text-primary-600">
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}

                  {(payment.qrCode || payment.deeplink) && (
                    <div className="bg-white rounded-lg p-4 mb-4 space-y-3">
                      <p className="text-sm font-semibold text-neutral-900">Aksi Pembayaran - {getPaymentMethodLabel(payment.method)}</p>
                      <p className="text-xs text-neutral-500">QRIS bisa dibayar lewat GoPay, DANA, OVO, ShopeePay, dan aplikasi lain yang mendukung QRIS.</p>
                      {payment.qrCode && (
                        <a
                          href={payment.qrCode}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center w-full rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2.5"
                        >
                          Buka QR Pembayaran
                        </a>
                      )}
                      {payment.deeplink && (
                        <a
                          href={payment.deeplink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center w-full rounded-lg border border-primary-300 text-primary-700 hover:bg-primary-50 font-semibold px-4 py-2.5"
                        >
                          Buka Aplikasi E-Wallet
                        </a>
                      )}
                    </div>
                  )}

                  {payment.expiredAt && (
                    <p className="text-xs text-neutral-500 mb-4">
                      Berlaku sampai: {new Date(payment.expiredAt).toLocaleString('id-ID')}
                    </p>
                  )}

                  <p className="text-sm text-neutral-600 mb-2">Total yang Harus Dibayar</p>
                  <div className="bg-primary-600 text-white rounded-lg p-4">
                    <p className="text-3xl font-bold">{formatCurrency(payment.totalPaid)}</p>
                    <p className="text-sm opacity-90 mt-1">
                      Termasuk biaya admin {formatCurrency(payment.adminFee)}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-neutral-600 mb-4">
                  Status pembayaran akan diperbarui secara otomatis setelah pembayaran berhasil diverifikasi.
                </p>

                <div className="flex gap-3">
                  <Button onClick={() => router.push('/student/dashboard')} variant="secondary" className="flex-1">
                    Kembali ke Dashboard
                  </Button>
                  <Button onClick={syncPaymentStatus} variant="primary" className="flex-1">
                    Refresh Status
                  </Button>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Method selection screen
  if (step === 'method') {
    const total = getTotalAmount();
    const adminFee = getAdminFee();
    const grandTotal = total + adminFee;
    const selectedBilling = selectedBillings.length === 1
      ? billings.find((billing) => billing.id === selectedBillings[0]) || null
      : null;

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
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setStep('select')} className="text-neutral-600 hover:text-neutral-900">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-neutral-900">Pilih Metode Pembayaran</h1>
              </div>

              <Card className="bg-linear-to-r from-white via-primary-50 to-accent-50 border-primary-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Transaksi Aman</p>
                    <p className="text-xs text-neutral-600">Pilih kanal pembayaran resmi agar status tagihan terverifikasi otomatis.</p>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold text-neutral-900 mb-4">Ringkasan Pembayaran</h3>
                <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(total)}</span>
                  </div>
                  {adminFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Biaya Admin</span>
                      <span>{formatCurrency(adminFee)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold text-neutral-900">Total</span>
                    <span className="font-bold text-primary-600 text-xl">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                {/* Payment amount input for installment */}
                {selectedBilling?.allowInstallments && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Nominal Pembayaran (Opsional - untuk cicilan)
                    </label>
                    <CurrencyInput
                      value={paymentAmount || ''}
                      onValueChange={(amount) => setPaymentAmount(amount ? Number(amount) : 0)}
                      max={total}
                      placeholder="Masukkan nominal atau kosongkan untuk bayar penuh"
                      className="rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Sisa: {formatCurrency(total)}
                    </p>
                  </div>
                )}

                {selectedBilling && !selectedBilling.allowInstallments && (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    Tagihan ini harus dibayar penuh. Opsi cicilan hanya tersedia untuk siswa tertentu.
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="font-semibold text-neutral-900 mb-4">Metode Pembayaran</h3>
                <div className="space-y-4">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => selectPaymentMethod('VIRTUAL_ACCOUNT')}
                    onKeyDown={(e) => e.key === 'Enter' && selectPaymentMethod('VIRTUAL_ACCOUNT')}
                    className={`rounded-xl border-2 p-5 transition cursor-pointer ${
                      paymentMethod === 'VIRTUAL_ACCOUNT'
                        ? 'border-primary-600 bg-primary-50 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-neutral-900">VA Bank</p>
                          <p className="text-sm text-neutral-600">Pilih bank untuk membuat nomor Virtual Account.</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">+Rp 2.500</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                      {bankOptions.map((option) => (
                        <button
                          key={`va-${option.value}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectPaymentMethod('VIRTUAL_ACCOUNT');
                            setPaymentBankCode(option.value);
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            paymentMethod === 'VIRTUAL_ACCOUNT' && paymentBankCode === option.value
                              ? 'border-primary-600 bg-primary-100 text-primary-700'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => selectPaymentMethod('EWALLET')}
                    onKeyDown={(e) => e.key === 'Enter' && selectPaymentMethod('EWALLET')}
                    className={`rounded-xl border-2 p-5 transition cursor-pointer ${
                      paymentMethod === 'EWALLET'
                        ? 'border-primary-600 bg-primary-50 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-neutral-900">QRIS</p>
                          <p className="text-sm text-neutral-600">Satu QR bisa dibayar lewat GoPay, DANA, OVO, ShopeePay, dan aplikasi lain yang mendukung QRIS.</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">+0.7%</span>
                    </div>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => selectPaymentMethod('TRANSFER_BANK')}
                    onKeyDown={(e) => e.key === 'Enter' && selectPaymentMethod('TRANSFER_BANK')}
                    className={`rounded-xl border-2 p-5 transition cursor-pointer ${
                      paymentMethod === 'TRANSFER_BANK'
                        ? 'border-primary-600 bg-primary-50 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-neutral-900">Transfer Bank Manual</p>
                          <p className="text-sm text-neutral-600">Pilih bank tujuan transfer manual yang tersedia.</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Gratis</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                      {bankOptions.map((option) => (
                        <button
                          key={`tf-${option.value}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectPaymentMethod('TRANSFER_BANK');
                            setPaymentBankCode(option.value);
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            paymentMethod === 'TRANSFER_BANK' && paymentBankCode === option.value
                              ? 'border-primary-600 bg-primary-100 text-primary-700'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500">
                    Bank yang tidak muncul berarti belum tersedia di integrasi Midtrans saat ini.
                  </p>

                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        Untuk pembayaran tunai, silakan hubungi bendahara sekolah secara langsung.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Button
                onClick={handleCreatePayment}
                disabled={!paymentMethod || isProcessing}
                variant="primary"
                className="w-full"
              >
                {isProcessing ? 'Memproses...' : 'Lanjutkan Pembayaran'}
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Billing selection screen (default)
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
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-linear-to-r from-white via-primary-50 to-accent-50 border-primary-100 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 text-primary-800 px-3 py-1 text-xs font-semibold mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    Portal Pembayaran Siswa
                  </div>
                  <h1 className="text-3xl font-bold text-neutral-900">Pembayaran SPP</h1>
                  <p className="text-neutral-700 mt-1">Pilih tagihan yang ingin dibayar dan lanjutkan ke metode pembayaran resmi.</p>
                </div>
                <div className="rounded-xl border border-primary-200 bg-white/80 px-4 py-3 min-w-[220px]">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-500 mb-1">Tagihan Aktif</p>
                  <p className="text-2xl font-bold text-neutral-900">{billings.length}</p>
                  <p className="text-xs text-neutral-600">Tagihan belum lunas tersedia untuk dipilih</p>
                </div>
              </div>
            </Card>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-neutral-600">Memuat tagihan...</p>
              </div>
            ) : billings.length === 0 ? (
              <Card className="text-center py-12 border-dashed border-neutral-200 bg-white">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Tidak Ada Tagihan Aktif</h3>
                <p className="text-neutral-600 mt-2 max-w-lg mx-auto">
                  Akun ini belum memiliki tagihan yang menunggu pembayaran. Jika sekolah membuat tagihan baru, halaman ini akan menampilkannya secara otomatis.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="primary" onClick={() => router.push('/student/dashboard')}>
                    Kembali ke Dashboard
                  </Button>
                  <Button variant="secondary" onClick={fetchBillings}>
                    Refresh Data
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                {billings.map((billing) => {
                  const hasPendingPayment = billing.pendingPayment != null;
                  const isSelected = selectedBillings.includes(billing.id);

                  if (hasPendingPayment) {
                    // Show a special "resume payment" card – cannot be re-selected
                    return (
                      <Card
                        key={billing.id}
                        className="border-2 border-yellow-400 bg-yellow-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-4">
                            <div className="mt-1">
                              <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-neutral-900">{billing.type}</p>
                                <Badge variant="warning">Menunggu Pembayaran</Badge>
                              </div>
                              <p className="text-sm text-neutral-600">
                                {billing.month && billing.year ? `${getMonthName(billing.month)} ${billing.year}` : billing.billNumber}
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                Pembayaran sebelumnya belum selesai. Klik &quot;Lanjutkan&quot; untuk melanjutkan.
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <p className="font-bold text-lg text-neutral-900">
                              {formatCurrency(billing.remainingAmount)}
                            </p>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                const pending = billing.pendingPayment!;
                                setPayment({
                                  id: pending.id,
                                  paymentNumber: pending.paymentNumber,
                                  externalId: pending.externalId ?? undefined,
                                  bankCode: undefined,
                                  amount: pending.amount,
                                  adminFee: pending.adminFee,
                                  totalPaid: pending.totalPaid,
                                  status: pending.status,
                                  method: pending.method,
                                  vaNumber: pending.vaNumber ?? undefined,
                                  qrCode: pending.qrCode ?? undefined,
                                  deeplink: pending.deeplink ?? undefined,
                                  expiredAt: pending.expiredAt ?? undefined,
                                });
                                if (pending.method === 'VIRTUAL_ACCOUNT' || pending.method === 'EWALLET') {
                                  setStep('payment');
                                } else {
                                  setStep('success');
                                }
                              }}
                            >
                              Lanjutkan
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  }

                  return (
                    <Card
                      key={billing.id}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'border-2 border-primary-600 bg-primary-50'
                          : 'border-2 border-transparent hover:border-primary-300'
                      }`}
                      onClick={() => toggleBillingSelection(billing.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-1 w-5 h-5 text-primary-600"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-neutral-900">{billing.type}</p>
                              <Badge variant={getBadgeVariant(billing.status)}>
                                {getStatusText(billing.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-neutral-600">
                              {billing.month && billing.year ? `${getMonthName(billing.month)} ${billing.year}` : billing.billNumber}
                            </p>
                            {billing.dueDate && billing.status !== 'PAID' && (
                              <p className="text-xs text-neutral-500 mt-1">
                                Jatuh tempo: {new Date(billing.dueDate).toLocaleDateString('id-ID')}
                              </p>
                            )}
                            {billing.paidAmount > 0 && (
                              <p className="text-xs text-green-600 mt-1">
                                Terbayar: {formatCurrency(billing.paidAmount)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-neutral-900">
                            {formatCurrency(billing.remainingAmount)}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Dari {formatCurrency(billing.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                </div>

                {selectedBillings.length > 0 && (
                  <Card className="sticky bottom-4 bg-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-neutral-600">Total yang Dipilih</p>
                        <p className="text-2xl font-bold text-primary-600">{formatCurrency(getTotalAmount())}</p>
                        <p className="text-xs text-neutral-500">{selectedBillings.length} tagihan</p>
                      </div>
                      <Button onClick={handleProceedToMethod} variant="primary">
                        Bayar Sekarang
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SPPPaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SPPPaymentContent />
    </Suspense>
  );
}
