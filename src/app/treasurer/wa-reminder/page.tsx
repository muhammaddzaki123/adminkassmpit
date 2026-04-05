'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { MessageCircle, Send, Users, CheckCircle, RefreshCw, Smartphone, AlertTriangle } from 'lucide-react';

type BillingStatusFilter = 'ALL' | 'BILLED' | 'PARTIAL' | 'OVERDUE';
type HistoryStatusFilter = 'ALL' | 'SENT' | 'FAILED';

interface ClassItem {
  id: string;
  name: string;
  grade: number;
}

interface AcademicYearItem {
  id: string;
  year: string;
  isActive: boolean;
}

interface ReminderItem {
  billingId: string;
  studentId: string;
  studentName: string;
  nisn: string;
  hasPhoneNumber: boolean;
  phoneNumber: string | null;
  billingType: string;
  remainingAmount: number;
  status: 'BILLED' | 'PARTIAL' | 'OVERDUE' | string;
  dueDate: string;
  lastReminderSentAt?: string | null;
  throttledToday?: boolean;
  isOverdue: boolean;
  daysUntilDue?: number | null;
  reminderGroup?: 'UNPAID' | 'DUE_SOON' | 'OVERDUE';
}

interface ReminderTargetSummary {
  academicYearId: string | null;
  totalStudents: number;
  studentsWithPhone: number;
  studentsWithBilling: number;
  noBillingStudents: number;
  billingCandidates: number;
  dueSoonBillings: number;
  overdueBillings: number;
}

interface ReminderHistoryItem {
  id: string;
  status: string;
  recipient: string;
  template: string;
  subject?: string | null;
  createdAt: string;
  sentAt?: string | null;
  metadata?: {
    billingId?: string;
    [key: string]: unknown;
  } | null;
}

interface WhatsAppStatusResponse {
  success: boolean;
  ready: boolean;
  connected: boolean;
  message?: string;
  authenticatedAs?: {
    phone: string;
    name: string;
  } | null;
}

export default function WAReminder() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BillingStatusFilter>('ALL');
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [waStatus, setWaStatus] = useState<WhatsAppStatusResponse | null>(null);
  const [targetSummary, setTargetSummary] = useState<ReminderTargetSummary | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedBillingIds, setSelectedBillingIds] = useState<string[]>([]);
  const [history, setHistory] = useState<ReminderHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewTotalPages, setPreviewTotalPages] = useState(1);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<HistoryStatusFilter>('ALL');

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/admin/classes');
      if (!res.ok) return;

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setClasses(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  }, []);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/admin/academic-years');
      if (!res.ok) return;

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const years = json.data as AcademicYearItem[];
        setAcademicYears(years);
        const activeYear = years.find((item) => item.isActive) || years[0];
        if (activeYear) {
          setSelectedAcademicYearId((prev) => prev || activeYear.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  }, []);

  const fetchWhatsAppStatus = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const res = await fetchWithAuth('/api/whatsapp/status');
      const json = await res.json();
      setWaStatus(json);
    } catch (error) {
      console.error('Failed to check WhatsApp status:', error);
      setWaStatus({
        success: false,
        ready: false,
        connected: false,
        message: 'Gagal memeriksa status WhatsApp',
      });
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  const fetchPreview = useCallback(async () => {
    setLoadingPreview(true);
    setResultMessage(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      if (selectedClassId !== 'ALL') {
        params.set('classIds', selectedClassId);
      }
      if (selectedAcademicYearId) {
        params.set('academicYearId', selectedAcademicYearId);
      }
      params.set('page', String(previewPage));
      params.set('pageSize', '20');

      const url = params.toString()
        ? `/api/whatsapp/send-reminder?${params.toString()}`
        : '/api/whatsapp/send-reminder';

      const res = await fetchWithAuth(url);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setResultMessage({
          type: 'error',
          text: json.error || json.message || 'Gagal memuat preview reminder',
        });
        setReminders([]);
        return;
      }

      setReminders(json.data || []);
      setPreviewTotal(json.total || 0);
      setPreviewTotalPages(json.totalPages || 1);
      setTargetSummary(json.targetSummary || null);
      setSelectedBillingIds((json.data || [])
        .filter((item: ReminderItem) => item.hasPhoneNumber && !item.throttledToday)
        .map((item: ReminderItem) => item.billingId));
    } catch (error) {
      console.error('Failed to fetch reminder preview:', error);
      setResultMessage({ type: 'error', text: 'Terjadi kesalahan saat memuat preview' });
      setReminders([]);
      setPreviewTotal(0);
      setPreviewTotalPages(1);
      setTargetSummary(null);
      setSelectedBillingIds([]);
    } finally {
      setLoadingPreview(false);
    }
  }, [selectedAcademicYearId, selectedClassId, statusFilter, previewPage]);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams({
        page: String(historyPage),
        pageSize: '20',
        status: historyStatusFilter,
      });
      const res = await fetchWithAuth(`/api/whatsapp/history?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setHistory(json.data || []);
        setHistoryTotalPages(json.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch reminder history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [historyPage, historyStatusFilter]);

  useEffect(() => {
    const init = async () => {
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

      await Promise.all([fetchClasses(), fetchAcademicYears(), fetchWhatsAppStatus()]);
    };

    init();
  }, [router, fetchAcademicYears, fetchClasses, fetchWhatsAppStatus]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    setPreviewPage(1);
  }, [selectedClassId, statusFilter]);

  useEffect(() => {
    setPreviewPage(1);
  }, [selectedAcademicYearId]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyStatusFilter]);

  const sendReminders = async () => {
    if (!waStatus?.ready) {
      setResultMessage({
        type: 'error',
        text: 'WhatsApp belum terhubung. Scan QR terlebih dahulu melalui server terminal.',
      });
      return;
    }

    if (selectedBillingIds.length === 0) {
      setResultMessage({ type: 'error', text: 'Pilih minimal satu siswa untuk dikirim.' });
      return;
    }

    setSending(true);
    setResultMessage(null);
    try {
      const payload: {
        billingIds: string[];
      } = {
        billingIds: selectedBillingIds,
      };

      const res = await fetchWithAuth('/api/whatsapp/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setResultMessage({
          type: 'error',
          text: json.error || json.message || 'Gagal mengirim reminder',
        });
        return;
      }

      setResultMessage({
        type: 'success',
        text: `Berhasil: ${json.successful} | Gagal: ${json.failed} | Skip: ${json.skipped || 0} | Total: ${json.total}`,
      });

      await Promise.all([fetchPreview(), fetchHistory()]);
    } catch (error) {
      console.error('Failed to send reminders:', error);
      setResultMessage({ type: 'error', text: 'Terjadi kesalahan saat mengirim reminder.' });
    } finally {
      setSending(false);
    }
  };

  const totalReceivers = targetSummary?.totalStudents ?? reminders.length;
  const withPhone = targetSummary?.studentsWithPhone ?? reminders.filter((item) => item.hasPhoneNumber).length;
  const billingCandidates = targetSummary?.billingCandidates ?? previewTotal;
  const dueSoonBillings = targetSummary?.dueSoonBillings ?? reminders.filter((item) => item.reminderGroup === 'DUE_SOON').length;
  const overdueBillings = targetSummary?.overdueBillings ?? reminders.filter((item) => item.reminderGroup === 'OVERDUE').length;
  const selectedCount = selectedBillingIds.length;

  const statusBadgeVariant = (status: string): 'default' | 'warning' | 'success' | 'error' => {
    if (status === 'OVERDUE') return 'error';
    if (status === 'PARTIAL') return 'warning';
    if (status === 'BILLED') return 'default';
    return 'success';
  };

  const toggleSelected = (billingId: string) => {
    setSelectedBillingIds((prev) =>
      prev.includes(billingId)
        ? prev.filter((id) => id !== billingId)
        : [...prev, billingId]
    );
  };

  const selectAllEligible = () => {
    const eligible = reminders
      .filter((item) => item.hasPhoneNumber && !item.throttledToday)
      .map((item) => item.billingId);
    setSelectedBillingIds(eligible);
  };

  const clearSelection = () => {
    setSelectedBillingIds([]);
  };

  const retryFailedOnly = async () => {
    const failedBillingIds = Array.from(
      new Set(
        history
          .filter((log) => log.status === 'FAILED')
          .map((log) => log.metadata?.billingId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      )
    );

    if (failedBillingIds.length === 0) {
      setResultMessage({ type: 'error', text: 'Tidak ada riwayat FAILED yang bisa dikirim ulang.' });
      return;
    }

    setSending(true);
    setResultMessage(null);
    try {
      const res = await fetchWithAuth('/api/whatsapp/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingIds: failedBillingIds }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setResultMessage({
          type: 'error',
          text: json.error || json.message || 'Gagal kirim ulang reminder gagal',
        });
        return;
      }

      setResultMessage({
        type: 'success',
        text: `Retry gagal: berhasil ${json.successful}, gagal ${json.failed}, skip ${json.skipped || 0}`,
      });

      await Promise.all([fetchPreview(), fetchHistory()]);
    } catch (error) {
      console.error('Failed to retry failed reminders:', error);
      setResultMessage({ type: 'error', text: 'Terjadi kesalahan saat retry reminder gagal.' });
    } finally {
      setSending(false);
    }
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

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <TreasurerHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mt-16">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Reminder WhatsApp</h1>
                <p className="text-neutral-600 mt-1">Kirim pengingat pembayaran tagihan via WhatsApp untuk siswa</p>
              </div>
              <Button
                icon={<Send className="w-4 h-4" />}
                onClick={sendReminders}
                isLoading={sending}
              >
                Kirim Reminder
              </Button>
            </div>

            {resultMessage && (
              <Card className={resultMessage.type === 'success' ? 'border-primary-300 bg-primary-50' : 'border-red-300 bg-red-50'} padding="md">
                <p className={resultMessage.type === 'success' ? 'text-primary-800' : 'text-red-800'}>
                  {resultMessage.text}
                </p>
              </Card>
            )}

            <Card padding="md">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 mt-0.5 text-neutral-600" />
                  <div>
                    <p className="font-semibold text-neutral-900">Status WhatsApp Client</p>
                    <p className="text-sm text-neutral-600 mt-1">
                      {waStatus?.ready
                        ? `Terhubung (${waStatus.authenticatedAs?.name || waStatus.authenticatedAs?.phone || 'unknown'})`
                        : waStatus?.message || 'Belum terhubung'}
                    </p>
                    {!waStatus?.ready && (
                      <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Pastikan server menampilkan QR di terminal, lalu scan dari WhatsApp Linked Devices.
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={fetchWhatsAppStatus}
                  isLoading={checkingStatus}
                >
                  Refresh Status
                </Button>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card padding="md" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <p className="text-2xl font-bold text-neutral-900">{totalReceivers}</p>
                </div>
                <p className="text-sm text-neutral-600">Total Siswa Target</p>
              </Card>
              <Card padding="md" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-2xl font-bold text-neutral-900">{withPhone}</p>
                </div>
                <p className="text-sm text-neutral-600">Siswa dengan No WA</p>
              </Card>
              <Card padding="md" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-2xl font-bold text-neutral-900">{billingCandidates}</p>
                </div>
                <p className="text-sm text-neutral-600">Billing Kandidat Reminder</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card padding="md" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <RefreshCw className="w-5 h-5 text-amber-600" />
                  <p className="text-2xl font-bold text-neutral-900">{dueSoonBillings}</p>
                </div>
                <p className="text-sm text-neutral-600">Hampir Jatuh Tempo</p>
              </Card>
              <Card padding="md" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-2xl font-bold text-neutral-900">{overdueBillings}</p>
                </div>
                <p className="text-sm text-neutral-600">Sudah Jatuh Tempo</p>
              </Card>
            </div>

            <Card>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Filter Reminder</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Select
                      label="Tahun Ajaran"
                      value={selectedAcademicYearId}
                      onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                      options={[
                        { value: '', label: 'Aktif / Otomatis' },
                        ...academicYears.map((item) => ({
                          value: item.id,
                          label: `${item.year}${item.isActive ? ' (aktif)' : ''}`,
                        })),
                      ]}
                    />
                  </div>
                  <div>
                    <Select
                      label="Filter Kelas"
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      options={[
                        { value: 'ALL', label: 'Semua Kelas' },
                        ...classes.map((item) => ({
                          value: item.id,
                          label: `Kelas ${item.grade} - ${item.name}`,
                        })),
                      ]}
                    />
                  </div>
                  <div>
                    <Select
                      label="Status Pembayaran"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as BillingStatusFilter)}
                      options={[
                        { value: 'ALL', label: 'Semua Status' },
                        { value: 'BILLED', label: 'Belum Bayar (BILLED)' },
                        { value: 'PARTIAL', label: 'Cicilan (PARTIAL)' },
                        { value: 'OVERDUE', label: 'Terlambat (OVERDUE)' },
                      ]}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    icon={<RefreshCw className="w-4 h-4" />}
                    onClick={fetchPreview}
                    isLoading={loadingPreview}
                  >
                    Preview Ulang
                  </Button>
                  <Button variant="secondary" onClick={selectAllEligible}>
                    Pilih Semua Eligible
                  </Button>
                  <Button variant="ghost" onClick={clearSelection}>
                    Reset Pilihan
                  </Button>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-neutral-500">
                    Total billing preview: {previewTotal} • Target siswa: {totalReceivers} • Tidak punya billing: {targetSummary?.noBillingStudents ?? 0}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPreviewPage((p) => Math.max(p - 1, 1))}
                      disabled={previewPage <= 1}
                    >
                      Prev
                    </Button>
                    <span className="text-xs text-neutral-600">Page {previewPage} / {previewTotalPages}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPreviewPage((p) => Math.min(p + 1, previewTotalPages))}
                      disabled={previewPage >= previewTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Preview Penerima Reminder</h2>
              {loadingPreview ? (
                <p className="text-sm text-neutral-600">Memuat data reminder...</p>
              ) : reminders.length === 0 ? (
                <p className="text-sm text-neutral-600">Tidak ada billing reminder untuk filter saat ini. Target siswa tetap dihitung dari tahun ajaran yang dipilih.</p>
              ) : (
                <div className="space-y-3">
                  {reminders.slice(0, 20).map((item) => (
                    <div key={item.billingId} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 bg-neutral-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          disabled={!item.hasPhoneNumber || item.throttledToday}
                          checked={selectedBillingIds.includes(item.billingId)}
                          onChange={() => toggleSelected(item.billingId)}
                        />
                        <div>
                        <p className="font-medium text-neutral-900">{item.studentName} ({item.nisn || '-'})</p>
                        <p className="text-sm text-neutral-600 mt-1">
                          {item.billingType} • Sisa: Rp {Math.round(item.remainingAmount).toLocaleString('id-ID')} • Jatuh tempo:{' '}
                          {new Date(item.dueDate).toLocaleDateString('id-ID')}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {item.hasPhoneNumber ? `No WA: ${item.phoneNumber}` : 'No WA siswa belum tersedia'}
                        </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.reminderGroup && <Badge variant={item.reminderGroup === 'OVERDUE' ? 'error' : item.reminderGroup === 'DUE_SOON' ? 'warning' : 'default'}>{item.reminderGroup}</Badge>}
                        {item.throttledToday && <Badge variant="warning">Throttle Hari Ini</Badge>}
                        <Badge variant={item.hasPhoneNumber ? 'success' : 'warning'}>
                          {item.hasPhoneNumber ? 'Ada No WA' : 'No WA Kosong'}
                        </Badge>
                        <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
                      </div>
                    </div>
                  ))}
                  {reminders.length > 20 && (
                    <p className="text-xs text-neutral-500">
                      Menampilkan 20 dari {reminders.length} data. Semua data tetap ikut saat kirim reminder.
                    </p>
                  )}
                </div>
              )}
            </Card>

            <Card padding="md" className="bg-neutral-50">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-neutral-700">
                  Pastikan status WhatsApp <span className="font-semibold">ready</span> sebelum menekan tombol kirim.
                </p>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={fetchPreview} isLoading={loadingPreview}>
                    Refresh Data
                  </Button>
                  <Button onClick={sendReminders} isLoading={sending} icon={<Send className="w-4 h-4" />}>
                    Kirim yang Dipilih ({selectedCount})
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-neutral-900">Riwayat Pengiriman WA</h2>
                <div className="flex items-center gap-2">
                  <div className="w-44">
                    <Select
                      value={historyStatusFilter}
                      onChange={(e) => setHistoryStatusFilter(e.target.value as HistoryStatusFilter)}
                      options={[
                        { value: 'ALL', label: 'Semua Status' },
                        { value: 'SENT', label: 'SENT' },
                        { value: 'FAILED', label: 'FAILED' },
                      ]}
                    />
                  </div>
                  <Button variant="secondary" onClick={fetchHistory} isLoading={loadingHistory}>
                    Refresh Riwayat
                  </Button>
                  <Button variant="danger" onClick={retryFailedOnly} isLoading={sending}>
                    Kirim Ulang Gagal Saja
                  </Button>
                </div>
              </div>

              {loadingHistory ? (
                <p className="text-sm text-neutral-600">Memuat riwayat...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-neutral-600">Belum ada riwayat reminder WhatsApp.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((log) => (
                    <div key={log.id} className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between p-3 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {log.template} • {log.recipient}
                        </p>
                        <p className="text-xs text-neutral-600">
                          Dibuat: {new Date(log.createdAt).toLocaleString('id-ID')}
                          {log.sentAt ? ` • Terkirim: ${new Date(log.sentAt).toLocaleString('id-ID')}` : ''}
                        </p>
                      </div>
                      <Badge variant={log.status === 'SENT' ? 'success' : 'error'}>{log.status}</Badge>
                    </div>
                  ))}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setHistoryPage((p) => Math.max(p - 1, 1))}
                      disabled={historyPage <= 1}
                    >
                      Prev
                    </Button>
                    <span className="text-xs text-neutral-600">Page {historyPage} / {historyTotalPages}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setHistoryPage((p) => Math.min(p + 1, historyTotalPages))}
                      disabled={historyPage >= historyTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
