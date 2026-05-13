'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  RefreshCw,
  Receipt,
  CreditCard,
  Building,
  Smartphone,
  CalendarDays,
  Hash,
  AlertTriangle,
} from 'lucide-react';

interface PaymentDetail {
  id: string;
  paymentNumber: string;
  externalId?: string | null;
  transactionId?: string | null;
  amount: number;
  adminFee: number;
  totalPaid: number;
  status: string;
  method: string;
  vaNumber?: string | null;
  qrCode?: string | null;
  deeplink?: string | null;
  expiredAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  notes?: string | null;
  billing?: {
    id: string;
    billNumber: string;
    type: string;
    description?: string | null;
    totalAmount: number;
    paidAmount: number;
    status: string;
    month?: number | null;
    year?: number | null;
    student?: {
      nama: string;
      nisn: string;
    };
  };
}

export default function PaymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const paymentId = params?.id as string;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch detail dari API payment by ID
      const response = await fetchWithAuth(`/api/payment/${paymentId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Transaksi tidak ditemukan.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid response format');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setPayment(result.data);
      } else {
        setError(result.error || 'Gagal memuat detail transaksi.');
      }
    } catch (err) {
      console.error('Fetch payment detail error:', err);
      setError('Gagal memuat detail transaksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [paymentId]);

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

    fetchPaymentDetail();
  }, [router, fetchPaymentDetail]);

  const syncStatus = async () => {
    if (!payment?.id || isSyncing) return;
    setIsSyncing(true);
    try {
      const response = await fetchWithAuth('/api/payment/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.id }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.success && result?.data?.status) {
          setPayment((prev) =>
            prev ? { ...prev, status: result.data.status } : prev
          );
          // Reload full detail if status changed
          if (result.data.changed) {
            await fetchPaymentDetail();
          }
        }
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getMonthName = (month: number | null | undefined) => {
    if (!month) return '';
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return months[month - 1];
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'VIRTUAL_ACCOUNT': return 'Virtual Account';
      case 'TRANSFER_BANK': return 'Transfer Bank Manual';
      case 'EWALLET': return 'QRIS / E-Wallet';
      case 'TUNAI': return 'Tunai';
      default: return method;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'VIRTUAL_ACCOUNT': return <Building className="w-5 h-5" />;
      case 'EWALLET': return <Smartphone className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          badge: <Badge variant="success">Berhasil</Badge>,
          bg: 'bg-green-50 border-green-200',
          text: 'Pembayaran telah berhasil dikonfirmasi.',
        };
      case 'PENDING':
        return {
          icon: <Clock className="w-8 h-8 text-yellow-500" />,
          badge: <Badge variant="warning">Menunggu Pembayaran</Badge>,
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'Pembayaran menunggu konfirmasi dari sistem.',
        };
      case 'FAILED':
        return {
          icon: <XCircle className="w-8 h-8 text-red-500" />,
          badge: <Badge variant="error">Gagal</Badge>,
          bg: 'bg-red-50 border-red-200',
          text: 'Pembayaran gagal diproses.',
        };
      case 'EXPIRED':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-red-400" />,
          badge: <Badge variant="error">Kadaluarsa</Badge>,
          bg: 'bg-red-50 border-red-200',
          text: 'Batas waktu pembayaran telah habis.',
        };
      default:
        return {
          icon: <Receipt className="w-8 h-8 text-neutral-500" />,
          badge: <Badge>{status}</Badge>,
          bg: 'bg-neutral-50 border-neutral-200',
          text: '',
        };
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Berhasil disalin!');
  };

  // ─── Render States ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-neutral-50">
        <div className="hidden lg:block"><StudentSidebar /></div>
        <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
          <StudentHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
          <main className="flex-1 flex items-center justify-center mt-16">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4" />
              <p className="text-neutral-600">Memuat detail transaksi...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="flex min-h-screen bg-neutral-50">
        <div className="hidden lg:block"><StudentSidebar /></div>
        <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
          <StudentHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 mt-16">
            <div className="max-w-2xl mx-auto">
              <Card className="text-center py-12">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-neutral-900 mb-2">Transaksi Tidak Ditemukan</h2>
                <p className="text-neutral-600 mb-6">{error || 'Data transaksi tidak tersedia.'}</p>
                <Button onClick={() => router.push('/student/history')} variant="primary">
                  Kembali ke Riwayat
                </Button>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(payment.status);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block"><StudentSidebar /></div>

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
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/student/history')}
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Detail Transaksi</h1>
                <p className="text-sm text-neutral-500">{payment.paymentNumber}</p>
              </div>
            </div>

            {/* Status Card */}
            <Card className={`border ${statusConfig.bg}`}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  {statusConfig.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {statusConfig.badge}
                  </div>
                  <p className="text-sm text-neutral-600">{statusConfig.text}</p>
                  {payment.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      icon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
                      onClick={syncStatus}
                    >
                      {isSyncing ? 'Memeriksa...' : 'Cek Status Terbaru'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Nominal Pembayaran */}
            <Card>
              <div className="bg-linear-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white mb-6">
                <p className="text-sm opacity-80 mb-1">Total yang Dibayar</p>
                <p className="text-4xl font-bold">{formatCurrency(payment.totalPaid)}</p>
                {payment.adminFee > 0 && (
                  <p className="text-sm opacity-70 mt-2">
                    Tagihan {formatCurrency(payment.amount)} + Admin {formatCurrency(payment.adminFee)}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-900">Informasi Transaksi</h3>

                <div className="divide-y divide-neutral-100">
                  <DetailRow
                    label="Nomor Transaksi"
                    value={payment.paymentNumber}
                    icon={<Hash className="w-4 h-4 text-neutral-400" />}
                    copyable
                    onCopy={() => copyToClipboard(payment.paymentNumber)}
                  />
                  <DetailRow
                    label="Metode Pembayaran"
                    value={getMethodLabel(payment.method)}
                    icon={getMethodIcon(payment.method)}
                  />
                  {payment.billing && (
                    <DetailRow
                      label="Jenis Tagihan"
                      value={`${payment.billing.type}${payment.billing.month ? ` - ${getMonthName(payment.billing.month)} ${payment.billing.year}` : ''}`}
                      icon={<Receipt className="w-4 h-4 text-neutral-400" />}
                    />
                  )}
                  {payment.billing?.description && (
                    <DetailRow
                      label="Keterangan"
                      value={payment.billing.description}
                    />
                  )}
                  <DetailRow
                    label="Tanggal Dibuat"
                    value={formatDate(payment.createdAt)}
                    icon={<CalendarDays className="w-4 h-4 text-neutral-400" />}
                  />
                  {payment.paidAt && (
                    <DetailRow
                      label="Tanggal Pembayaran"
                      value={formatDate(payment.paidAt)}
                      highlight="green"
                    />
                  )}
                  {payment.expiredAt && payment.status === 'PENDING' && (
                    <DetailRow
                      label="Berlaku Hingga"
                      value={formatDate(payment.expiredAt)}
                      highlight="yellow"
                    />
                  )}
                </div>
              </div>
            </Card>

            {/* VA / QRIS Info — hanya tampil kalau PENDING dan ada VA */}
            {payment.status === 'PENDING' && payment.vaNumber && (
              <Card>
                <h3 className="font-semibold text-neutral-900 mb-4">Instruksi Pembayaran</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Nomor Virtual Account</p>
                    <div className="flex items-center justify-between bg-neutral-50 rounded-lg px-4 py-3 border border-neutral-200">
                      <p className="font-mono text-lg font-bold tracking-wider text-neutral-900">
                        {payment.vaNumber}
                      </p>
                      <button
                        onClick={() => copyToClipboard(payment.vaNumber!)}
                        className="text-primary-600 hover:text-primary-700 p-1"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  {payment.externalId && (
                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Order ID</p>
                      <div className="flex items-center justify-between bg-neutral-50 rounded-lg px-4 py-3 border border-neutral-200">
                        <p className="font-mono text-sm text-neutral-700 break-all">{payment.externalId}</p>
                        <button
                          onClick={() => copyToClipboard(payment.externalId!)}
                          className="text-primary-600 hover:text-primary-700 p-1 ml-2 shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => router.push('/student/history')}
              >
                Kembali
              </Button>
              {payment.billing?.id && (
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => router.push(`/student/spp?billingId=${payment.billing!.id}`)}
                >
                  Lihat Tagihan
                </Button>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Helper Component ─────────────────────────────────────────────────────────

interface DetailRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  copyable?: boolean;
  onCopy?: () => void;
  highlight?: 'green' | 'yellow';
}

function DetailRow({ label, value, icon, copyable, onCopy, highlight }: DetailRowProps) {
  const valueClass =
    highlight === 'green'
      ? 'font-semibold text-green-700'
      : highlight === 'yellow'
      ? 'font-semibold text-yellow-700'
      : 'font-semibold text-neutral-900';

  return (
    <div className="flex items-start justify-between py-3 gap-4">
      <div className="flex items-center gap-2 text-sm text-neutral-500 min-w-0 shrink-0 w-40">
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2 text-right">
        <p className={`text-sm ${valueClass} break-all`}>{value}</p>
        {copyable && onCopy && (
          <button onClick={onCopy} className="text-primary-600 hover:text-primary-700 shrink-0">
            <Copy className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
