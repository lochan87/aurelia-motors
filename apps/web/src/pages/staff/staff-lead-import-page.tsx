import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import type { CsvImportPreviewResponse, ExecuteCsvImportResponse } from '@aurelia/shared';
import { api } from '../../lib/api-client';
import { buttonStyles } from '../../components/ui/button-styles';

const SAMPLE_CSV_CONTENT = `customerName,phone,email,showroom,model,source,message,externalId
Aditya Verma,9876543210,aditya.verma@example.com,LKO-CENTRAL,Aurelia Solis,PORTAL_IMPORT,Interested in luxury package delivery,PORTAL-2026-001
Priya Sharma,9123456789,priya.sharma@example.com,LKO-GOMTI,Aurelia Astris,PORTAL_IMPORT,Looking for weekend test drive,PORTAL-2026-002
Rahul Tripathi,9839012345,rahul.tripathi@example.com,LKO-GOLF,Aurelia Solis,PORTAL_IMPORT,Immediate corporate purchase requirement,PORTAL-2026-003
Kavita Singh,9988776655,kavita.singh@example.com,LKO-GOMTI,Aurelia Astris,PORTAL_IMPORT,Exchange existing sedan for new EV variant,PORTAL-2026-004`;

export function StaffLeadImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filename, setFilename] = useState('leads.csv');
  const [csvContent, setCsvContent] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<CsvImportPreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecuteCsvImportResponse | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Fetch previous import batches
  const { data: batches = [], refetch: refetchBatches } = useQuery({
    queryKey: ['staff-lead-batches'],
    queryFn: () => api.getImportBatches(),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    setPreviewData(null);
    setExecutionResult(null);
    setPreviewError(null);
    setExecutionError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content || '');
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'aurelia-portal-leads-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePreview = async () => {
    setPreviewError(null);
    setExecutionResult(null);

    if (!csvContent.trim()) {
      setPreviewError('Please upload a CSV file or paste CSV content below.');
      return;
    }

    setIsPreviewing(true);
    try {
      const result = await api.previewCsvImport(csvContent);
      setPreviewData(result);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to parse CSV preview.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewData || previewData.validRows === 0) return;

    setExecutionError(null);
    setIsExecuting(true);

    try {
      // Filter valid rows for import
      const rowsToImport = previewData.preview
        .filter((r) => r.isValid && !r.isDuplicate)
        .map((r) => ({
          rowNumber: r.rowNumber,
          customerName: r.customerName,
          phone: r.phone,
          email: r.email,
          modelName: r.modelName,
          showroomName: r.showroomName,
          source: r.source || 'PORTAL_IMPORT',
          message: r.message,
          externalId: r.externalId,
        }));

      const result = await api.executeCsvImport({
        filename,
        source: 'PORTAL_IMPORT',
        rows: rowsToImport,
      });

      setExecutionResult(result);
      setPreviewData(null);
      setCsvContent('');
      refetchBatches();
    } catch (err) {
      setExecutionError(err instanceof Error ? err.message : 'Failed to execute CSV import.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/staff/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 transition-colors hover:text-ink-950"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Lead Inbox</span>
        </Link>
      </div>

      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-stone-500 uppercase">
            <FileSpreadsheet className="text-brass-600 h-4 w-4" />
            <span>Automated Portal Ingestion</span>
          </div>
          <h1 className="mt-1 font-display text-2xl tracking-tight text-ink-950 sm:text-3xl">
            Import Third-Party & Portal Leads
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Upload CSV dumps from auto aggregator portals. Runs automated deduplication, showroom
            routing, and workload-balanced assignment.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadSample}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
        >
          <Download className="text-brass-600 h-3.5 w-3.5" />
          <span>Download Sample Template</span>
        </button>
      </div>

      {/* Execution Success Card */}
      {executionResult && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-600" />
            <div className="space-y-2">
              <h3 className="font-display text-xl text-emerald-950">
                Batch Import Completed Successfully
              </h3>
              <p className="text-xs text-emerald-800">
                Batch Reference:{' '}
                <strong className="font-mono">{executionResult.batchReference}</strong>
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-xs">
                <span className="rounded-lg bg-emerald-100 px-3 py-1 font-semibold text-emerald-900">
                  {executionResult.importedCount} Leads Created & Assigned
                </span>
                <span className="rounded-lg bg-amber-100 px-3 py-1 font-semibold text-amber-900">
                  {executionResult.duplicateCount} Duplicates Skipped
                </span>
                {executionResult.failedCount > 0 && (
                  <span className="rounded-lg bg-red-100 px-3 py-1 font-semibold text-red-900">
                    {executionResult.failedCount} Failed
                  </span>
                )}
              </div>
              <div className="pt-3">
                <Link
                  to="/staff/leads"
                  className={buttonStyles({ variant: 'primary', size: 'md' })}
                >
                  View Leads in CRM Inbox →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload & CSV Input Card */}
      <div className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="font-display text-lg text-ink-950">Upload or Paste Portal CSV</h2>
          <p className="mt-1 text-xs text-stone-500">
            Accepts comma-separated values with headers:{' '}
            <code>customerName, phone, email, showroom, model, source, message, externalId</code>
          </p>
        </div>

        {/* Drag/Drop & File Input */}
        <div className="rounded-2xl border-2 border-dashed border-stone-200 p-6 text-center transition-colors hover:border-brass-400">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-file-upload"
          />
          <label htmlFor="csv-file-upload" className="block cursor-pointer space-y-2">
            <Upload className="mx-auto h-8 w-8 text-stone-400" />
            <div className="text-xs font-semibold text-ink-950">
              Click to choose a CSV file{' '}
              <span className="font-normal text-stone-500">or drag and drop</span>
            </div>
            <div className="text-[0.68rem] text-stone-400">
              {filename !== 'leads.csv' ? `Selected file: ${filename}` : 'CSV dumps up to 5MB'}
            </div>
          </label>
        </div>

        {/* Raw Text Input */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold tracking-wider text-stone-700 uppercase">
            Or Paste CSV Content Directly
          </label>
          <textarea
            value={csvContent}
            onChange={(e) => {
              setCsvContent(e.target.value);
              setPreviewData(null);
            }}
            placeholder={SAMPLE_CSV_CONTENT}
            rows={5}
            className="w-full rounded-xl border border-stone-200 p-3 font-mono text-xs text-stone-900 focus:border-brass-500 focus:outline-none"
          />
        </div>

        {previewError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{previewError}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewing || !csvContent.trim()}
            className={buttonStyles({ variant: 'primary', size: 'md' })}
          >
            {isPreviewing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating CSV Rows...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Preview & Validate Rows
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {previewData && (
        <div className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 border-b border-stone-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg text-ink-950">Validation & Duplicate Audit</h2>
              <p className="mt-1 text-xs text-stone-500">
                Review verified rows before writing to database and assigning to consultants.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-stone-100 px-3 py-1 font-semibold text-stone-700">
                Total: {previewData.totalRows}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                Valid: {previewData.validRows}
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
                Duplicates: {previewData.duplicateRows}
              </span>
              {previewData.invalidRows > 0 && (
                <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-800">
                  Invalid: {previewData.invalidRows}
                </span>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 font-semibold text-stone-600">
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Contact</th>
                  <th className="px-3 py-2.5">Model</th>
                  <th className="px-3 py-2.5">Showroom</th>
                  <th className="px-3 py-2.5">External ID</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Notes / Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {previewData.preview.map((row) => (
                  <tr key={row.rowNumber} className="hover:bg-stone-50/60">
                    <td className="px-3 py-2.5 font-mono text-stone-400">{row.rowNumber}</td>
                    <td className="px-3 py-2.5 font-semibold text-ink-950">{row.customerName}</td>
                    <td className="px-3 py-2.5 text-stone-600">
                      <div>{row.phone}</div>
                      <div className="text-[0.65rem] text-stone-400">{row.email}</div>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-stone-900">
                      {row.modelName || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-stone-700">{row.showroomName}</td>
                    <td className="px-3 py-2.5 font-mono text-stone-500">
                      {row.externalId || '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.isDuplicate ? (
                        <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.62rem] font-bold text-amber-700">
                          Duplicate
                        </span>
                      ) : row.isValid ? (
                        <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-bold text-emerald-700">
                          Valid
                        </span>
                      ) : (
                        <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[0.62rem] font-bold text-red-700">
                          Invalid
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[0.68rem] text-stone-600">
                      {row.validationError ? (
                        <span className="font-medium text-red-600">{row.validationError}</span>
                      ) : (
                        <span className="text-stone-500">
                          {row.message || 'Ready for assignment'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {executionError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {executionError}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-stone-100 pt-4">
            <span className="text-xs text-stone-500">
              Only valid, non-duplicate rows will be imported and assigned.
            </span>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isExecuting || previewData.validRows === 0}
              className={buttonStyles({ variant: 'primary', size: 'md' })}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing & Routing Leads...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm & Import {previewData.validRows} Leads
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Historical Batches Table */}
      <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-lg text-ink-950">Previous Import Batches</h2>
        <p className="text-xs text-stone-500">History of third-party portal ingestions.</p>

        {batches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 font-semibold text-stone-600">
                  <th className="px-3 py-2.5">Batch Reference</th>
                  <th className="px-3 py-2.5">Source & File</th>
                  <th className="px-3 py-2.5">Total Rows</th>
                  <th className="px-3 py-2.5">Imported</th>
                  <th className="px-3 py-2.5">Duplicates</th>
                  <th className="px-3 py-2.5">Imported By</th>
                  <th className="px-3 py-2.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/60">
                    <td className="px-3 py-2.5 font-mono font-bold text-ink-950">
                      {b.batchReference}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-stone-900">{b.source}</div>
                      <div className="text-[0.68rem] text-stone-400">{b.filename}</div>
                    </td>
                    <td className="px-3 py-2.5">{b.totalRows}</td>
                    <td className="px-3 py-2.5 font-semibold text-emerald-700">
                      {b.importedCount}
                    </td>
                    <td className="px-3 py-2.5 text-amber-700">{b.duplicateCount}</td>
                    <td className="px-3 py-2.5 text-stone-700">{b.importedBy.fullName}</td>
                    <td className="px-3 py-2.5 text-[0.68rem] text-stone-400">
                      {new Date(b.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-stone-400">
            No previous import batches found.
          </p>
        )}
      </div>
    </div>
  );
}
