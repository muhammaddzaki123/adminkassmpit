'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { X, Plus, Trash2, Search } from 'lucide-react';

interface ClassMember {
  id: string;
  nama: string;
  nisn: string;
  status: string;
}

interface AvailableStudent {
  id: string;
  nama: string;
  nisn: string;
  status: string;
}

interface ManageClassMembersModalProps {
  isOpen: boolean;
  classId: string;
  className: string;
  maxCapacity: number | null;
  onClose: () => void;
  onMembersUpdated?: () => void;
}

export function ManageClassMembersModal({
  isOpen,
  classId,
  className,
  maxCapacity,
  onClose,
  onMembersUpdated,
}: ManageClassMembersModalProps) {
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/admin/classes/${classId}/members`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal memuat anggota kelas');
      }
      setMembers(result.data || []);
      setIsAddingMode(false);
      setSelectedStudentIds(new Set());
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Gagal memuat anggota kelas',
      });
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, loadMembers]);

  const loadAvailableStudents = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/admin/classes/${classId}/available-students`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal memuat daftar siswa');
      }
      setAvailableStudents(result.data || []);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Gagal memuat daftar siswa',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddModeToggle = () => {
    if (!isAddingMode) {
      loadAvailableStudents();
    }
    setIsAddingMode(!isAddingMode);
    setSelectedStudentIds(new Set());
    setSearchQuery('');
    setMessage(null);
  };

  const toggleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudentIds);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudentIds(newSelected);
  };

  const filteredAvailableStudents = availableStudents.filter((student) =>
    searchQuery === '' ||
    student.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.nisn.includes(searchQuery)
  );

  const handleAddMembers = async () => {
    if (selectedStudentIds.size === 0) {
      setMessage({ type: 'error', text: 'Pilih minimal 1 siswa' });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetchWithAuth(`/api/admin/classes/${classId}/add-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudentIds),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal menambah siswa');
      }

      setMessage({
        type: 'success',
        text: `${result.data.addedCount} siswa berhasil ditambahkan`,
      });
      setSelectedStudentIds(new Set());
      setIsAddingMode(false);
      await loadMembers();
      onMembersUpdated?.();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Gagal menambah siswa',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    const confirmed = confirm(`Hapus ${memberName} dari kelas ini?`);
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const response = await fetchWithAuth(`/api/admin/classes/${classId}/remove-member/${memberId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal menghapus anggota');
      }

      setMessage({ type: 'success', text: `${memberName} berhasil dihapus dari kelas` });
      await loadMembers();
      onMembersUpdated?.();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Gagal menghapus anggota',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const isFull = maxCapacity ? members.length >= maxCapacity : false;
  const spotsAvailable = maxCapacity ? maxCapacity - members.length : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900">Kelola Anggota - {className}</h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              {members.length} siswa
              {spotsAvailable !== null && ` / ${maxCapacity} (${spotsAvailable} tersisa)`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-3 p-2 sm:p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Content */}
        {isAddingMode ? (
          // Add Members Mode
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-2">Cari dan pilih siswa untuk ditambahkan:</label>
              <Input
                placeholder="Cari nama atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>

            {isLoading ? (
              <p className="text-sm text-neutral-500 text-center py-4">Memuat daftar siswa...</p>
            ) : filteredAvailableStudents.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">
                {availableStudents.length === 0 ? 'Semua siswa sudah masuk kelas ini' : 'Tidak ada hasil pencarian'}
              </p>
            ) : (
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {filteredAvailableStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-2 p-2 hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.has(student.id)}
                      onChange={() => toggleSelectStudent(student.id)}
                      className="rounded border-neutral-300"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{student.nama}</p>
                      <p className="text-xs text-neutral-500">NISN: {student.nisn}</p>
                    </div>
                    <Badge
                      variant={student.status === 'ACTIVE' ? 'success' : 'warning'}
                      className="shrink-0"
                    >
                      {student.status === 'ACTIVE' ? 'Aktif' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {selectedStudentIds.size > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddModeToggle}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddMembers}
                  isLoading={isProcessing}
                  className="flex-1"
                  icon={<Plus className="w-4 h-4" />}
                >
                  Tambah {selectedStudentIds.size} Siswa
                </Button>
              </div>
            )}
          </div>
        ) : (
          // View Members Mode
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-neutral-500 text-center py-4">Memuat anggota kelas...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">Belum ada anggota di kelas ini</p>
            ) : (
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-2 p-2 hover:bg-neutral-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{member.nama}</p>
                      <p className="text-xs text-neutral-500">NISN: {member.nisn}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={member.status === 'ACTIVE' ? 'success' : 'warning'}
                      >
                        {member.status === 'ACTIVE' ? 'Aktif' : 'Pending'}
                      </Badge>
                      <button
                        onClick={() => handleRemoveMember(member.id, member.nama)}
                        disabled={isProcessing}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
                        title="Hapus dari kelas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isFull && (
              <Button
                size="sm"
                onClick={handleAddModeToggle}
                className="w-full"
                icon={<Plus className="w-4 h-4" />}
              >
                Tambah Siswa
              </Button>
            )}

            {isFull && (
              <div className="p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                ⚠️ Kelas sudah penuh ({members.length}/{maxCapacity})
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
