import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { ProcessingItem, SourceType } from "../types";
import { 
  Upload, 
  FileText, 
  HelpCircle, 
  Check, 
  AlertTriangle, 
  Loader2, 
  Table, 
  Trash2, 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Briefcase 
} from "lucide-react";

interface UploadQueueProps {
  processingQueue: ProcessingItem[];
  onUploadFiles: (files: FileList | File[]) => void;
  onExtractPastedText: (text: string) => void;
  onClearQueueItem: (id: string) => void;
  onCommitBulkCsv: (records: any[]) => void;
  isQueueLoading: boolean;
}

export default function UploadQueue({
  processingQueue,
  onUploadFiles,
  onExtractPastedText,
  onClearQueueItem,
  onCommitBulkCsv,
  isQueueLoading
}: UploadQueueProps) {
  const [pastedText, setPastedText] = useState("");
  const [showPastedInput, setShowPastedInput] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [csvMapping, setCsvMapping] = useState({
    amount: -1,
    vendor: -1,
    category: -1,
    date: -1,
    summary: -1
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Drag and Drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add("border-slate-800", "bg-slate-50/50");
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-slate-800", "bg-slate-50/50");
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-slate-800", "bg-slate-50/50");
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileIngestion(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileIngestion(e.target.files);
    }
  };

  // Dispatch files correctly
  const handleFileIngestion = (fileList: FileList) => {
    const csvCandidate = Array.from(fileList).find(f => f.name.endsWith(".csv"));
    if (csvCandidate) {
      // Process CSV locally first with Column Mapper
      parseCsvFile(csvCandidate);
    } else {
      onUploadFiles(fileList);
    }
  };

  // CSV parsing logic
  const parseCsvFile = (file: File) => {
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length > 0) {
        // Simple CSV splitter handling quotes
        const splitCsvLine = (line: string) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = splitCsvLine(lines[0]);
        const rows = lines.slice(1, 6).map(line => splitCsvLine(line)); // Preview first 5 rows
        setCsvHeaders(headers);
        setCsvRows(rows);

        // Auto-guess indices based on matches
        const guessMapping = {
          amount: headers.findIndex(h => /amount|total|sum|price/i.test(h)),
          vendor: headers.findIndex(h => /vendor|merchant|seller|supplier|payee/i.test(h)),
          category: headers.findIndex(h => /category|type|tag/i.test(h)),
          date: headers.findIndex(h => /date|time|transaction/i.test(h)),
          summary: headers.findIndex(h => /summary|notes|memo|description/i.test(h))
        };
        setCsvMapping(guessMapping);
      }
    };
    reader.readAsText(file);
  };

  const handleCommitCsv = () => {
    if (!csvFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length > 1) {
        const splitCsvLine = (line: string) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const records: any[] = [];
        lines.slice(1).forEach((line, index) => {
          const cells = splitCsvLine(line);
          if (cells.length === 0 || cells.join("").trim() === "") return;

          const rawAmount = csvMapping.amount !== -1 ? parseFloat(cells[csvMapping.amount]?.replace(/[^0-9.]/g, "") || "0") : 0;
          const vendor = csvMapping.vendor !== -1 ? cells[csvMapping.vendor] || "Unknown Vendor" : "Imported Merchant";
          const category = csvMapping.category !== -1 ? cells[csvMapping.category] || "Miscellaneous" : "Miscellaneous";
          
          // Re-format dates clean
          let dateStr = "2026-06-20";
          if (csvMapping.date !== -1 && cells[csvMapping.date]) {
            const rawDate = cells[csvMapping.date];
            // If matches MM/DD/YYYY, convert to YYYY-MM-DD
            const slashed = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (slashed) {
              dateStr = `${slashed[3]}-${slashed[1].padStart(2, '0')}-${slashed[2].padStart(2, '0')}`;
            } else {
              dateStr = rawDate;
            }
          }

          const summary = csvMapping.summary !== -1 ? cells[csvMapping.summary] || "CSV imported" : "Bulk CSV spreadsheet row";

          records.push({
            id: `csv_rec_${index}_${Date.now()}`,
            amount: rawAmount || 0.00,
            currency: "USD",
            vendor,
            category: standardizeCategory(category),
            date: dateStr,
            summary,
            confidence: 0.90,
            sourceType: "csv",
            sourceName: csvFile.name,
            createdAt: new Date().toISOString(),
            status: "verified"
          });
        });

        onCommitBulkCsv(records);
        handleCancelCsv();
      }
    };
    reader.readAsText(csvFile);
  };

  const standardizeCategory = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes("meal") || c.includes("food") || c.includes("entertainment") || c.includes("drink") || c.includes("client")) return "Meals & Entertainment";
    if (c.includes("travel") || c.includes("flight") || c.includes("hotel") || c.includes("lodging") || c.includes("taxi") || c.includes("uber") || c.includes("cab")) return "Travel & Lodging";
    if (c.includes("supply") || c.includes("stationary") || c.includes("furniture") || c.includes("desk")) return "Office Supplies";
    if (c.includes("software") || c.includes("sub") || c.includes("saas") || c.includes("hosting") || c.includes("cloud") || c.includes("domain")) return "Software & Subscriptions";
    if (c.includes("util") || c.includes("electric") || c.includes("water") || c.includes("power") || c.includes("gas") || c.includes("sewer")) return "Utilities";
    if (c.includes("market") || c.includes("advert") || c.includes("ad") || c.includes("pr") || c.includes("facebook") || c.includes("google")) return "Advertising & Marketing";
    if (c.includes("legal") || c.includes("prof") || c.includes("account") || c.includes("consult")) return "Professional Services";
    if (c.includes("equip") || c.includes("hardware") || c.includes("laptop") || c.includes("computer") || c.includes("screen")) return "Equipment";
    return "Miscellaneous";
  };

  const handleCancelCsv = () => {
    setCsvFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    onExtractPastedText(pastedText);
    setPastedText("");
    setShowPastedInput(false);
  };

  return (
    <div id="upload_queue" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Automated Smart Ingest</h4>
          <span className="text-[10px] bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full text-indigo-700 font-bold font-sans">LedgerAi Ingest</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Upload multi-format bills, receipts or drop CSV files below. Gemini handles visual OCR and data mapping automatically.
        </p>

        {/* Drag and Drop Zone */}
        {!csvFile && (
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-indigo-650 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/20 hover:bg-indigo-50/10 transition group flex flex-col items-center justify-center space-y-2 mb-4"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,application/pdf,.csv"
              className="hidden"
            />
            <div className="p-3 bg-white border border-slate-100 group-hover:border-indigo-200 shadow-xs rounded-xl text-slate-600 group-hover:text-indigo-650 group-hover:scale-105 transition-all duration-300">
              <Upload className="w-5 h-5 group-hover:animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-950 transition-colors">Drag & drop files or click to upload</p>
              <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, PDF (Gemini Intelligence) or bulk CSV</p>
            </div>
          </div>
        )}

        {/* Local CSV Column Mapper Visualizer */}
        {csvFile && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Table className="w-4 h-4 text-slate-800" />
                <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">
                  Map Columns: {csvFile.name}
                </span>
              </div>
              <button onClick={handleCancelCsv} className="text-slate-400 hover:text-slate-900 text-xs font-medium uppercase tracking-wider">
                Cancel
              </button>
            </div>

            <p className="text-[10px] text-slate-500 mb-3">
              Match spreadsheet columns to Ledger properties. We extracted the headers below.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.keys(csvMapping).map((targetField) => {
                const curVal = csvMapping[targetField as keyof typeof csvMapping];
                return (
                  <div key={targetField} className="bg-white p-2 rounded-xl border border-slate-150 relative">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-0.5 uppercase">
                      {targetField}
                    </label>
                    <select
                      value={curVal}
                      onChange={(e) => setCsvMapping(prev => ({ ...prev, [targetField]: parseInt(e.target.value) }))}
                      className="text-xs text-slate-800 font-medium bg-transparent border-0 p-0 w-full focus:ring-0 cursor-pointer"
                    >
                      <option value={-1}>-- Ignore Field --</option>
                      {csvHeaders.map((header, idx) => (
                        <option key={idx} value={idx}>
                          Column {idx + 1}: {header}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Row Preview */}
            <div className="mb-4">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-1">
                Data Row Preview
              </span>
              <div className="overflow-x-auto text-[10px] font-mono text-slate-600 bg-white border border-slate-150 rounded-lg p-2 max-h-[80px] overflow-y-auto">
                {csvRows.slice(0, 1).map((row, rIdx) => (
                  <div key={rIdx} className="space-y-0.5">
                    {row.map((val, cIdx) => (
                      <div key={cIdx} className="truncate">
                        <strong className="text-slate-800">{csvHeaders[cIdx] || `Col ${cIdx + 1}`}:</strong> {val}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCommitCsv}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-xl text-xs transition border border-slate-950 flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import Ledger Rows</span>
            </button>
          </div>
        )}

        {/* Paste Raw Text Control triggers */}
        {!csvFile && (
          <div className="mb-4">
            {showPastedInput ? (
              <div className="space-y-2 mt-2 border border-slate-200 bg-slate-50/30 p-3 rounded-2xl">
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste raw vendor invoice email text or SMS logs here..."
                  className="w-full h-24 p-2 text-xs border border-slate-200 focus:border-slate-800 focus:ring-0 rounded-xl bg-white focus:outline-hidden"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowPastedInput(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasteSubmit}
                    disabled={!pastedText.trim()}
                    className="px-3.5 py-1 text-xs font-semibold bg-slate-900 text-white border border-slate-950 rounded-lg hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                  >
                    AI Structure
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowPastedInput(true)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/60 transition cursor-pointer"
              >
                + Paste Raw Invoice/Receipt Text
              </button>
            )}
          </div>
        )}

        {/* Active Processing Queue Progress Cards */}
        {processingQueue.length > 0 && (
          <div className="mt-4">
            <h5 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
              Processing Invoice Queue ({processingQueue.filter(q => q.status !== "completed").length} active)
            </h5>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {processingQueue.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col space-y-1.5 shadow-3xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <p className="text-[11px] font-semibold text-slate-800 truncate" title={item.name}>
                        {item.name}
                      </p>
                    </div>
                    {item.status !== "completed" && item.status !== "failed" ? (
                      <Loader2 className="w-3.5 h-3.5 text-slate-800 animate-spin" />
                    ) : item.status === "completed" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    )}
                  </div>

                  {/* Operational Status Display and Progression */}
                  <div className="flex items-center justify-between text-[9px] text-slate-500">
                    <span className="capitalize font-medium">
                      {item.status === "parsing" && "Performing Visual OCR..."}
                      {item.status === "structuring" && "Gemini: Structuring Ledger Meta..."}
                      {item.status === "completed" && "Successfully Structured"}
                      {item.status === "failed" && "Failed to Extract"}
                      {item.status === "uploading" && "Uploading payloads..."}
                    </span>
                    <span className="font-mono">{item.progress}%</span>
                  </div>

                  {/* Progress Line Bar */}
                  <div className="w-full bg-slate-250 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        item.status === "failed" ? "bg-red-500" : "bg-slate-900"
                      }`} 
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>

                  {/* Error messaging fallback */}
                  {item.error && (
                    <p className="text-[9px] font-semibold text-red-500 leading-tight">
                      Error: {item.error}
                    </p>
                  )}

                  {/* Option to clear queue row */}
                  {(item.status === "completed" || item.status === "failed") && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onClearQueueItem(item.id)}
                        className="text-[9px] text-slate-400 hover:text-slate-600 flex items-center space-x-1 uppercase tracking-wider"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-3 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Files locally secure</span>
        <span className="text-slate-500 font-mono">3.5-Flash</span>
      </div>
    </div>
  );
}
