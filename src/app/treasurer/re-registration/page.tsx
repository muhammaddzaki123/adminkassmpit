'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  AlertCircle, CalendarDays, CheckCircle2, ChevronDown,
  ChevronUp, Download, RefreshCw, Search, Users,
} from 'lucide-react';

interface ReregSummary {
  totalTagihan: number;
  periodLabel: string;
  statusTerbaru: string | null;
  billNumberTerbaru: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isPaid: boolean;
  paidAt: string | null;
}

interface StudentRow {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  academicYear: string;
  reRegistrationSummary?: ReregSummary;
  reregPaidAt?: string | null;
  reregFee?: number;
}

interface DisplayRow {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  academicYear: string;
  status: 'LUNAS' | 'CICILAN' | 'BELUM';
  totalTagihan: number;
  terbayar: number;
  sisaBayar: number;
  paidAt: string | null;
  billNumber: string | null;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export default function TreasurerReRegistrationPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [students, setStudents] = useState<DisplayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'LUNAS' | 'CICILAN' | 'BELUM'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'nama' | 'status' | 'sisaBayar'>('nama');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/auth/login'); return; }
    const user = JSON.parse(userData);
    if (user.role !== 'TREASURER') { router.push('/auth/login'); return; }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Ambil SEMUA siswa aktif & awaiting rereg untuk tampilkan status daftar ulang
      const [activeRes, awaitingRes] = await Promise.all([
        fetchWithAuth('/api/students?status=ACTIVE'),
        fetchWithAuth('/api/students?status=AWAITING_REREG'),
      ]);
      const activeData = activeRes.ok ? await activeRes.json() : { data: [] };
      const awaitingData = awaitingRes.ok ? await awaitingRes.json() : { data: [] };

      const allStudents: StudentRow[] = [
        ...(awaitingData.data || []),
        ...(activeData.data || []),
      ];

      // Deduplicate by id
      const seen = new Set<string>();
      const unique = allStudents.filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });

      // Hanya tampilkan yang punya tagihan DAFTAR_ULANG
      const rows: DisplayRow[] = unique
        .filter((s) => (s.reRegistrationSummary?.totalTagihan ?? 0) > 0)
        .map((s) => {
          const r = s.reRegistrationSummary;
          const paid = r?.paidAmount ?? 0;
          const total = r?.totalAmount ?? s.reregFee ?? 0;
          const remaining = r?.remainingAmount ?? Math.max(total - paid, 0);
          const isPaid = r?.isPaid ?? false;
          const status: DisplayRow['status'] = isPaid ? 'LUNAS' : paid > 0 ? 'CICILAN' : 'BELUM';
          return {
            id: s.id,
            nisn: s.nisn,
            nama: s.nama,
            kelas: s.kelas ?? '-',
            academicYear: s.academicYear ?? '-',
            status,
            totalTagihan: total,
            terbayar: paid,
            sisaBayar: remaining,
            paidAt: r?.paidAt ?? s.reregPaidAt ?? null,
            billNumber: r?.billNumberTerbaru ?? null,
          };
        });

      setStudents(rows);
    } catch (err) {
      console.error(err);
      alert('Gagal memuat data. Coba refresh.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = students
    .filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.nama.toLowerCase().includes(q) || s.nisn.includes(q) || s.kelas.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'nama') cmp = a.nama.localeCompare(b.nama);
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortField === 'sisaBayar') cmp = a.sisaBayar - b.sisaBayar;
      return sortAsc ? cmp : -cmp;
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const stats = {
    total: students.length,
    lunas: students.filter((s) => s.status === 'LUNAS').length,
    cicilan: students.filter((s) => s.status === 'CICILAN').length,
    belum: students.filter((s) => s.status === 'BELUM').length,
    totalPiutang: students.filter((s) => s.status !== 'LUNAS').reduce((sum, s) => sum + s.sisaBayar, 0),
  };

  const statusBadge = (status: DisplayRow['status']) => {
    if (status === 'LUNAS') return <Badge variant="success">Lunas</Badge>;
    if (status === 'CICILAN') return <Badge variant="warning">Cicilan</Badge>;
    return <Badge variant="error">Belum Bayar</Badge>;
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    sortField === field
      ? sortAsc ? <ChevronUp className="w-3.5 h-3.5 inline ml-1" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-1" />
      : null
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        <p className="mt-4 text-neutral-600">Memuat data daftar ulang...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block"><TreasurerSidebar /></div>
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"><TreasurerSidebar /></div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <TreasurerHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mt-16">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Page header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Daftar Ulang Kenaikan Kelas</h1>
                <p className="text-neutral-500 mt-1">Kelola pembayaran daftar ulang siswa setiap 1–21 Juli</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchData}>
                  Refresh
                </Button>
                <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                  Export
                </Button>
              </div>
            </div>

            {/* Info banner */}
            <Card className="bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <CalendarDays className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">Alur Daftar Ulang Tahunan</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    Generate tagihan DAFTAR_ULANG untuk siswa aktif/menunggu daftar ulang. Siswa membayar melalui portal masing-masing.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button variant="primary" onClick={() => router.push('/treasurer/billing?type=DAFTAR_ULANG')}>
                  Generate Tagihan Daftar Ulang
                </Button>
                <Button variant="outline" onClick={() => router.push('/treasurer/billing/list?type=DAFTAR_ULANG')}>
                  Lihat Semua Tagihan Daftar Ulang
                </Button>
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
                    <p className="text-xs text-neutral-500">Total Siswa</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.lunas}</p>
                    <p className="text-xs text-neutral-500">Sudah Lunas</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{stats.cicilan}</p>
                    <p className="text-xs text-neutral-500">Cicilan</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{stats.belum}</p>
                    <p className="text-xs text-neutral-500">Belum Bayar</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Piutang total */}
            {stats.totalPiutang > 0 && (
              <Card className="border-red-200 bg-red-50">
                <p className="text-sm text-red-700">Total piutang daftar ulang (belum & cicilan)</p>
                <p className="text-2xl font-bold text-red-800 mt-1">{formatCurrency(stats.totalPiutang)}</p>
              </Card>
            )}

            {/* Filter & Search */}
            <Card>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, NISN, atau kelas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(['ALL', 'LUNAS', 'CICILAN', 'BELUM'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                        filterStatus === s
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-400'
                      }`}
                    >
                      {s === 'ALL' ? 'Semua' : s === 'LUNAS' ? 'Lunas' : s === 'CICILAN' ? 'Cicilan' : 'Belum Bayar'}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Table */}
            <Card>
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500 font-medium">
                    {students.length === 0
                      ? 'Belum ada tagihan daftar ulang. Generate tagihan terlebih dahulu.'
                      : 'Tidak ada siswa yang sesuai filter.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 text-neutral-500">
                          <th className="text-left py-3 px-4 font-medium w-28">NISN</th>
                          <th
                            className="text-left py-3 px-4 font-medium cursor-pointer hover:text-neutral-800"
                            onClick={() => toggleSort('nama')}
                          >Nama <SortIcon field="nama" /></th>
                          <th className="text-left py-3 px-4 font-medium">Kelas</th>
                          <th
                            className="text-left py-3 px-4 font-medium cursor-pointer hover:text-neutral-800"
                            onClick={() => toggleSort('status')}
                          >Status <SortIcon field="status" /></th>
                          <th className="text-right py-3 px-4 font-medium">Terbayar</th>
                          <th
                            className="text-right py-3 px-4 font-medium cursor-pointer hover:text-neutral-800"
                            onClick={() => toggleSort('sisaBayar')}
                          >Sisa <SortIcon field="sisaBayar" /></th>
                          <th className="text-left py-3 px-4 font-medium">Tgl Lunas</th>
                          <th className="text-right py-3 px-4 font-medium w-28">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s) => (
                          <tr key={s.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition">
                            <td className="py-3 px-4 text-neutral-500 font-mono text-xs">{s.nisn}</td>
                            <td className="py-3 px-4">
                              <p className="font-medium text-neutral-900">{s.nama}</p>
                              {s.billNumber && <p className="text-xs text-neutral-400">{s.billNumber}</p>}
                            </td>
                            <td className="py-3 px-4 text-neutral-600">{s.kelas}</td>
                            <td className="py-3 px-4">{statusBadge(s.status)}</td>
                            <td className="py-3 px-4 text-right">
                              <p className="font-medium text-neutral-900">{formatCurrency(s.terbayar)}</p>
                              <p className="text-xs text-neutral-400">dari {formatCurrency(s.totalTagihan)}</p>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <p className={`font-bold ${s.sisaBayar > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {s.sisaBayar > 0 ? formatCurrency(s.sisaBayar) : '—'}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-neutral-500 text-xs">{formatDate(s.paidAt)}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                className="text-primary-600 hover:underline text-xs font-medium"
                                onClick={() => router.push(`/treasurer/billing/list?studentId=${s.id}&type=DAFTAR_ULANG`)}
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {filtered.map((s) => (
                      <div key={s.id} className="rounded-xl border border-neutral-200 bg-white">
                        <button
                          className="w-full flex items-center justify-between p-4 text-left"
                          onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                        >
                          <div>
                            <p className="font-semibold text-neutral-900">{s.nama}</p>
                            <p className="text-xs text-neutral-500">{s.kelas} · {s.nisn}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {statusBadge(s.status)}
                            {expandedId === s.id ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                          </div>
                        </button>
                        {expandedId === s.id && (
                          <div className="px-4 pb-4 border-t border-neutral-100 pt-3 space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-neutral-500">Total Tagihan</span><span className="font-medium">{formatCurrency(s.totalTagihan)}</span></div>
                            <div className="flex justify-between"><span className="text-neutral-500">Terbayar</span><span className="font-medium text-green-600">{formatCurrency(s.terbayar)}</span></div>
                            <div className="flex justify-between"><span className="text-neutral-500">Sisa</span><span className={`font-bold ${s.sisaBayar > 0 ? 'text-red-600' : 'text-green-600'}`}>{s.sisaBayar > 0 ? formatCurrency(s.sisaBayar) : 'Lunas'}</span></div>
                            <div className="flex justify-between"><span className="text-neutral-500">Tgl Lunas</span><span>{formatDate(s.paidAt)}</span></div>
                            <Button variant="outline" className="w-full mt-2" onClick={() => router.push(`/treasurer/billing/list?studentId=${s.id}&type=DAFTAR_ULANG`)}>
                              Lihat Detail Tagihan
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-neutral-400 mt-4 text-right">
                    Menampilkan {filtered.length} dari {students.length} siswa
                  </p>
                </>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
