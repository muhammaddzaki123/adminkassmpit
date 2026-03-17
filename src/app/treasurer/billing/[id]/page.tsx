'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Download, FileText, PlusCircle, User, Wallet } from 'lucide-react';
import jsPDF from 'jspdf';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { fetchWithAuth } from '@/lib/api-client';

interface BillingDetail {
  id: string;
  billNumber: string;
  type: string;
  month: number;
  year: number;
  description: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  dueDate: string;
  discount: number;
  discountReason: string | null;
  createdAt: string;
  student: {
    id: string;
    nama: string;
    nisn: string;
    className: string;
  };
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    paidAt: string | null;
    notes: string | null;
    createdAt: string;
  }>;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function statusVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'PAID') return 'success';
  if (status === 'PARTIAL') return 'warning';
  if (status === 'OVERDUE') return 'error';
  return 'default';
}

function statusLabel(status: string) {
  if (status === 'PAID') return 'Lunas';
  if (status === 'PARTIAL') return 'Cicilan';
  if (status === 'OVERDUE') return 'Tunggakan';
  if (status === 'BILLED') return 'Ditagih';
  if (status === 'WAIVED') return 'Dibebaskan';
  return status;
}

export default function BillingDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingDetail | null>(null);
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [manualPaymentLoading, setManualPaymentLoading] = useState(false);
  const [manualPaymentMessage, setManualPaymentMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'TUNAI',
    paidAt: new Date().toISOString().split('T')[0],
    receiptUrl: '',
    notes: '',
  });

  const paymentColumns = useMemo(
    () => [
      {
        key: 'date',
        label: 'Tanggal',
        render: (item: BillingDetail['payments'][number]) => (
          <span className="text-sm text-neutral-700">{formatDate(item.paidAt || item.createdAt)}</span>
        ),
      },
      {
        key: 'method',
        label: 'Metode',
        render: (item: BillingDetail['payments'][number]) => (
          <span className="text-sm text-neutral-700">{item.method}</span>
        ),
      },
      {
        key: 'amount',
        label: 'Nominal',
        render: (item: BillingDetail['payments'][number]) => (
          <span className="font-semibold text-neutral-900">{formatCurrency(item.amount)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (item: BillingDetail['payments'][number]) => (
          <Badge variant={item.status === 'COMPLETED' ? 'success' : 'warning'}>
            {item.status === 'COMPLETED' ? 'Selesai' : item.status}
          </Badge>
        ),
      },
      {
        key: 'notes',
        label: 'Catatan',
        render: (item: BillingDetail['payments'][number]) => (
          <span className="text-sm text-neutral-600">{item.notes || '-'}</span>
        ),
      },
    ],
    []
  );

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithAuth(`/api/billing/${params.id}`);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Gagal memuat detail tagihan');
      }

      const result = await response.json();
      setBilling(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat detail';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const handleDownloadPdf = () => {
    if (!billing) return;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 16;

    const writeLine = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 58, y);
      y += 7;
      if (y > 280) {
        doc.addPage();
        y = 16;
      }
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Ringkasan Tagihan Siswa', 14, y);
    y += 10;

    doc.setFontSize(11);
    writeLine('Nomor Tagihan', billing.billNumber);
    writeLine('Nama Siswa', billing.student.nama);
    writeLine('NISN', billing.student.nisn);
    writeLine('Kelas', billing.student.className);
    writeLine('Jenis Tagihan', billing.type);
    writeLine('Periode', `${MONTH_NAMES[billing.month - 1]} ${billing.year}`);
    writeLine('Jatuh Tempo', formatDate(billing.dueDate));
    writeLine('Status', statusLabel(billing.status));
    writeLine('Total Tagihan', formatCurrency(billing.totalAmount));
    writeLine('Total Dibayar', formatCurrency(billing.paidAmount));
    writeLine('Sisa Tagihan', formatCurrency(billing.remainingAmount));
    writeLine('Diskon', billing.discount > 0 ? formatCurrency(billing.discount) : '-');
    writeLine('Deskripsi', billing.description || '-');

    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Riwayat Pembayaran', 14, y);
    y += 8;

    if (billing.payments.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.text('Belum ada pembayaran.', 14, y);
    } else {
      billing.payments.forEach((payment, index) => {
        const paymentText = `${index + 1}. ${formatDate(payment.paidAt || payment.createdAt)} | ${payment.method} | ${formatCurrency(payment.amount)} | ${payment.status}`;
        doc.setFont('helvetica', 'normal');
        doc.text(paymentText, 14, y);
        y += 6;
        if (payment.notes) {
          doc.setFontSize(10);
          doc.text(`   Catatan: ${payment.notes}`, 14, y);
          doc.setFontSize(11);
          y += 6;
        }
        if (y > 280) {
          doc.addPage();
          y = 16;
        }
      });
    }

    doc.save(`ringkasan-tagihan-${billing.billNumber}.pdf`);
  };

  const openManualPaymentModal = () => {
    if (!billing) return;
    setPaymentForm({
      amount: String(billing.remainingAmount),
      method: 'TUNAI',
      paidAt: new Date().toISOString().split('T')[0],
      receiptUrl: '',
      notes: '',
    });
    setManualPaymentMessage(null);
    setShowManualPaymentModal(true);
  };

  const handleSubmitManualPayment = async () => {
    if (!billing) return;

    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > billing.remainingAmount) {
      setManualPaymentMessage({
        type: 'error',
        text: `Nominal harus antara 1 dan ${formatCurrency(billing.remainingAmount)}`,
      });
      return;
    }

    try {
      setManualPaymentLoading(true);
      setManualPaymentMessage(null);

      const response = await fetchWithAuth('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingId: billing.id,
          amount,
          method: paymentForm.method,
          paidAt: new Date(paymentForm.paidAt).toISOString(),
          receiptUrl: paymentForm.receiptUrl || undefined,
          notes: paymentForm.notes || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal mencatat pembayaran');
      }

      setManualPaymentMessage({ type: 'success', text: 'Pembayaran berhasil dicatat.' });
      await loadDetail();
      setTimeout(() => {
        setShowManualPaymentModal(false);
        setManualPaymentMessage(null);
      }, 900);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat mencatat pembayaran';
      setManualPaymentMessage({ type: 'error', text: message });
    } finally {
      setManualPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      loadDetail();
    }
  }, [params.id, loadDetail]);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block">
        <TreasurerSidebar />
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
            <TreasurerSidebar />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <TreasurerHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mt-16">
          <div className="max-w-6xl xl:max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Detail Tagihan</h1>
                <p className="text-neutral-600 mt-1">Informasi lengkap tagihan siswa</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={handleDownloadPdf} disabled={!billing || loading}>
                  <Download className="w-4 h-4 mr-2" />
                  Unduh Ringkasan PDF
                </Button>
                <Button
                  variant="primary"
                  onClick={openManualPaymentModal}
                  disabled={!billing || loading || (billing ? billing.remainingAmount <= 0 : true)}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Catat Pembayaran Manual
                </Button>
                <Button variant="secondary" onClick={() => router.push('/treasurer/billing/list')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Daftar
                </Button>
              </div>
            </div>

            {loading && (
              <Card>
                <div className="text-center py-10">
                  <div className="inline-block h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
                  <p className="mt-3 text-neutral-600">Memuat detail tagihan...</p>
                </div>
              </Card>
            )}

            {!loading && error && (
              <Card>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              </Card>
            )}

            {!loading && !error && billing && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <div className="flex items-center gap-3">
                      <Wallet className="w-8 h-8 text-primary-600" />
                      <div>
                        <p className="text-sm text-neutral-600">Total Tagihan</p>
                        <p className="text-xl font-bold text-neutral-900">{formatCurrency(billing.totalAmount)}</p>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-neutral-600">Sudah Dibayar</p>
                        <p className="text-xl font-bold text-green-700">{formatCurrency(billing.paidAmount)}</p>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-8 h-8 text-red-600" />
                      <div>
                        <p className="text-sm text-neutral-600">Sisa Tagihan</p>
                        <p className="text-xl font-bold text-red-700">{formatCurrency(billing.remainingAmount)}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <Card>
                    <h2 className="text-lg font-semibold text-neutral-900 mb-4">Informasi Tagihan</h2>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">Nomor Tagihan</span>
                        <span className="font-medium text-neutral-900">{billing.billNumber}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">Jenis</span>
                        <span className="font-medium text-neutral-900">{billing.type}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">Periode</span>
                        <span className="font-medium text-neutral-900">{MONTH_NAMES[billing.month - 1]} {billing.year}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">Jatuh Tempo</span>
                        <span className="font-medium text-neutral-900">{formatDate(billing.dueDate)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">Status</span>
                        <Badge variant={statusVariant(billing.status)}>{statusLabel(billing.status)}</Badge>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">Deskripsi</span>
                        <span className="font-medium text-neutral-900 text-right">{billing.description || '-'}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">Diskon</span>
                        <span className="font-medium text-neutral-900">{billing.discount > 0 ? formatCurrency(billing.discount) : '-'}</span>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <h2 className="text-lg font-semibold text-neutral-900 mb-4">Informasi Siswa</h2>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-neutral-500">
                        <User className="w-4 h-4" />
                        <span>Data Siswa</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">Nama</span>
                        <span className="font-medium text-neutral-900">{billing.student.nama}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">NISN</span>
                        <span className="font-medium text-neutral-900">{billing.student.nisn}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">Kelas</span>
                        <span className="font-medium text-neutral-900">{billing.student.className}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">Dibuat</span>
                        <span className="font-medium text-neutral-900">{formatDate(billing.createdAt)}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="overflow-hidden">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-4">Riwayat Pembayaran</h2>
                  {billing.payments.length === 0 ? (
                    <p className="text-neutral-600">Belum ada riwayat pembayaran.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table columns={paymentColumns} data={billing.payments} />
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </main>
      </div>

      {showManualPaymentModal && billing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-xl font-bold text-neutral-900">Catat Pembayaran Manual</h2>
              <p className="text-sm text-neutral-600 mt-1">{billing.student.nama} - {billing.billNumber}</p>
            </div>

            <div className="p-6 space-y-4">
              {manualPaymentMessage && (
                <div className={`p-4 rounded-lg ${manualPaymentMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                  {manualPaymentMessage.text}
                </div>
              )}

              <div>
                <p className="text-sm text-neutral-600">Sisa Tagihan</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(billing.remainingAmount)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Nominal Bayar</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="Masukkan nominal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Metode Pembayaran</label>
                <select
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                >
                  <option value="TUNAI">Tunai</option>
                  <option value="TRANSFER_BANK">Transfer Bank</option>
                  <option value="EWALLET">E-Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Tanggal Bayar</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={paymentForm.paidAt}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paidAt: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Link Bukti Transfer (Opsional)</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={paymentForm.receiptUrl}
                  onChange={(e) => setPaymentForm({ ...paymentForm, receiptUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Catatan (Opsional)</label>
                <textarea
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  if (manualPaymentLoading) return;
                  setShowManualPaymentModal(false);
                  setManualPaymentMessage(null);
                }}
                className="flex-1"
                disabled={manualPaymentLoading}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitManualPayment}
                className="flex-1"
                disabled={manualPaymentLoading}
              >
                {manualPaymentLoading ? 'Memproses...' : 'Simpan Pembayaran'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
