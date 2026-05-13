'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { X, Check, AlertCircle, Loader } from 'lucide-react';

interface BulkAssignClassModalProps {
  isOpen: boolean;
  selectedCount: number;
  studentIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ClassOption {
  id: string;
  name: string;
  grade: string;
}

interface AcademicYearOption {
  id: string;
  year: string;
  isActive: boolean;
}

interface BulkAssignResult {
  success: boolean;
  message: string;
  data?: {
    assignedCount?: number;
    failedCount?: number;
    errors?: string[];
  };
}

export function BulkAssignClassModal({
  isOpen,
  selectedCount,
  studentIds,
  onClose,
  onSuccess,
}: BulkAssignClassModalProps) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [result, setResult] = useState<BulkAssignResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  const fetchOptions = async () => {
    try {
      setIsLoadingOptions(true);
      setError(null);

      const [classesRes, yearsRes] = await Promise.all([
        fetchWithAuth('/api/admin/classes'),
        fetchWithAuth('/api/admin/academic-years'),
      ]);

      if (classesRes.ok) {
        const classData = await classesRes.json();
        setClasses(classData.data || []);
      }

      if (yearsRes.ok) {
        const yearData = await yearsRes.json();
        const activeYear = yearData.data?.find((y: AcademicYearOption) => y.isActive);
        setAcademicYears(yearData.data || []);
        if (activeYear) {
          setSelectedAcademicYearId(activeYear.id);
        }
      }
    } catch (err) {
      console.error('Error fetching options:', err);
      setError('Gagal memuat data kelas dan tahun ajaran');
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedClassId) {
      setError('Pilih kelas terlebih dahulu');
      return;
    }

    if (!selectedAcademicYearId) {
      setError('Pilih tahun ajaran terlebih dahulu');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const response = await fetchWithAuth('/api/admin/students/bulk-assign-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds,
          classId: selectedClassId,
          academicYearId: selectedAcademicYearId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal assign kelas');
      }

      setResult(data);
      if (data.success) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">
              Assign Kelas Massal
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-100 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                Anda akan assign <strong>{selectedCount} siswa</strong> ke kelas yang dipilih
              </p>
            </div>

            {/* Result Success */}
            {result?.success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex gap-2">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-900">{result.message}</p>
                  {result.data?.errors && result.data.errors.length > 0 && (
                    <p className="text-xs text-emerald-700 mt-1">
                      {result.data.failedCount} siswa gagal di-assign
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-900">{error}</p>
              </div>
            )}

            {/* Loading Options */}
            {isLoadingOptions && (
              <div className="text-center py-4">
                <Loader className="w-5 h-5 animate-spin mx-auto text-neutral-500" />
                <p className="text-sm text-neutral-500 mt-2">Memuat data...</p>
              </div>
            )}

            {/* Selects */}
            {!isLoadingOptions && !result?.success && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Tahun Ajaran
                  </label>
                  <Select
                    value={selectedAcademicYearId}
                    onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                    options={[
                      { value: '', label: 'Pilih tahun ajaran...' },
                      ...academicYears.map((y) => ({
                        value: y.id,
                        label: `${y.year}${y.isActive ? ' (Aktif)' : ''}`,
                      })),
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Kelas
                  </label>
                  <Select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    options={[
                      { value: '', label: 'Pilih kelas...' },
                      ...classes.map((c) => ({
                        value: c.id,
                        label: `${c.grade} - ${c.name}`,
                      })),
                    ]}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-neutral-200">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Batal
            </Button>
            {!result?.success && (
              <Button
                onClick={handleAssign}
                disabled={isLoading || isLoadingOptions}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  'Assign Kelas'
                )}
              </Button>
            )}
            {result?.success && (
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Tutup
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
