'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreditCard, Building, Smartphone, CheckCircle, Clock, Copy, ArrowLeft } from 'lucide-react';

interface SPPBill {
  bulan: string;
  tahun: number;
  nominal: number;
  status: 'PAID' | 'UNPAID' | 'PENDING';
  dueDate: string;
}

export default function SPPPaymentPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'method' | 'process' | 'success'>('select');
  const [selectedBills, setSelectedBills] = useState<SPPBill[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'VIRTUAL_ACCOUNT' | 'TRANSFER_BANK' | 'EWALLET' | null>(null);
  const [transaction, setTransaction] = useState<{
    id: string;
    externalId: string; 
    vaNumber?: string; 
    amount: number;
    adminFee: number;
    totalAmount: number; 
    expiredAt?: string
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const bills: SPPBill[] = [
    { bulan: 'Februari', tahun: 2025, nominal: 500000, status: 'UNPAID', dueDate: '10 Feb 2025' },
    { bulan: 'Maret', tahun: 2025, nominal: 500000, status: 'UNPAID', dueDate: '10 Mar 2025' },
    { bulan: 'April', tahun: 2025, nominal: 500000, status: 'UNPAID', dueDate: '10 Apr 2025' },
  ];

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
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const toggleBillSelection = (bill: SPPBill) => {
    if (selectedBills.find(b => b.bulan === bill.bulan)) {
      setSelectedBills(selectedBills.filter(b => b.bulan !== bill.bulan));
    } else {
      setSelectedBills([...selectedBills, bill]);
    }
  };

  const getTotalAmount = () => {
    return selectedBills.reduce((sum, bill) => sum + bill.nominal, 0);
  };

  const getAdminFee = () => {
    if (!paymentMethod) return 0;
    return paymentMethod === 'VIRTUAL_ACCOUNT' ? 4000 : 
           paymentMethod === 'EWALLET' ? 2500 : 0;
  };

  const handleProceedToPayment = async () => {
    if (!paymentMethod || selectedBills.length === 0) return;

    setIsProcessing(true);
    setStep('process');

    try {
      // Call payment API
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: 'student-123',
          paymentType: 'SPP',
          amount: getTotalAmount(),
          paymentMethod,
          description: `Pembayaran SPP ${selectedBills.map(b => b.bulan).join(', ')} ${selectedBills[0].tahun}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTransaction(result.data);
        setIsProcessing(false);
        
        if (paymentMethod === 'VIRTUAL_ACCOUNT') {
          // Show VA number and wait for webhook callback
          setStep('payment');
        } else {
          // For other methods, redirect to payment URL or show instructions
          // In real implementation, payment gateway would handle this
          setStep('payment');
        }
      } else {
        throw new Error(result.message || 'Payment creation failed');
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
    alert('Nomor berhasil disalin!');
  };

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
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Pembayaran Berhasil!</h2>
                <p className="text-neutral-600 mb-6">
                  Pembayaran SPP Anda telah berhasil diproses
                </p>
                <div className="bg-neutral-50 rounded-lg p-6 mb-6 text-left">
                  <div className="flex justify-between mb-2">
                    <span className="text-neutral-600">ID Transaksi</span>
                    <span className="font-medium">{transaction?.id}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-neutral-600">Total Dibayar</span>
                    <span className="font-bold text-lg">{formatCurrency(transaction?.totalAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Waktu</span>
                    <span>{new Date().toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => router.push('/student/history')}>
                    Lihat Riwayat
                  </Button>
                  <Button onClick={() => router.push('/student/dashboard')}>
                    Kembali ke Dashboard
                  </Button>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (step === 'process' && paymentMethod === 'VIRTUAL_ACCOUNT' && transaction && !isProcessing) {
    return (
      <div className="flex min-h-screen bg-neutral-50">
        <div className="hidden lg:block">
          <StudentSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
          <StudentHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mt-16">
            <div className="max-w-2xl mx-auto space-y-6">
              <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setStep('method')}>
                Kembali
              </Button>

              <Card>
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="w-10 h-10 text-yellow-600" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900 mb-2">Menunggu Pembayaran</h2>
                  <p className="text-neutral-600">Silakan transfer ke nomor Virtual Account berikut</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <p className="text-sm text-neutral-600 mb-2">Nomor Virtual Account</p>
                  <div className="flex items-center justify-between bg-white p-4 rounded-lg">
                    <span className="text-2xl font-bold text-neutral-900 tracking-wider">
                      {transaction.vaNumber}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Copy className="w-4 h-4" />}
                      onClick={() => transaction.vaNumber && copyToClipboard(transaction.vaNumber)}
                    >
                      Salin
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Tagihan</span>
                    <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Biaya Admin</span>
                    <span className="font-medium">{formatCurrency(transaction.adminFee)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold text-neutral-900">Total Pembayaran</span>
                    <span className="font-bold text-lg text-primary-600">{formatCurrency(transaction.totalAmount)}</span>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Penting!</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Bayar sesuai dengan jumlah total yang tertera</li>
                    <li>• Pembayaran akan otomatis terverifikasi</li>
                    <li>• Berlaku hingga: {transaction.expiredAt && new Date(transaction.expiredAt).toLocaleString('id-ID')}</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-neutral-900 mb-3">Cara Pembayaran:</p>
                  <div className="text-sm text-neutral-600 space-y-2">
                    <p>1. Buka aplikasi mobile banking atau internet banking Anda</p>
                    <p>2. Pilih menu Transfer / Bayar</p>
                    <p>3. Pilih Virtual Account</p>
                    <p>4. Masukkan nomor Virtual Account di atas</p>
                    <p>5. Ikuti instruksi untuk menyelesaikan pembayaran</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button fullWidth variant="outline" onClick={() => router.push('/student/history')}>
                    Cek Status Pembayaran
                  </Button>
                  <Button fullWidth onClick={() => setStep('success')}>
                    Saya Sudah Bayar
                  </Button>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex min-h-screen bg-neutral-50 items-center justify-center">
        <Card className="text-center p-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-neutral-900">Memproses Pembayaran...</p>
          <p className="text-sm text-neutral-600 mt-2">Mohon tunggu sebentar</p>
        </Card>
      </div>
    );
  }

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
            {step === 'select' && (
              <>
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900">Pembayaran SPP</h1>
                  <p className="text-neutral-600 mt-1">Pilih bulan SPP yang ingin dibayar</p>
                </div>

                <Card>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-4">Tagihan SPP</h2>
                  <div className="space-y-3">
                    {bills.map((bill) => (
                      <div
                        key={`${bill.bulan}-${bill.tahun}`}
                        onClick={() => bill.status === 'UNPAID' && toggleBillSelection(bill)}
                        className={`p-4 border-2 rounded-lg transition cursor-pointer ${
                          selectedBills.find(b => b.bulan === bill.bulan)
                            ? 'border-primary-500 bg-primary-50'
                            : bill.status === 'UNPAID'
                            ? 'border-neutral-200 hover:border-primary-300'
                            : 'border-neutral-200 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={!!selectedBills.find(b => b.bulan === bill.bulan)}
                              onChange={() => {}}
                              disabled={bill.status !== 'UNPAID'}
                              className="w-5 h-5 text-primary-600 border-neutral-300 rounded"
                            />
                            <div>
                              <p className="font-medium text-neutral-900">
                                SPP {bill.bulan} {bill.tahun}
                              </p>
                              <p className="text-sm text-neutral-600">Jatuh tempo: {bill.dueDate}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-neutral-900">{formatCurrency(bill.nominal)}</p>
                            <Badge variant={bill.status === 'PAID' ? 'success' : 'warning'}>
                              {bill.status === 'PAID' ? 'Lunas' : 'Belum Bayar'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {selectedBills.length > 0 && (
                  <Card className="bg-primary-50 border-primary-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-neutral-600">Total yang harus dibayar</p>
                        <p className="text-2xl font-bold text-primary-600">{formatCurrency(getTotalAmount())}</p>
                        <p className="text-sm text-neutral-600 mt-1">
                          {selectedBills.length} bulan dipilih
                        </p>
                      </div>
                      <Button onClick={() => setStep('method')}>
                        Lanjut Pembayaran
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            )}

            {step === 'method' && (
              <>
                <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setStep('select')}>
                  Kembali
                </Button>

                <div>
                  <h1 className="text-3xl font-bold text-neutral-900">Pilih Metode Pembayaran</h1>
                  <p className="text-neutral-600 mt-1">Pilih metode pembayaran yang Anda inginkan</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card
                    padding="md"
                    className={`cursor-pointer transition ${
                      paymentMethod === 'VIRTUAL_ACCOUNT'
                        ? 'border-2 border-primary-500 bg-primary-50'
                        : 'hover:border-primary-300'
                    }`}
                    onClick={() => setPaymentMethod('VIRTUAL_ACCOUNT')}
                  >
                    <div className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                          <Building className="w-8 h-8 text-primary-600" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-neutral-900 mb-2">Virtual Account</h3>
                      <p className="text-sm text-neutral-600 mb-3">Transfer via VA Bank</p>
                      <Badge>Biaya Admin: Rp 4.000</Badge>
                    </div>
                  </Card>

                  <Card
                    padding="md"
                    className={`cursor-pointer transition ${
                      paymentMethod === 'EWALLET'
                        ? 'border-2 border-primary-500 bg-primary-50'
                        : 'hover:border-primary-300'
                    }`}
                    onClick={() => setPaymentMethod('EWALLET')}
                  >
                    <div className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                          <Smartphone className="w-8 h-8 text-green-600" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-neutral-900 mb-2">E-Wallet</h3>
                      <p className="text-sm text-neutral-600 mb-3">GoPay, OVO, DANA, dll</p>
                      <Badge>Biaya Admin: Rp 2.500</Badge>
                    </div>
                  </Card>

                  <Card
                    padding="md"
                    className={`cursor-pointer transition ${
                      paymentMethod === 'TRANSFER_BANK'
                        ? 'border-2 border-primary-500 bg-primary-50'
                        : 'hover:border-primary-300'
                    }`}
                    onClick={() => setPaymentMethod('TRANSFER_BANK')}
                  >
                    <div className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <CreditCard className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-neutral-900 mb-2">Transfer Bank</h3>
                      <p className="text-sm text-neutral-600 mb-3">Transfer manual</p>
                      <Badge variant="success">Gratis Biaya Admin</Badge>
                    </div>
                  </Card>
                </div>

                {paymentMethod && (
                  <Card className="bg-neutral-50">
                    <h3 className="font-semibold text-neutral-900 mb-4">Ringkasan Pembayaran</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Tagihan SPP</span>
                        <span className="font-medium">{formatCurrency(getTotalAmount())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Biaya Admin</span>
                        <span className="font-medium">{formatCurrency(getAdminFee())}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-semibold text-neutral-900">Total Pembayaran</span>
                        <span className="font-bold text-xl text-primary-600">
                          {formatCurrency(getTotalAmount() + getAdminFee())}
                        </span>
                      </div>
                    </div>
                    <Button fullWidth onClick={handleProceedToPayment}>
                      Proses Pembayaran
                    </Button>
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
