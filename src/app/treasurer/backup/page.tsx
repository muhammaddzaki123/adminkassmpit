'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Database, Download, Upload, Archive, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface BackupRecord {
  id: string;
  date: string;
  type: string;
  size: string;
  status: string;
}

export default function BackupPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [lastBackup, setLastBackup] = useState<string>('Belum ada backup');

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

    // Initialize last backup date
    const now = new Date();
    setLastBackup(now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
  }, [router]);

  const handleBackup = () => {
    setIsCreatingBackup(true);
    // Simulate backup creation
    setTimeout(() => {
      const now = new Date();
      const newBackup: BackupRecord = {
        id: Date.now().toString(),
        date: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        type: 'Manual',
        size: `${(Math.random() * 10 + 20).toFixed(1)} MB`,
        status: 'success'
      };
      setBackupHistory([newBackup, ...backupHistory]);
      setLastBackup(newBackup.date);
      setIsCreatingBackup(false);
      alert('Backup berhasil dibuat!');
    }, 2000);
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
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Backup Data</h1>
              <p className="text-neutral-600 mt-1">Kelola backup dan restore data sistem</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-linear-to-br from-blue-500 to-blue-600 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Backup Terakhir</p>
                    <p className="text-lg font-bold">{lastBackup}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-white border-white hover:bg-white/20" 
                    icon={<Download className="w-4 h-4" />}
                    disabled={backupHistory.length === 0}
                  >
                    Download
                  </Button>
                </div>
              </Card>

              <Card className="bg-linear-to-br from-green-500 to-green-600 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Backup Otomatis</p>
                    <p className="text-lg font-bold">Setiap Hari 02:00 WIB</p>
                  </div>
                </div>
                <Badge variant="success" className="bg-white/20 text-white border-white/30">
                  Aktif
                </Badge>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className="text-center cursor-pointer hover:shadow-lg transition" 
                onClick={isCreatingBackup ? undefined : handleBackup}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-blue-100 rounded-full">
                    {isCreatingBackup ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    ) : (
                      <Archive className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {isCreatingBackup ? 'Membuat Backup...' : 'Backup Sekarang'}
                    </p>
                    <p className="text-sm text-neutral-600 mt-1">Buat backup manual</p>
                  </div>
                </div>
              </Card>

              <Card className="text-center cursor-pointer hover:shadow-lg transition opacity-50">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-green-100 rounded-full">
                    <Upload className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">Restore Data</p>
                    <p className="text-sm text-neutral-600 mt-1">Pulihkan dari backup</p>
                  </div>
                </div>
              </Card>

              <Card className="text-center cursor-pointer hover:shadow-lg transition opacity-50">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-yellow-100 rounded-full">
                    <Database className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">Pengaturan</p>
                    <p className="text-sm text-neutral-600 mt-1">Atur jadwal backup</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <h3 className="text-lg font-semibold mb-4">Riwayat Backup</h3>
              {backupHistory.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">Belum ada riwayat backup manual</p>
                  <p className="text-sm text-neutral-500 mt-2">Klik &quot;Backup Sekarang&quot; untuk membuat backup</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left p-4 text-sm font-semibold text-neutral-700">Tanggal & Waktu</th>
                        <th className="text-left p-4 text-sm font-semibold text-neutral-700">Tipe</th>
                        <th className="text-left p-4 text-sm font-semibold text-neutral-700">Ukuran</th>
                        <th className="text-center p-4 text-sm font-semibold text-neutral-700">Status</th>
                        <th className="text-center p-4 text-sm font-semibold text-neutral-700">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backupHistory.map((backup) => (
                        <tr key={backup.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="p-4 text-sm text-neutral-900">{backup.date}</td>
                          <td className="p-4">
                            <Badge variant={backup.type === 'Auto' ? 'info' : 'warning'}>
                              {backup.type}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-neutral-900">{backup.size}</td>
                          <td className="p-4 text-center">
                            {backup.status === 'success' ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-600 mx-auto" />
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <Button size="sm" variant="outline" icon={<Download className="w-4 h-4" />}>
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
