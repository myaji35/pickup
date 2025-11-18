import { toast } from 'sonner';

/**
 * T294: useDownloadTemplate
 * CSV 템플릿 다운로드 함수
 * Note: 파일 다운로드는 query보다 imperative 함수가 적합
 */

export function useDownloadTemplate() {
  const downloadTemplate = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/passengers/template/csv`);

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'passenger-template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Failed to download template');
      throw error;
    }
  };

  return { downloadTemplate };
}
