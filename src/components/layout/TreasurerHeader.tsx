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
      
      if (paymentsData.success) {
        const payments = paymentsData.data || [];
        incomeToday = payments
          .filter((p: { paidAt?: string }) => {
            if (!p.paidAt) return false;
            const paidDate = new Date(p.paidAt);
            return paidDate >= startOfDay;
          })
          .reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
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
      }
      
      setTodayIncome(incomeToday);
      setTodayExpense(expenseToday);
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
    <header className="h-16 bg-white border-b border-neutral-200 fixed top-0 left-64 right-0 z-40 shadow-soft">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-neutral-700" />
        </button>

        {/* Quick Stats */}
        <div className="hidden md:flex items-center gap-6">
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
