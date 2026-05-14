'use client';

import { useEffect, useState } from 'react';
import { Menu, Bell, DollarSign } from 'lucide-react';

interface TreasurerHeaderProps {
  onMenuClick?: () => void;
}

export function TreasurerHeader({ onMenuClick }: TreasurerHeaderProps) {
  const [userName, setUserName] = useState('Bendahara');
  const [todayIncome, setTodayIncome] = useState(0);
  const [todayExpense, setTodayExpense] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.nama || 'Bendahara');
    }
    
    fetchTodayStats();
  }, []);

  const fetchTodayStats = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      
      // Fetch today's payments
      const paymentsRes = await fetch('/api/spp-payments?status=COMPLETED');
      const paymentsData = await paymentsRes.json();
      
      // Fetch today's expenses
      const expensesRes = await fetch('/api/expenses?status=APPROVED');
      const expensesData = await expensesRes.json();
      
      let incomeToday = 0;
      let expenseToday = 0;
      let totalIncome = 0;
      let totalExpense = 0;
      
      if (paymentsData.success) {
        const payments = paymentsData.data || [];
        incomeToday = payments
          .filter((p: { paidAt?: string }) => {
            if (!p.paidAt) return false;
            const paidDate = new Date(p.paidAt);
            return paidDate >= startOfDay;
          })
          .reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
        totalIncome = payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
      }
      
      if (expensesData.success) {
        const expenses = expensesData.data || [];
        expenseToday = expenses
          .filter((e: { date?: string }) => {
            if (!e.date) return false;
            const expenseDate = new Date(e.date);
            return expenseDate >= startOfDay;
          })
          .reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
        totalExpense = expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
      }
      
      setTodayIncome(incomeToday);
      setTodayExpense(expenseToday);
      setTotalBalance(totalIncome - totalExpense);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching today stats:', error);
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

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-white/95 backdrop-blur-xl border-b border-neutral-200 z-40 shadow-soft">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-neutral-700" />
        </button>

        <div className="hidden md:flex items-center gap-3">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 leading-tight">
            <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Operasional Bendahara</p>
            <p className="text-sm font-semibold text-neutral-800">SMP IT ANAK SOLEH MATARAM</p>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Pemasukan Hari Ini</p>
              {loading ? (
                <div className="h-5 w-24 bg-neutral-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-sm font-bold text-neutral-900">{formatCurrency(todayIncome)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-red-50 rounded-lg">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Pengeluaran Hari Ini</p>
              {loading ? (
                <div className="h-5 w-24 bg-neutral-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-sm font-bold text-neutral-900">{formatCurrency(todayExpense)}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Saldo Kas Tersedia</p>
              {loading ? (
                <div className="h-5 w-24 bg-neutral-200 animate-pulse rounded"></div>
              ) : (
                <p className={`text-sm font-bold ${totalBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(totalBalance)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-neutral-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-neutral-900">{userName}</p>
              <p className="text-xs text-neutral-600">Bendahara</p>
            </div>
            <div className="w-10 h-10 bg-linear-to-br from-primary to-primary-700 rounded-full flex items-center justify-center shadow-soft">
              <span className="text-white font-bold text-sm">{userName.charAt(0)}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
