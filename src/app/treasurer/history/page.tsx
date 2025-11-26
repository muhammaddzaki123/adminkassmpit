'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Filter, Calendar } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const transactions = [
    { id: '1', date: '2025-01-15', type: 'income', category: 'SPP', description: 'Ahmad Zaki - SPP Januari 2025', amount: 500000 },
    { id: '2', date: '2025-01-14', type: 'expense', category: 'Operasional', description: 'Pembelian ATK', amount: 1250000 },
    { id: '3', date: '2025-01-13', type: 'income', category: 'SPP', description: 'Siti Aisyah - SPP Januari 2025', amount: 500000 },
    { id: '4', date: '2025-01-12', type: 'expense', category: 'Utilitas', description: 'Tagihan Listrik', amount: 850000 },
    { id: '5', date: '2025-01-11', type: 'income', category: 'Daftar Ulang', description: 'Muhammad Rizki - Daftar Ulang', amount: 2000000 },
  ];

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
              <h1 className="text-3xl font-bold text-neutral-900">Riwayat Transaksi</h1>
              <p className="text-neutral-600 mt-1">Histori semua transaksi keuangan</p>
            </div>

            <Card>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Cari transaksi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                <div className="w-40">
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua' },
                      { value: 'income', label: 'Pemasukan' },
                      { value: 'expense', label: 'Pengeluaran' },
                    ]}
                  />
                </div>
                <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
                  Filter
                </Button>
              </div>
            </Card>

            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card key={transaction.id} padding="md" className="hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <Calendar className={`w-5 h-5 ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-neutral-600">{transaction.date}</p>
                          <Badge variant={transaction.type === 'income' ? 'success' : 'error'}>
                            {transaction.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <p className={`text-xl font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
