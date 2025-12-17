'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Search } from 'lucide-react';

interface Billing {
  id: string;
  billNumber: string;
  student: {
    nama: string;
    nisn: string;
  };
  type: string;
  month: number | null;
  year: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
}

export default function ManualPaymentPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    amount: '',
    method: 'TUNAI',
    paidAt: new Date().toISOString().split('T')[0],
    receiptUrl: '',
    notes: '',
  });

  const fetchBillings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'BILLED,PARTIAL,OVERDUE',
        search: searchQuery,
      });
      
      const response = await fetch(`/api/billing/list?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setBillings(result.data.billings.map((b: Billing) => ({
          ...b,
          remainingAmount: b.totalAmount - b.paidAmount,
        })));
      }
    } catch (error) {
      console.error('Error fetching billings:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'TREASURER') {
      router.push('/auth/login');
      return;
    }

    fetchBillings();
  }, [router, fetchBillings]);

  const openPaymentModal = (billing: Billing) => {
    setSelectedBilling(billing);
    setFormData({
      amount: billing.remainingAmount.toString(),
      method: 'TUNAI',
      paidAt: new Date().toISOString().split('T')[0],
      receiptUrl: '',
      notes: '',
    });
    setShowModal(true);
    setMessage(null);
  };

  const handleSubmitPayment = async () => {
    if (!selectedBilling) return;

    const amount = parseFloat(formData.amount);
    if (amount <= 0 || amount > selectedBilling.remainingAmount) {
      setMessage({
        type: 'error',
        text: `Nominal harus antara 1 - ${selectedBilling.remainingAmount.toLocaleString('id-ID')}`,
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingId: selectedBilling.id,
          amount,
          method: formData.method,
          paidAt: new Date(formData.paidAt).toISOString(),
          receiptUrl: formData.receiptUrl,
          notes: formData.notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Pembayaran berhasil diverifikasi! ${result.data.payment.paymentNumber}`,
        });
        setTimeout(() => {
          setShowModal(false);
          fetchBillings();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal verifikasi pembayaran' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month: number | null) => {
    if (!month) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[month - 1];
  };

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

      <div className="flex-1 flex flex-col">
        <TreasurerHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mt-16">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Verifikasi Pembayaran Manual</h1>
              <p className="text-neutral-600 mt-1">Input pembayaran tunai/transfer dari siswa</p>
            </div>

            {/* Search */}
            <Card>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Cari siswa (nama/NISN)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="primary" onClick={fetchBillings}>
                  Cari
                </Button>
              </div>
            </Card>

            {/* Billings List */}
            <Card>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                  <p className="mt-4 text-neutral-600">Memuat data...</p>
                </div>
              ) : billings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-600">Tidak ada tagihan belum lunas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {billings.map((billing) => (
                    <div
                      key={billing.id}
                      className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-neutral-900">{billing.student.nama}</h3>
                            <Badge variant="default">{billing.type}</Badge>
                            <Badge variant={billing.status === 'OVERDUE' ? 'error' : 'warning'}>
                              {billing.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-neutral-600">NISN</p>
                              <p className="font-medium">{billing.student.nisn}</p>
                            </div>
                            <div>
                              <p className="text-neutral-600">No. Tagihan</p>
                              <p className="font-medium">{billing.billNumber}</p>
                            </div>
                            <div>
                              <p className="text-neutral-600">Periode</p>
                              <p className="font-medium">
                                {billing.month ? `${getMonthName(billing.month)} ${billing.year}` : billing.year}
                              </p>
                            </div>
                            <div>
                              <p className="text-neutral-600">Sisa Tagihan</p>
                              <p className="font-bold text-red-600">{formatCurrency(billing.remainingAmount)}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openPaymentModal(billing)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Input Bayar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>

      {/* Payment Modal */}
      {showModal && selectedBilling && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-xl font-bold text-neutral-900">Verifikasi Pembayaran</h2>
              <p className="text-sm text-neutral-600 mt-1">{selectedBilling.student.nama}</p>
            </div>

            <div className="p-6 space-y-4">
              {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                  {message.text}
                </div>
              )}

              <div>
                <p className="text-sm text-neutral-600">Tagihan</p>
                <p className="text-lg font-bold text-neutral-900">{formatCurrency(selectedBilling.totalAmount)}</p>
                {selectedBilling.paidAmount > 0 && (
                  <p className="text-sm text-green-600">Terbayar: {formatCurrency(selectedBilling.paidAmount)}</p>
                )}
                <p className="text-sm font-medium text-red-600">Sisa: {formatCurrency(selectedBilling.remainingAmount)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Nominal Bayar <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Masukkan nominal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Metode Pembayaran <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                >
                  <option value="TUNAI">Tunai</option>
                  <option value="TRANSFER_BANK">Transfer Bank</option>
                  <option value="EWALLET">E-Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tanggal Bayar <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.paidAt}
                  onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Link Bukti Transfer (Opsional)
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.receiptUrl}
                  onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
                className="flex-1"
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitPayment}
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Verifikasi Bayar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
