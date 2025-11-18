'use client';

import { useState, useCallback } from 'react';
import { useBulkUploadPassengers } from '@/hooks/mutations/use-bulk-upload-passengers';
import { useDownloadTemplate } from '@/hooks/queries/use-download-template';
import { Button } from '@/components/ui/button';
import { X, Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * T295-T302: CsvUploadDialog Component
 * CSV 일괄 업로드 다이얼로그
 */

interface CsvUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  institutionId: string;
}

interface BulkUploadRowError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

interface UploadResult {
  created: number;
  skipped: number;
  errors: BulkUploadRowError[];
  totalProcessed: number;
}

export function CsvUploadDialog({ isOpen, onClose, institutionId }: CsvUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true); // T301: Duplicate handling option
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useBulkUploadPassengers();
  const { downloadTemplate } = useDownloadTemplate();

  // T296: Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find((file) => file.name.endsWith('.csv'));

    if (csvFile) {
      setSelectedFile(csvFile);
      setUploadResult(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const result = await uploadMutation.mutateAsync({
      file: selectedFile,
      institutionId,
      skipDuplicates,
    });

    setUploadResult(result);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadResult(null);
    onClose();
  };

  // T302: Download errors as CSV
  const downloadErrors = () => {
    if (!uploadResult || uploadResult.errors.length === 0) return;

    const csvContent = [
      'Row,Field,Message,Value',
      ...uploadResult.errors.map((err) =>
        [err.row, err.field, err.message, err.value || ''].join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'upload-errors.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">CSV 일괄 업로드</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* T297: Template Download Button */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-blue-900">CSV 템플릿 다운로드</h3>
                <p className="text-sm text-blue-700 mt-1">
                  샘플 데이터가 포함된 템플릿을 다운로드하세요
                </p>
              </div>
              <Button
                onClick={downloadTemplate}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Download className="h-4 w-4 mr-2" />
                다운로드
              </Button>
            </div>
          </div>

          {/* T301: Skip Duplicates Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="skipDuplicates"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="skipDuplicates" className="text-sm text-gray-700">
              중복 전화번호 자동 건너뛰기 (권장)
            </label>
          </div>

          {/* T296: File Input with Drag & Drop */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <Upload className={`mx-auto h-12 w-12 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />
            <p className="mt-4 text-sm text-gray-600">
              {selectedFile ? (
                <span className="font-medium text-indigo-600">{selectedFile.name}</span>
              ) : (
                <>
                  CSV 파일을 드래그하거나{' '}
                  <label className="text-indigo-600 hover:text-indigo-500 cursor-pointer font-medium">
                    클릭하여 선택
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-gray-500">최대 5MB, 1000행 제한</p>
          </div>

          {/* T298: Upload Progress Indicator */}
          {uploadMutation.isPending && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span className="text-sm text-gray-700">업로드 중...</span>
              </div>
            </div>
          )}

          {/* T299-T300: Upload Result Display */}
          {uploadResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">생성됨</p>
                      <p className="text-2xl font-bold text-green-600">{uploadResult.created}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">건너뜀</p>
                      <p className="text-2xl font-bold text-yellow-600">{uploadResult.skipped}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-900">오류</p>
                      <p className="text-2xl font-bold text-red-600">{uploadResult.errors.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* T300: Error Table */}
              {uploadResult.errors.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">오류 상세</h4>
                    <Button
                      onClick={downloadErrors}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      오류 다운로드
                    </Button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            행
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            필드
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            오류 메시지
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {uploadResult.errors.map((error, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm text-gray-900">{error.row}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{error.field}</td>
                            <td className="px-4 py-2 text-sm text-red-600">{error.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 flex justify-end space-x-3">
          <Button onClick={handleClose} variant="outline">
            {uploadResult ? '닫기' : '취소'}
          </Button>
          {!uploadResult && (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              업로드
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
