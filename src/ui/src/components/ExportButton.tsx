import React, { useState } from 'react';
import { Download, FileText, FileJson, FileSpreadsheet, Loader } from 'lucide-react';
import { downloadFile, getSystemInfo, exportToMarkdown, exportToJSON, exportToCSV } from '../utils/exportUtils';
import { notifications } from '../utils/notifications';
import Button from './Button';

export interface ExportButtonProps {
  data: any;
  filename: string;
  formats?: ('markdown' | 'json' | 'csv')[];
  includeSystemInfo?: boolean;
  metadata?: Record<string, any>;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  onExport?: (format: string) => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename,
  formats = ['markdown', 'json'],
  includeSystemInfo = false,
  metadata,
  variant = 'secondary',
  size = 'md',
  label = 'Export',
  onExport,
}) => {
  const [exporting, setExporting] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const handleExport = async (format: 'markdown' | 'json' | 'csv') => {
    setExporting(true);
    try {
      const systemInfo = includeSystemInfo ? getSystemInfo() : undefined;
      let content: string;
      let fileExtension: string;
      let mimeType: string;

      switch (format) {
        case 'markdown':
          content = typeof data === 'string' 
            ? exportToMarkdown(filename, data, metadata, systemInfo)
            : exportToMarkdown(filename, JSON.stringify(data, null, 2), metadata, systemInfo);
          fileExtension = 'md';
          mimeType = 'text/markdown';
          break;
        case 'json':
          content = exportToJSON(data, systemInfo);
          fileExtension = 'json';
          mimeType = 'application/json';
          break;
        case 'csv':
          if (Array.isArray(data) && data.length > 0) {
            const headers = Object.keys(data[0]);
            const rows = data.map(item => Object.values(item));
            content = exportToCSV(headers, rows);
          } else {
            throw new Error('CSV export requires array data');
          }
          fileExtension = 'csv';
          mimeType = 'text/csv';
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      const fullFilename = `${filename}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      downloadFile(content, fullFilename, mimeType);

      notifications.show({
        message: `Exported to ${format.toUpperCase()}`,
        color: 'success',
      });

      onExport?.(format);
    } catch (error: any) {
      notifications.show({
        message: `Export failed: ${error.message}`,
        color: 'error',
      });
    } finally {
      setExporting(false);
      setShowFormatMenu(false);
    }
  };

  if (formats.length === 1) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport(formats[0])}
        loading={exporting}
        icon={Download}
      >
        {label}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowFormatMenu(!showFormatMenu)}
        loading={exporting}
        icon={Download}
      >
        {label}
      </Button>
      {showFormatMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowFormatMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-base-200 border border-base-300 rounded-lg shadow-lg z-20">
            <div className="p-2 space-y-1">
              {formats.includes('markdown') && (
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-base-300 rounded"
                  onClick={() => handleExport('markdown')}
                >
                  <FileText size={16} />
                  Export as Markdown
                </button>
              )}
              {formats.includes('json') && (
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-base-300 rounded"
                  onClick={() => handleExport('json')}
                >
                  <FileJson size={16} />
                  Export as JSON
                </button>
              )}
              {formats.includes('csv') && (
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-base-300 rounded"
                  onClick={() => handleExport('csv')}
                >
                  <FileSpreadsheet size={16} />
                  Export as CSV
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
