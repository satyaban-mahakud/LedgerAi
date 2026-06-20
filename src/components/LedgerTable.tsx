import { useState, useMemo } from "react";
import { Receipt, SourceType, VerificationStatus } from "../types";
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Sliders, 
  HelpCircle, 
  Check, 
  Tag, 
  FileText, 
  Image as ImageIcon, 
  CornerDownRight 
} from "lucide-react";

interface LedgerTableProps {
  receipts: Receipt[];
  onEditReceipt: (receipt: Receipt) => void;
  onDeleteReceipt: (id: string) => void;
  onVerifyReceipt: (id: string) => void;
}

const CATEGORIES = [
  "Meals & Entertainment",
  "Travel & Lodging",
  "Office Supplies",
  "Software & Subscriptions",
  "Utilities",
  "Advertising & Marketing",
  "Professional Services",
  "Equipment",
  "Miscellaneous"
];

export default function LedgerTable({
  receipts,
  onEditReceipt,
  onDeleteReceipt,
  onVerifyReceipt
}: LedgerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");

  // Filtering Logic
  const filteredReceipts = useMemo(() => {
    return receipts.filter((rec) => {
      const matchSearch = 
        rec.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.summary && rec.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
        rec.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory = selectedCategory === "all" || rec.category === selectedCategory;
      const matchStatus = selectedStatus === "all" || rec.status === selectedStatus;
      const matchSource = selectedSource === "all" || rec.sourceType === selectedSource;

      return matchSearch && matchCategory && matchStatus && matchSource;
    });
  }, [receipts, searchTerm, selectedCategory, selectedStatus, selectedSource]);

  // Export filtered items directly to standard CSV
  const handleExportCSV = () => {
    if (filteredReceipts.length === 0) return;

    // Construct CSV Header
    const headers = ["Date", "Vendor", "Category", "Grand Total", "Currency", "Tax cost", "Source file", "Verification", "Notes"];
    const rows = filteredReceipts.map(rec => [
      rec.date,
      `"${rec.vendor.replace(/"/g, '""')}"`,
      `"${rec.category}"`,
      rec.amount.toFixed(2),
      rec.currency,
      (rec.taxAmount || 0).toFixed(2),
      `"${rec.sourceName}"`,
      rec.status === 'verified' ? "Audited/Verified" : "Pending Audit",
      `"${(rec.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Neha_Finance_Ledger_Extract_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSourceBadge = (source: SourceType) => {
    switch (source) {
      case "image":
        return <span className="flex items-center text-[10px] text-indigo-600 font-semibold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full"><ImageIcon className="w-3 h-3 mr-1" /> Image</span>;
      case "pdf":
        return <span className="flex items-center text-[10px] text-red-600 font-semibold bg-red-50 border border-red-100 px-2 py-0.5 rounded-full"><FileText className="w-3 h-3 mr-1" /> PDF Invoice</span>;
      case "csv":
        return <span className="flex items-center text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full"><FileSpreadsheet className="w-3 h-3 mr-1" /> Raw CSV</span>;
      default:
        return <span className="flex items-center text-[10px] text-slate-600 font-semibold bg-slate-55 border border-slate-100 px-2 py-0.5 rounded-full">Pasted Text</span>;
    }
  };

  return (
    <div id="ledger_table" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
      {/* Table Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Bookkeeping Running Ledger</h4>
          <p className="text-xs text-slate-500 font-mono">Neha's month-end database of structured finance metadata</p>
        </div>
        
        {/* Export to spreadsheet option */}
        <button
          onClick={handleExportCSV}
          disabled={filteredReceipts.length === 0}
          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-950 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-3xs cursor-pointer"
        >
          <FileSpreadsheet className="w-3.8 h-3.8" />
          <span>Export Ledger as Excel CSV</span>
        </button>
      </div>

      {/* Structured Search Overlay Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Vendor or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs border border-slate-200 focus:border-slate-800 rounded-lg pl-9 pr-3 py-2 bg-slate-50/20 focus:outline-hidden"
          />
        </div>

        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full text-xs font-semibold border border-slate-200 focus:border-slate-800 rounded-lg px-2.5 py-2 bg-slate-50/20 text-slate-800 focus:outline-hidden select-none cursor-pointer"
          >
            <option value="all">📁 All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full text-xs font-semibold border border-slate-200 focus:border-slate-800 rounded-lg px-2.5 py-2 bg-slate-50/20 text-slate-800 focus:outline-hidden select-none cursor-pointer"
          >
            <option value="all">🔍 Audit State: All</option>
            <option value="verified">Verified (Audited)</option>
            <option value="pending_review">Pending Review</option>
          </select>
        </div>

        <div className="relative">
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full text-xs font-semibold border border-slate-200 focus:border-slate-800 rounded-lg px-2.5 py-2 bg-slate-50/20 text-slate-800 focus:outline-hidden select-none cursor-pointer"
          >
            <option value="all">🔌 Channel Ingestion: All</option>
            <option value="pdf">PDF Uploads</option>
            <option value="image">Image Uploads</option>
            <option value="csv">Bulk CSV Mapping</option>
            <option value="paste">Manual & pasted text</option>
          </select>
        </div>
      </div>

      {/* Main Ledger Data Table Container */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/40 text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Vendor / Merchant</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Cost Volume</th>
              <th className="py-3 px-4">Inflow source</th>
              <th className="py-3 px-4">Pipes Status (SAP/SF/ERP)</th>
              <th className="py-3 px-4">Audit Verify</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            {filteredReceipts.length > 0 ? (
              filteredReceipts.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition">
                  {/* Transaction Date */}
                  <td className="py-3.5 px-4 font-mono select-none text-slate-550">{rec.date}</td>

                  {/* Merchant Vendor details */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{rec.vendor}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[200px]" title={rec.summary || ""}>
                        {rec.summary || "No description loaded."}
                      </span>
                    </div>
                  </td>

                  {/* Expense Category */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center space-x-1 font-semibold text-[10px] uppercase tracking-wider text-slate-500">
                      <Tag className="w-3 h-3 text-slate-400 mr-1 shrink-0" />
                      {rec.category}
                    </span>
                  </td>

                  {/* Grand total volume */}
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                    {rec.currency} {rec.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Channel Ingest */}
                  <td className="py-3.5 px-4">{getSourceBadge(rec.sourceType)}</td>

                  {/* Pipe Connections Status indicators */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2 text-[9px] font-bold font-mono">
                      <span 
                        title={`SAP: ${rec.sapStatus === 'synced' ? 'Synced' : 'Not synced'}`}
                        className={`px-1.5 py-0.5 rounded-md ${
                          rec.sapStatus === 'synced' 
                            ? "bg-emerald-50 text-emerald-700 font-semibold" 
                            : "bg-slate-50 text-slate-400 border border-slate-100"
                        }`}
                      >
                        SAP
                      </span>
                      <span 
                        title={`Salesforce: ${rec.sfStatus === 'synced' ? 'Synced' : 'Not synced'}`}
                        className={`px-1.5 py-0.5 rounded-md ${
                          rec.sfStatus === 'synced' 
                            ? "bg-emerald-50 text-emerald-700 font-semibold" 
                            : "bg-slate-50 text-slate-400 border border-slate-100"
                        }`}
                      >
                        SF
                      </span>
                      <span 
                        title={`ERP: ${rec.erpStatus === 'synced' ? 'Synced' : 'Not synced'}`}
                        className={`px-1.5 py-0.5 rounded-md ${
                          rec.erpStatus === 'synced' 
                            ? "bg-emerald-50 text-emerald-700 font-semibold" 
                            : "bg-slate-50 text-slate-400 border border-slate-100"
                        }`}
                      >
                        ERP
                      </span>
                    </div>
                  </td>

                  {/* Audit review verify states */}
                  <td className="py-3.5 px-4">
                    {rec.status === "verified" ? (
                      <span className="inline-flex items-center select-none text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shadow-3xs">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Audited
                      </span>
                    ) : (
                      <button
                        onClick={() => onVerifyReceipt(rec.id)}
                        className="inline-flex items-center text-[10px] text-amber-600 hover:text-amber-700 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full cursor-pointer hover:bg-amber-100 transition"
                      >
                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> Needs Audit
                      </button>
                    )}
                  </td>

                  {/* Manual action triggers */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onEditReceipt(rec)}
                        title="Audit item"
                        className="p-1 px-2 border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-800 rounded-lg hover:shadow-3xs transition cursor-pointer flex items-center space-x-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Audit</span>
                      </button>
                      <button
                        onClick={() => onDeleteReceipt(rec.id)}
                        title="Delete receipt"
                        className="p-1 text-slate-350 hover:text-red-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                  No structured billing entries found matching the active selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
