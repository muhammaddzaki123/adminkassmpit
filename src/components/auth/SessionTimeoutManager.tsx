'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearClientAuthSession } from '@/lib/client-auth';
import { Button } from '@/components/ui/Button';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const WARNING_WINDOW_MS = 60 * 1000;
const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'auth:lastActivityAt';
const SESSION_STARTED_KEY = 'auth:sessionStartedAt';
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'focus'] as const;

function readTimestamp(key: string): number | null {
  const value = window.localStorage.getItem(key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function SessionTimeoutManager() {
  const router = useRouter();
  const warningTimerRef = useRef<number | null>(null);
  const logoutTimerRef = useRef<number | null>(null);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      window.clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    setIsWarningVisible(false);
    await clearClientAuthSession();
    router.replace('/auth/login');
  }, [clearTimers, router]);

  const scheduleTimeouts = useCallback(() => {
    clearTimers();

    const sessionStartedAt = readTimestamp(SESSION_STARTED_KEY);
    const lastActivityAt = readTimestamp(LAST_ACTIVITY_KEY) ?? Date.now();

    if (!sessionStartedAt) {
      return;
    }

    const now = Date.now();
    const idleDeadline = lastActivityAt + IDLE_TIMEOUT_MS;
    const absoluteDeadline = sessionStartedAt + ABSOLUTE_TIMEOUT_MS;
    const logoutAt = Math.min(idleDeadline, absoluteDeadline);

    if (logoutAt <= now) {
      void handleLogout();
      return;
    }

    const warningDelay = Math.max(logoutAt - WARNING_WINDOW_MS - now, 0);
    const warningText = logoutAt === idleDeadline
      ? 'Sesi akan berakhir karena tidak ada aktivitas.'
      : 'Sesi akan berakhir karena batas waktu maksimum telah tercapai.';

    if (warningDelay === 0) {
      setWarningMessage(warningText);
      setIsWarningVisible(true);
    } else {
      warningTimerRef.current = window.setTimeout(() => {
        setWarningMessage(warningText);
        setIsWarningVisible(true);
      }, warningDelay);
    }

    logoutTimerRef.current = window.setTimeout(() => {
      void handleLogout();
    }, logoutAt - now);
  }, [clearTimers, handleLogout]);

  const handleActivity = useCallback(() => {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));

    if (isWarningVisible) {
      setIsWarningVisible(false);
    }

    scheduleTimeouts();
  }, [isWarningVisible, scheduleTimeouts]);

  useEffect(() => {
    const hasUser = Boolean(window.localStorage.getItem('user'));
    if (!hasUser) {
      clearTimers();
      setIsWarningVisible(false);
      return;
    }

    const now = Date.now();
    if (!window.localStorage.getItem(SESSION_STARTED_KEY)) {
      window.localStorage.setItem(SESSION_STARTED_KEY, String(now));
    }

    if (!window.localStorage.getItem(LAST_ACTIVITY_KEY)) {
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    }

    scheduleTimeouts();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearTimers, handleActivity, scheduleTimeouts]);

  if (!isWarningVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-neutral-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">Peringatan sesi</p>
        <h2 className="mt-2 text-2xl font-bold text-neutral-900">Sesi akan segera berakhir</h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">{warningMessage}</p>
        <p className="mt-3 text-sm text-neutral-600">Klik tetap masuk untuk memperpanjang sesi, atau logout untuk mengakhirinya sekarang.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" className="flex-1" onClick={() => void handleLogout()}>
            Logout Sekarang
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => {
            setIsWarningVisible(false);
            window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
            scheduleTimeouts();
          }}>
            Tetap Masuk
          </Button>
        </div>
      </div>
    </div>
  );
}