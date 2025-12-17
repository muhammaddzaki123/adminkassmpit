'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreditCard, Building, Smartphone, CheckCircle, Clock, Copy, ArrowLeft, AlertTriangle } from 'lucide-react';

interface Billing {
  id: string;
  billNumber: string;
  type: string;
  description: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  month: number | null;
  year: number | null;
  dueDate: string | null;
  createdAt: string;
}

function SPPPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'method' | 'process' | 'payment' | 'success'>('select');
  const [billings, setBillings] = useState<Billing[]>([]);
  const [selectedBillings, setSelectedBillings] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'VIRTUAL_ACCOUNT' | 'TRANSFER_BANK' | 'EWALLET' | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [payment, setPayment] = useState<{
    id: string;
    paymentNumber: string;
    amount: number;
    adminFee: number;
    totalPaid: number;
    status: string;
    method: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBillings = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/student');
      const result = await response.json();
      
      if (result.success) {
        // Filter only unpaid and partial billings
        const unpaidBillings = result.data.billings.filter(
          (b: Billing) => ['BILLED', 'OVERDUE', 'PARTIAL'].includes(b.status)
        );
        setBillings(unpaidBillings);
        
        // Auto-select billing from URL if provided
        const billingId = searchParams.get('billingId');
        if (billingId && unpaidBillings.find((b: Billing) => b.id === billingId)) {
          setSelectedBillings([billingId]);
        }
      }
    } catch (error) {
      console.error('Error fetching billings:', error);
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

    const amount = paymentAmount || billing.remainingAmount;
    if (amount <= 0 || amount > billing.remainingAmount) {
      alert(`Nominal pembayaran harus antara Rp 1 - ${formatCurrency(billing.remainingAmount)}`);
      return;
    }

    setIsProcessing(true);
    setStep('process');

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingId: billing.id,
          amount: amount,
          method: paymentMethod,
          notes: `Pembayaran ${billing.type} ${billing.month ? getMonthName(billing.month) : billing.billNumber}`,
        }),
      });

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
      alert('Terjadi kesalahan saat memproses pembayaran');
      setStep('method');
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Berhasil disalin!');
  };

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
                        <p className="font-semibold">{payment.method}</p>
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
                        Silakan transfer sesuai nominal dan tunggu konfirmasi otomatis dari sistem.
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
                  <Button onClick={fetchBillings} variant="primary" className="flex-1">
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

  // Processing screen
  if (step === 'process') {
    return (
      <div className="flex min-h-screen bg-neutral-50">
        <div className="hidden lg:block">
          <StudentSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
          <StudentHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
          <main className="flex-1 flex items-center justify-center p-4 md:p-6 lg:p-8 mt-16">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4"></div>
              <p className="text-lg font-semibold text-neutral-900">Memproses Pembayaran...</p>
              <p className="text-neutral-600 mt-2">Mohon tunggu sebentar</p>
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
                {selectedBillings.length === 1 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Nominal Pembayaran (Opsional - untuk cicilan)
                    </label>
                    <input
                      type="number"
                      placeholder="Masukkan nominal atau kosongkan untuk bayar penuh"
                      value={paymentAmount || ''}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Sisa: {formatCurrency(total)}
                    </p>
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="font-semibold text-neutral-900 mb-4">Metode Pembayaran</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setPaymentMethod('VIRTUAL_ACCOUNT')}
                    className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg transition ${
                      paymentMethod === 'VIRTUAL_ACCOUNT'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                  >
                    <Building className="w-6 h-6 text-primary-600" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-neutral-900">Virtual Account</p>
                      <p className="text-sm text-neutral-600">Transfer via VA Bank</p>
                    </div>
                    <p className="text-sm text-neutral-600">+Rp 2.500</p>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('EWALLET')}
                    className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg transition ${
                      paymentMethod === 'EWALLET'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                  >
                    <Smartphone className="w-6 h-6 text-primary-600" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-neutral-900">E-Wallet</p>
                      <p className="text-sm text-neutral-600">OVO, GoPay, DANA</p>
                    </div>
                    <p className="text-sm text-neutral-600">+0.7%</p>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('TRANSFER_BANK')}
                    className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg transition ${
                      paymentMethod === 'TRANSFER_BANK'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-primary-600" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-neutral-900">Transfer Bank</p>
                      <p className="text-sm text-neutral-600">Transfer manual</p>
                    </div>
                    <p className="text-sm text-green-600">Gratis</p>
                  </button>

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
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Pembayaran SPP</h1>
              <p className="text-neutral-600 mt-1">Pilih tagihan yang ingin dibayar</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-neutral-600">Memuat tagihan...</p>
              </div>
            ) : billings.length === 0 ? (
              <Card className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900">Tidak Ada Tagihan</h3>
                <p className="text-neutral-600 mt-2">Semua tagihan Anda sudah lunas!</p>
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                  {billings.map((billing) => (
                    <Card
                      key={billing.id}
                      className={`cursor-pointer transition ${
                        selectedBillings.includes(billing.id)
                          ? 'border-2 border-primary-600 bg-primary-50'
                          : 'border-2 border-transparent hover:border-primary-300'
                      }`}
                      onClick={() => toggleBillingSelection(billing.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={selectedBillings.includes(billing.id)}
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
                  ))}
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
