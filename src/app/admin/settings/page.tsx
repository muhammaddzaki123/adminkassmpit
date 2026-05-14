'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currency';
import { Settings, DollarSign, Bell, Save, RefreshCw, AlertTriangle } from 'lucide-react';

interface Setting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  description: string | null;
}

interface WhatsAppStatusResponse {
  success: boolean;
  connected: boolean;
  ready: boolean;
  state: 'idle' | 'initializing' | 'needs_scan' | 'session_locked' | 'ready' | 'disconnected' | 'error';
  stateLabel: string;
  message?: string;
  lastError?: string | null;
  authenticatedAs?: {
    phone: string;
    name: string;
  } | null;
  sessionLocked?: boolean;
  qrPending?: boolean;
}

const EMAIL_PROVIDER_FALLBACK_SETTING: Setting = {
  id: 'virtual-email-provider',
  key: 'EMAIL_PROVIDER',
  value: 'auto',
  type: 'TEXT',
  category: 'NOTIFICATION',
  description: 'Provider email aktif untuk reset password dan notifikasi.',
};

const WA_TEMPLATE_PAYMENT_REMINDER_FALLBACK: Setting = {
  id: 'virtual-wa-template-payment-reminder',
  key: 'WA_TEMPLATE_PAYMENT_REMINDER',
  value: 'Halo {{studentName}},\n\n⏰ *PENGINGAT PEMBAYARAN*\n\nDetail tagihan:\n• Jenis: {{billingType}}\n• Jumlah: {{amount}}\n• Jatuh Tempo: {{dueDate}} ({{timeLeft}})\n\nSalam,\n*Sistem KASSMPIT*',
  type: 'TEXT',
  category: 'NOTIFICATION',
  description: 'Template WA reminder sebelum jatuh tempo. Placeholder: {{studentName}}, {{amount}}, {{billingType}}, {{dueDate}}, {{timeLeft}}, {{daysUntilDue}}',
};

const WA_TEMPLATE_PAYMENT_OVERDUE_FALLBACK: Setting = {
  id: 'virtual-wa-template-payment-overdue',
  key: 'WA_TEMPLATE_PAYMENT_OVERDUE',
  value: 'Halo {{studentName}},\n\n⚠️ *PEMBAYARAN TERLAMBAT*\n\nTagihan Anda terlambat {{daysOverdue}} hari.\n• Jenis: {{billingType}}\n• Jumlah: {{amount}}\n• Jatuh Tempo: {{dueDate}}\n\nSalam,\n*Sistem KASSMPIT*',
  type: 'TEXT',
  category: 'NOTIFICATION',
  description: 'Template WA reminder overdue. Placeholder: {{studentName}}, {{amount}}, {{billingType}}, {{dueDate}}, {{daysOverdue}}',
};

interface GroupedSettings {
  FEES: Setting[];
  NOTIFICATION: Setting[];
  SYSTEM: Setting[];
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<GroupedSettings>({
    FEES: [],
    NOTIFICATION: [],
    SYSTEM: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [resettingWhatsApp, setResettingWhatsApp] = useState(false);
  const [refreshingWhatsApp, setRefreshingWhatsApp] = useState(false);
  const [waStatus, setWaStatus] = useState<WhatsAppStatusResponse | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }

    fetchSettings();
    fetchWhatsAppStatus();
  }, [router]);

  const fetchWhatsAppStatus = async (bootstrap = false) => {
    setRefreshingWhatsApp(true);
    try {
      const url = bootstrap ? '/api/whatsapp/status?refresh=1' : '/api/whatsapp/status';
      const response = await fetchWithAuth(url);
      const result = await response.json();

      if (result.success) {
        setWaStatus(result);
      } else {
        setWaStatus({
          success: false,
          connected: false,
          ready: false,
          state: 'error',
          stateLabel: 'Error',
          message: result.error || 'Gagal memeriksa status WhatsApp',
        });
      }
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
      setWaStatus({
        success: false,
        connected: false,
        ready: false,
        state: 'error',
        stateLabel: 'Error',
        message: 'Gagal memeriksa status WhatsApp',
      });
    } finally {
      setRefreshingWhatsApp(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/settings');
      const result = await response.json();

      if (result.success && result.data) {
        const grouped = result.data.grouped || {};
        const notificationSettings = Array.isArray(grouped.NOTIFICATION) ? grouped.NOTIFICATION : [];
        const hasEmailProvider = notificationSettings.some((setting: Setting) => setting.key === 'EMAIL_PROVIDER');
        const hasReminderTemplate = notificationSettings.some((setting: Setting) => setting.key === 'WA_TEMPLATE_PAYMENT_REMINDER');
        const hasOverdueTemplate = notificationSettings.some((setting: Setting) => setting.key === 'WA_TEMPLATE_PAYMENT_OVERDUE');
        const mergedNotificationSettings = [
          ...notificationSettings,
          ...(hasEmailProvider ? [] : [EMAIL_PROVIDER_FALLBACK_SETTING]),
          ...(hasReminderTemplate ? [] : [WA_TEMPLATE_PAYMENT_REMINDER_FALLBACK]),
          ...(hasOverdueTemplate ? [] : [WA_TEMPLATE_PAYMENT_OVERDUE_FALLBACK]),
        ];

        setSettings({
          FEES: Array.isArray(grouped.FEES) ? grouped.FEES : [],
          NOTIFICATION: mergedNotificationSettings,
          SYSTEM: Array.isArray(grouped.SYSTEM) ? grouped.SYSTEM : []
        });
      } else {
        // If no data or error, set empty arrays
        setSettings({
          FEES: [],
          NOTIFICATION: [],
          SYSTEM: []
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Set empty arrays on error
      setSettings({
        FEES: [],
        NOTIFICATION: [],
        SYSTEM: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('Apakah Anda yakin ingin menginisialisasi pengaturan default? Ini akan menambahkan pengaturan baru tanpa menghapus yang sudah ada.')) {
      return;
    }

    setSeeding(true);
    try {
      const response = await fetchWithAuth('/api/admin/settings', {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        alert('Pengaturan default berhasil diinisialisasi!');
        fetchSettings();
      } else {
        alert('Gagal menginisialisasi pengaturan: ' + result.error);
      }
    } catch (error) {
      console.error('Error seeding settings:', error);
      alert('Terjadi kesalahan saat menginisialisasi pengaturan');
    } finally {
      setSeeding(false);
    }
  };

  const handleResetWhatsAppSession = async () => {
    if (!confirm('Reset WA Connection akan menghapus cache login dan menutup browser yang masih terkunci. Lanjutkan?')) {
      return;
    }

    setResettingWhatsApp(true);
    try {
      const response = await fetchWithAuth('/api/whatsapp/reset-session', {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        const killedCount = result.browserCleanup?.killed ?? 0;
        alert(`WA Connection berhasil direset. ${killedCount > 0 ? `${killedCount} proses browser dihentikan. ` : ''}Buka status WhatsApp untuk scan QR code baru.`);
        fetchWhatsAppStatus(true);
      } else {
        alert('Gagal mereset sesi WhatsApp: ' + (result.error || result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error resetting WhatsApp session:', error);
      alert('Terjadi kesalahan saat mereset sesi WhatsApp');
    } finally {
      setResettingWhatsApp(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userData = localStorage.getItem('user');
      const user = JSON.parse(userData || '{}');

      const allSettings = [
        ...settings.FEES,
        ...settings.NOTIFICATION,
        ...settings.SYSTEM
      ];

      const response = await fetchWithAuth('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: allSettings.map(s => ({
            key: s.key,
            value: s.value,
            type: s.type,
            category: s.category,
            description: s.description,
          })),
          updatedBy: user.id
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Pengaturan berhasil disimpan!');
      } else {
        alert('Gagal menyimpan pengaturan: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Terjadi kesalahan saat menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const updateSettingValue = (category: keyof GroupedSettings, key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: prev[category].map(s =>
        s.key === key ? { ...s, value } : s
      )
    }));
  };

  const formatCurrency = (value: string) => {
    return formatCurrencyInput(value);
  };

  const parseCurrency = (formatted: string) => {
    return parseCurrencyInput(formatted);
  };

  const statusTone = waStatus?.state === 'ready'
    ? 'bg-green-50 text-green-700 border-green-200'
    : waStatus?.state === 'session_locked'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : waStatus?.state === 'needs_scan'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-neutral-50 text-neutral-700 border-neutral-200';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-neutral-600">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader />

        <main className="pt-16 lg:pt-20 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                  <Settings className="w-8 h-8 text-primary-600" />
                  Pengaturan Sistem
                </h1>
                <p className="text-neutral-600 mt-1">Kelola konfigurasi biaya, notifikasi, dan sistem</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={handleSeedDefaults}
                  disabled={seeding}
                >
                  {seeding ? 'Menginisialisasi...' : 'Inisialisasi Default'}
                </Button>
                <Button
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </div>

            <Card>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-neutral-900">Perawatan WhatsApp</h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    Gunakan ini jika sesi WhatsApp terkunci, browser masih berjalan, atau QR login perlu diulang dari awal.
                  </p>
                  <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${statusTone}`}>
                    <span className="font-semibold">Status:</span>
                    <span>{waStatus?.stateLabel || 'Belum dicek'}</span>
                    {waStatus?.ready && waStatus.authenticatedAs?.name ? (
                      <span>• {waStatus.authenticatedAs.name}</span>
                    ) : null}
                  </div>
                  {waStatus?.message && (
                    <p className="text-sm text-neutral-600 mt-3">{waStatus.message}</p>
                  )}
                  {waStatus?.lastError && waStatus.state !== 'ready' && (
                    <p className="text-xs text-neutral-500 mt-2">Detail error: {waStatus.lastError}</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      variant="outline"
                      icon={<RefreshCw className="w-4 h-4" />}
                      onClick={() => fetchWhatsAppStatus(true)}
                      disabled={refreshingWhatsApp}
                    >
                      {refreshingWhatsApp ? 'Mengecek...' : 'Reconnect / Refresh Status'}
                    </Button>
                    <Button
                      variant="secondary"
                      icon={<RefreshCw className="w-4 h-4" />}
                      onClick={handleResetWhatsAppSession}
                      disabled={resettingWhatsApp}
                    >
                      {resettingWhatsApp ? 'Mereset...' : 'Reset WA Connection'}
                    </Button>
                  </div>
                  <p className="text-sm text-neutral-500 mt-3">
                    Reconnect dipakai untuk mencoba start ulang client tanpa menghapus session. Reset dipakai kalau browser lock atau auth rusak.
                  </p>
                </div>
              </div>
            </Card>

            {/* Fees Settings */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Pengaturan Biaya</h2>
                  <p className="text-sm text-neutral-600">Konfigurasi biaya pendaftaran dan pembayaran</p>
                </div>
              </div>

              <div className="space-y-4">
                {!settings.FEES || settings.FEES.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <p>Belum ada pengaturan biaya. Klik &ldquo;Inisialisasi Default&rdquo; untuk menambahkan.</p>
                  </div>
                ) : (
                  settings.FEES.map((setting) => (
                    <div key={setting.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          {setting.key.replace(/_/g, ' ')}
                        </label>
                        {setting.description && (
                          <p className="text-xs text-neutral-500">{setting.description}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          type="text"
                          value={formatCurrency(setting.value)}
                          onChange={(e) => {
                            const rawValue = parseCurrency(e.target.value);
                            updateSettingValue('FEES', setting.key, rawValue);
                          }}
                          placeholder="0"
                          prefix="Rp"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Notification Settings */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Pengaturan Notifikasi</h2>
                  <p className="text-sm text-neutral-600">Konfigurasi email dan WhatsApp notifikasi</p>
                </div>
              </div>

              <div className="space-y-4">
                {!settings.NOTIFICATION || settings.NOTIFICATION.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <p>Belum ada pengaturan notifikasi. Klik &ldquo;Inisialisasi Default&rdquo; untuk menambahkan.</p>
                  </div>
                ) : (
                  settings.NOTIFICATION.map((setting) => (
                    <div key={setting.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          {setting.key.replace(/_/g, ' ')}
                        </label>
                        {setting.description && (
                          <p className="text-xs text-neutral-500">{setting.description}</p>
                        )}
                      </div>
                      <div>
                        {setting.type === 'BOOLEAN' ? (
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={setting.value === 'true'}
                                onChange={(e) =>
                                  updateSettingValue('NOTIFICATION', setting.key, e.target.checked ? 'true' : 'false')
                                }
                              />
                              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                              <span className="ml-3 text-sm font-medium text-neutral-700">
                                {setting.value === 'true' ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </label>
                          </div>
                        ) : (
                          setting.key === 'EMAIL_PROVIDER' ? (
                            <Select
                              value={setting.value || 'auto'}
                              onChange={(e) => updateSettingValue('NOTIFICATION', setting.key, e.target.value)}
                              options={[
                                { value: 'auto', label: 'Auto (fallback berurutan)' },
                                { value: 'smtp', label: 'SMTP' },
                                { value: 'resend', label: 'Resend' },
                                { value: 'sendgrid', label: 'SendGrid' },
                              ]}
                            />
                          ) : setting.key.startsWith('WA_TEMPLATE_') ? (
                            <textarea
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                              rows={8}
                              value={setting.value}
                              onChange={(e) => updateSettingValue('NOTIFICATION', setting.key, e.target.value)}
                              placeholder="Tulis template pesan..."
                            />
                          ) : (
                            <Input
                              type="text"
                              value={setting.value}
                              onChange={(e) =>
                                updateSettingValue('NOTIFICATION', setting.key, e.target.value)
                              }
                              placeholder={setting.key.includes('KEY') ? 'Masukkan API key...' : 'Masukkan nilai...'}
                            />
                          )
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* System Settings */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Pengaturan Sistem</h2>
                  <p className="text-sm text-neutral-600">Konfigurasi umum sistem</p>
                </div>
              </div>

              <div className="space-y-4">
                {!settings.SYSTEM || settings.SYSTEM.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <p>Belum ada pengaturan sistem. Klik &ldquo;Inisialisasi Default&rdquo; untuk menambahkan.</p>
                  </div>
                ) : (
                  settings.SYSTEM.map((setting) => (
                    <div key={setting.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          {setting.key.replace(/_/g, ' ')}
                        </label>
                        {setting.description && (
                          <p className="text-xs text-neutral-500">{setting.description}</p>
                        )}
                      </div>
                      <div>
                        {setting.type === 'BOOLEAN' ? (
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={setting.value === 'true'}
                                onChange={(e) =>
                                  updateSettingValue('SYSTEM', setting.key, e.target.checked ? 'true' : 'false')
                                }
                              />
                              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                              <span className="ml-3 text-sm font-medium text-neutral-700">
                                {setting.value === 'true' ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </label>
                          </div>
                        ) : (
                          <Input
                            type="text"
                            value={setting.value}
                            onChange={(e) =>
                              updateSettingValue('SYSTEM', setting.key, e.target.value)
                            }
                            placeholder="Masukkan nilai..."
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
