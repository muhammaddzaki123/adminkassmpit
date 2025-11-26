'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { MessageCircle, Send, Users, CheckCircle } from 'lucide-react';

export default function WAReminder() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState('default');
  const [customMessage, setCustomMessage] = useState('');

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
  }, [router]);

  const templates = {
    default: 'Assalamualaikum, Yth. Orang Tua/Wali {nama_siswa}. Kami mengingatkan bahwa pembayaran SPP bulan {bulan} belum kami terima. Mohon dapat segera melakukan pembayaran. Terima kasih.',
    formal: 'Kepada Yth. Orang Tua/Wali {nama_siswa}, Bersama ini kami sampaikan bahwa terdapat tunggakan SPP untuk bulan {bulan} sebesar Rp. {jumlah}. Mohon segera melakukan pembayaran.',
    friendly: 'Halo Bapak/Ibu {nama_siswa}, Pengingat pembayaran SPP bulan {bulan} ya. Ditunggu pembayarannya. Terima kasih! 😊',
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
                <p className="text-neutral-600 mt-1">Kirim pengingat pembayaran via WhatsApp</p>
              </div>
              <Button icon={<Send className="w-4 h-4" />}>
                Kirim Sekarang
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card padding="md" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <p className="text-2xl font-bold text-neutral-900">45</p>
                </div>
                <p className="text-sm text-neutral-600">Total Penerima</p>
              </Card>
              <Card padding="md" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-2xl font-bold text-neutral-900">32</p>
                </div>
                <p className="text-sm text-neutral-600">Terkirim</p>
              </Card>
              <Card padding="md" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-2xl font-bold text-neutral-900">13</p>
                </div>
                <p className="text-sm text-neutral-600">Pending</p>
              </Card>
            </div>

            <Card>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Pengaturan Pesan</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Template Pesan</label>
                  <Select
                    value={messageTemplate}
                    onChange={(e) => {
                      setMessageTemplate(e.target.value);
                      setCustomMessage(templates[e.target.value as keyof typeof templates] || '');
                    }}
                    options={[
                      { value: 'default', label: 'Template Default' },
                      { value: 'formal', label: 'Template Formal' },
                      { value: 'friendly', label: 'Template Ramah' },
                      { value: 'custom', label: 'Custom' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Pesan</label>
                  <textarea
                    className="w-full min-h-32 px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={customMessage || templates[messageTemplate as keyof typeof templates]}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Tulis pesan reminder..."
                  />
                  <p className="text-xs text-neutral-500 mt-2">
                    Variabel: {'{nama_siswa}'}, {'{bulan}'}, {'{jumlah}'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Filter Kelas</label>
                    <Select
                      options={[
                        { value: 'all', label: 'Semua Kelas' },
                        { value: '7', label: 'Kelas 7' },
                        { value: '8', label: 'Kelas 8' },
                        { value: '9', label: 'Kelas 9' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Status Pembayaran</label>
                    <Select
                      options={[
                        { value: 'unpaid', label: 'Belum Bayar' },
                        { value: 'partial', label: 'Cicilan' },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Riwayat Pengiriman</h2>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">Reminder SPP Januari 2025</p>
                      <p className="text-sm text-neutral-600">Dikirim ke 45 orang tua - 15 Jan 2025</p>
                    </div>
                    <Badge variant="success">Terkirim</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
