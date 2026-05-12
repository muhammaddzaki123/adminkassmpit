'use client';

import React, { useState } from 'react';
import { ChevronDown, Copy, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

export type AuditRawValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: AuditRawValue }
  | AuditRawValue[];

interface AuditEvent {
  source: string;
  status: string;
  message?: string | null;
  recordedAt: string;
  raw?: AuditRawValue | null;
}

interface AuditPayload {
  updatedAt: string;
  events: AuditEvent[];
}

interface AuditPayloadViewerProps {
  payload: AuditPayload | null;
}

const getStatusIcon = (status: string) => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('success') || lowerStatus.includes('completed') || lowerStatus.includes('approved')) {
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  }
  if (lowerStatus.includes('pending') || lowerStatus.includes('process') || lowerStatus.includes('waiting')) {
    return <Clock className="w-5 h-5 text-blue-600" />;
  }
  if (lowerStatus.includes('warning') || lowerStatus.includes('retry')) {
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  }
  if (lowerStatus.includes('failed') || lowerStatus.includes('error') || lowerStatus.includes('failed')) {
    return <XCircle className="w-5 h-5 text-red-600" />;
  }
  return <Clock className="w-5 h-5 text-neutral-600" />;
};

const getStatusColor = (status: string): string => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('success') || lowerStatus.includes('completed') || lowerStatus.includes('approved')) {
    return 'bg-green-50 border-green-200';
  }
  if (lowerStatus.includes('pending') || lowerStatus.includes('process') || lowerStatus.includes('waiting')) {
    return 'bg-blue-50 border-blue-200';
  }
  if (lowerStatus.includes('warning') || lowerStatus.includes('retry')) {
    return 'bg-yellow-50 border-yellow-200';
  }
  if (lowerStatus.includes('failed') || lowerStatus.includes('error')) {
    return 'bg-red-50 border-red-200';
  }
  return 'bg-neutral-50 border-neutral-200';
};

const getStatusTextColor = (status: string): string => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('success') || lowerStatus.includes('completed') || lowerStatus.includes('approved')) {
    return 'text-green-900';
  }
  if (lowerStatus.includes('pending') || lowerStatus.includes('process') || lowerStatus.includes('waiting')) {
    return 'text-blue-900';
  }
  if (lowerStatus.includes('warning') || lowerStatus.includes('retry')) {
    return 'text-yellow-900';
  }
  if (lowerStatus.includes('failed') || lowerStatus.includes('error')) {
    return 'text-red-900';
  }
  return 'text-neutral-900';
};

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const formatTime = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const isPlainObject = (value: AuditRawValue): value is { [key: string]: AuditRawValue } => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const formatPrimitive = (value: string | number | boolean | null) => {
  if (value === null) return '-';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  return String(value);
};

function AuditValueView({ value, isNested = false }: { value: AuditRawValue; isNested?: boolean }) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-neutral-500">Kosong</span>;
    }

    // Check if array contains simple objects (for compact display)
    const isSimpleObjectArray = value.every(item => isPlainObject(item));
    const hasOnlyTwoFields = isSimpleObjectArray && value.every(item => Object.keys(item as { [key: string]: AuditRawValue }).length <= 2);

    // Special compact layout untuk arrays like VA_NUMBERS
    if (isSimpleObjectArray && hasOnlyTwoFields) {
      return (
        <div className="space-y-2">
          <div className="space-y-2">
            {value.map((item, index) => {
              const obj = item as { [key: string]: AuditRawValue };
              const entries = Object.entries(obj);
              
              return (
                <div key={index} className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2 hover:border-blue-300 transition-colors">
                  {entries.map(([key, val]) => {
                    // Type guard untuk ensure val adalah primitive
                    const isPrimitive = typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean' || val === null;
                    
                    return (
                      <div key={key} className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-0.5">{key}</p>
                        <p className="text-xs font-medium text-neutral-900 wrap-break-word">
                          {isPrimitive ? formatPrimitive(val) : '[Data Kompleks]'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Default array rendering for complex items
    return (
      <div className="space-y-2">
        <p className="text-xs text-neutral-500 font-medium">{value.length} item</p>
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={index} className="rounded-lg border border-neutral-200 bg-white p-2 hover:border-neutral-300 transition-colors">
              <AuditValueView value={item} isNested={true} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      return <span className="text-neutral-500">Tidak ada detail</span>;
    }

    // Gunakan grid 2 kolom untuk nested objects agar lebih compact
    const gridClass = isNested ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : 'space-y-3';

    return (
      <div className={isNested ? gridClass : 'space-y-3'}>
        {entries.map(([key, nestedValue]) => (
          <div key={key} className={`rounded-lg border border-neutral-200 ${isNested ? 'bg-white' : 'bg-neutral-50'} ${isNested ? 'p-2' : 'p-3'}`}>
            <p className={`font-semibold uppercase tracking-[0.12em] text-neutral-500 ${isNested ? 'text-[10px] mb-1' : 'text-[11px]'}`}>{key}</p>
            <div className={`text-neutral-900 ${isNested ? 'text-xs' : 'text-sm mt-1'}`}>
              {Array.isArray(nestedValue) || isPlainObject(nestedValue) ? (
                <AuditValueView value={nestedValue} isNested={true} />
              ) : (
                <span className="wrap-break-word">{formatPrimitive(nestedValue)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="wrap-break-word">{formatPrimitive(value)}</span>;
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg text-sm z-50';
    toast.textContent = 'Disalin ke clipboard!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  });
};

export function AuditPayloadViewer({ payload }: AuditPayloadViewerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!payload || !payload.events || payload.events.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center text-neutral-600">
        <p className="text-sm">Tidak ada audit payload tersedia</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header dengan Last Updated */}
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">
            Terakhir Diperbarui
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {formatDate(payload.updatedAt)}
          </p>
        </div>
        <button
          onClick={() => copyToClipboard(JSON.stringify(payload, null, 2))}
          className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 transition-colors"
          title="Salin semua data ke clipboard"
        >
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">Salin</span>
        </button>
      </div>

      {/* Events Timeline */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">
          {payload.events.length} Event Audit
        </p>

        {payload.events.map((event, index) => (
          <div
            key={index}
            className={`rounded-lg border transition-all ${
              expandedIndex === index
                ? 'border-neutral-300 bg-white shadow-sm'
                : `border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-white cursor-pointer ${getStatusColor(
                    event.status
                  )}`
            }`}
          >
            {/* Event Header */}
            <button
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-neutral-100/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getStatusIcon(event.status)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-neutral-900 truncate">
                      {event.source || 'Unknown Source'}
                    </p>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(event.status)} ${getStatusTextColor(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-600">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(event.recordedAt)}</span>
                  </div>
                </div>
              </div>

              <ChevronDown
                className={`w-5 h-5 text-neutral-600 transition-transform shrink-0 ${
                  expandedIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Event Content (Expanded) */}
            {expandedIndex === index && (
              <div className="border-t border-neutral-200 bg-neutral-50/50 px-4 py-3 space-y-3">
                {/* Grid kompak untuk Waktu dan Sumber */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Timestamp */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600 mb-1">
                      Waktu Tercatat
                    </p>
                    <p className="text-sm text-neutral-900 break-all">
                      {formatDate(event.recordedAt)}
                    </p>
                  </div>

                  {/* Event Source Info */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600 mb-1">
                      Sumber Event
                    </p>
                    <p className="text-sm font-medium text-neutral-900">{event.source}</p>
                  </div>
                </div>

                {/* Message */}
                {event.message && typeof event.message === 'string' && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600 mb-1">
                      Pesan
                    </p>
                    <div className={`rounded-lg p-3 text-sm ${getStatusColor(event.status)} ${getStatusTextColor(event.status)} wrap-break-word`}>
                      {event.message as unknown as React.ReactNode}
                    </div>
                  </div>
                )}

                {/* Raw Data (if available and complex) */}
                {event.raw && typeof event.raw === 'object' && Object.keys(event.raw).length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">
                        Data Teknis
                      </p>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(event.raw, null, 2))}
                        className="text-xs px-2 py-1 rounded bg-neutral-200 text-neutral-700 hover:bg-neutral-300 transition-colors flex items-center gap-1"
                        title="Salin data mentah"
                      >
                        <Copy className="w-3 h-3" />
                        <span className="hidden sm:inline">Salin</span>
                      </button>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2 space-y-2">
                      <AuditValueView value={event.raw} isNested={true} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <div className="text-center">
          <p className="text-xs text-neutral-600">Total Event</p>
          <p className="text-lg font-bold text-neutral-900">{payload.events.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-600">Sukses</p>
          <p className="text-lg font-bold text-green-600">
            {payload.events.filter((e) =>
              e.status.toLowerCase().includes('success') ||
              e.status.toLowerCase().includes('completed') ||
              e.status.toLowerCase().includes('approved')
            ).length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-600">Gagal/Warning</p>
          <p className="text-lg font-bold text-red-600">
            {payload.events.filter((e) =>
              e.status.toLowerCase().includes('failed') ||
              e.status.toLowerCase().includes('error') ||
              e.status.toLowerCase().includes('warning')
            ).length}
          </p>
        </div>
      </div>
    </div>
  );
}
