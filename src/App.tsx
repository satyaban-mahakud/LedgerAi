import { useState, useEffect } from "react";
import { 
  Receipt, 
  ProcessingItem, 
  IntegrationConfig, 
  SharedInboxFile, 
  SourceType 
} from "./types";
import { 
  INITIAL_RECEIPTS, 
  MOCK_SHARED_INBOX_FILES, 
  RAW_RECEIPT_TEXT_EXAMPLES 
} from "./mockData";
import StatsDashboard from "./components/StatsDashboard";
import SharedInboxWatcher from "./components/SharedInboxWatcher";
import UploadQueue from "./components/UploadQueue";
import InvoiceOCRViewer from "./components/InvoiceOCRViewer";
import IntegrationPanel from "./components/IntegrationPanel";
import LedgerTable from "./components/LedgerTable";
import { 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  AlertCircle, 
  FolderSync, 
  FileText, 
  Sliders 
} from "lucide-react";

const INITIAL_CONFIG: IntegrationConfig = {
  sapUrl: "https://sap-gateway.internal.acme.com/sap/opu/odata/s4",
  sapCompanyCode: "US01",
  sapGlAccount: "612040",
  sfInstanceUrl: "https://acme-fs.lightning.force.com",
  sfAccountId: "ACC_880199KA48",
  erpEndpoint: "https://123456.restlets.api.netsuite.com/app/site/hosting/restlet.nl",
  erpTenantId: "TENANT_90003"
};

export default function App() {
  // Ledger receipts database state with LocalStorage Backup
  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem("ledger_receipts");
    return saved ? JSON.parse(saved) : INITIAL_RECEIPTS;
  });

  // Ingestion Inbox files
  const [inboxFiles, setInboxFiles] = useState<SharedInboxFile[]>(() => {
    const saved = localStorage.getItem("ledger_inbox");
    return saved ? JSON.parse(saved) : MOCK_SHARED_INBOX_FILES;
  });

  // Upload/Processing queue state
  const [processingQueue, setProcessingQueue] = useState<ProcessingItem[]>([]);

  // Integration Config parameters
  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>(() => {
    const saved = localStorage.getItem("ledger_integration_config");
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  const [activeReviewReceipt, setActiveReviewReceipt] = useState<Receipt | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Sync to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem("ledger_receipts", JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem("ledger_inbox", JSON.stringify(inboxFiles));
  }, [inboxFiles]);

  useEffect(() => {
    localStorage.setItem("ledger_integration_config", JSON.stringify(integrationConfig));
  }, [integrationConfig]);

  // Handle files ingestion via OCR
  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      if (file.name.endsWith(".csv")) continue; // Handled separately by mapping modal in UploadQueue
      
      const queueId = `queue_${Date.now()}_${Math.random().toString(36).substring(3, 8)}`;
      
      // Seed processing item in queue
      const newItem: ProcessingItem = {
        id: queueId,
        name: file.name,
        size: file.size,
        type: file.type || "application/pdf",
        progress: 10,
        status: "uploading"
      };
      setProcessingQueue(prev => [newItem, ...prev]);

      // Base64 file mapping
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const rawBase = e.target?.result as string;
          const base64Data = rawBase.split(",")[1];
          const mimeType = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg");

          // Advance queue status state
          setProcessingQueue(prev => prev.map(item => 
            item.id === queueId ? { ...item, progress: 45, status: "structuring" } : item
          ));

          // Run extraction API
          const res = await fetch("/api/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file: {
                data: base64Data,
                mimeType,
                name: file.name
              }
            })
          });

          const json = await res.json();
          if (!json.success || !json.data) {
            throw new Error(json.error || "Gemini engine returned extraction error");
          }

          const ocrResult = json.data;

          // Push completed queue status
          setProcessingQueue(prev => prev.map(item => 
            item.id === queueId ? { ...item, progress: 100, status: "completed", result: ocrResult } : item
          ));

          // Map extraction results into pending ledger audit ledger
          const addedItem: Receipt = {
            id: `rec_${Date.now()}_${Math.random().toString(36).substring(3, 8)}`,
            amount: ocrResult.amount || 0.00,
            currency: ocrResult.currency || "USD",
            vendor: ocrResult.vendor || "Recognized Vendor",
            category: ocrResult.category || "Miscellaneous",
            date: ocrResult.date || new Date().toISOString().split("T")[0],
            taxAmount: ocrResult.taxAmount || 0.00,
            summary: ocrResult.summary || "AI Extracted Expense",
            lineItems: ocrResult.lineItems || [],
            confidence: ocrResult.confidence || 0.85,
            sourceType: mimeType.includes("pdf") ? "pdf" : "image",
            sourceName: file.name,
            createdAt: new Date().toISOString(),
            status: "pending_review" // Needs Neha's approval audit
          };

          setReceipts(prev => [addedItem, ...prev]);

        } catch (error: any) {
          console.error("AI Extractor failure:", error);
          setProcessingQueue(prev => prev.map(item => 
            item.id === queueId ? { ...item, progress: 100, status: "failed", error: error.message } : item
          ));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Extract raw text logs pasted by Neha directly
  const handleExtractPastedText = async (text: string) => {
    const queueId = `queue_paste_${Date.now()}`;
    const newItem: ProcessingItem = {
      id: queueId,
      name: "Pasted Receipt Text",
      size: text.length,
      type: "text/plain",
      progress: 20,
      status: "structuring"
    };
    setProcessingQueue(prev => [newItem, ...prev]);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || "Pasted text parser failed");
      }

      const ocrResult = json.data;

      setProcessingQueue(prev => prev.map(item => 
        item.id === queueId ? { ...item, progress: 100, status: "completed", result: ocrResult } : item
      ));

      const addedItem: Receipt = {
        id: `rec_${Date.now()}`,
        amount: ocrResult.amount || 0.00,
        currency: ocrResult.currency || "USD",
        vendor: ocrResult.vendor || "Pasted Vendor",
        category: ocrResult.category || "Miscellaneous",
        date: ocrResult.date || new Date().toISOString().split("T")[0],
        taxAmount: ocrResult.taxAmount || 0.00,
        summary: ocrResult.summary || "Pasted text extract",
        lineItems: ocrResult.lineItems || [],
        confidence: ocrResult.confidence || 0.90,
        sourceType: "paste",
        sourceName: "Pasted Clipboard Utility",
        createdAt: new Date().toISOString(),
        status: "pending_review"
      };

      setReceipts(prev => [addedItem, ...prev]);

    } catch (error: any) {
      console.error("AI Pastor failure:", error);
      setProcessingQueue(prev => prev.map(item => 
        item.id === queueId ? { ...item, progress: 100, status: "failed", error: error.message } : item
      ));
    }
  };

  // Simulate picking up simulated inbox file automatically
  const handleProcessInboxFile = async (file: SharedInboxFile) => {
    // Flag matched file as parsed in local inbox feed
    setInboxFiles(prev => prev.map(f => f.id === file.id ? { ...f, parsed: true } : f));

    // Choose corresponding preloaded raw text examples to run high-fidelity OCR model extraction
    let matchText = `Standard generic invoice for ${file.name}\nAmount: 45.00 USD\nDate: June 18, 2026\nVendor: Starbucks coffee`;
    if (file.name.includes("starbucks")) {
      matchText = RAW_RECEIPT_TEXT_EXAMPLES.find(ex => ex.title.includes("Starbucks"))?.text || matchText;
    } else if (file.name.includes("Uber_Ride")) {
      matchText = RAW_RECEIPT_TEXT_EXAMPLES.find(ex => ex.title.includes("Uber"))?.text || matchText;
    } else if (file.name.includes("Amazon") || file.name.includes("Figma")) {
      matchText = `Figma Inc.\nINV-993\nDate: June 20, 2026\nQuantity: 3 seats Pro Pro annual\nAmount: $450.00\nCategory: Design Software licensing`;
    } else if (file.name.includes("Marketing_Dinner")) {
      matchText = `The Capital Grille, NY\nDate: June 20, 2026\nFood & Wine totals: $289.40 USD\nTip: $40.00\nTotal Charge: $329.40\nClient Dinner - Neha marketing sync`;
    }

    const queueId = `queue_inbox_${file.id}_${Date.now()}`;
    const newItem: ProcessingItem = {
      id: queueId,
      name: file.name,
      size: 34000,
      type: file.type,
      progress: 25,
      status: "parsing"
    };
    setProcessingQueue(prev => [newItem, ...prev]);

    try {
      // Execute simulated file text to the actual server-side endpoint inside cloud sandboxes
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: matchText })
      });

      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || "Inbox extract error");

      const result = json.data;

      setProcessingQueue(prev => prev.map(item => 
        item.id === queueId ? { ...item, progress: 100, status: "completed", result } : item
      ));

      const addedItem: Receipt = {
        id: `rec_${Date.now()}`,
        amount: result.amount || 0.00,
        currency: result.currency || "USD",
        vendor: result.vendor || "Recognized Vendor",
        category: result.category || "Miscellaneous",
        date: result.date || new Date().toISOString().split("T")[0],
        taxAmount: result.taxAmount || 0.00,
        summary: result.summary || `Extracted from ${file.source}`,
        lineItems: result.lineItems || [],
        confidence: result.confidence || 0.95,
        sourceType: file.type.includes("pdf") ? "pdf" : "image",
        sourceName: file.name,
        createdAt: new Date().toISOString(),
        status: "pending_review"
      };

      setReceipts(prev => [addedItem, ...prev]);

    } catch (error: any) {
      console.error("Inbox channel parsing fail:", error);
      setProcessingQueue(prev => prev.map(item => 
        item.id === queueId ? { ...item, progress: 100, status: "failed", error: error.message } : item
      ));
    }
  };

  const handleClearQueueItem = (id: string) => {
    setProcessingQueue(prev => prev.filter(q => q.id !== id));
  };

  // Commit bulk rows converted from mapped CSV spreadsheet inputs!
  const handleCommitBulkCsv = (records: any[]) => {
    setReceipts(prev => [...records, ...prev]);
  };

  const handleEditReceipt = (rec: Receipt) => {
    setActiveReviewReceipt(rec);
  };

  const handleDeleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  // Force quick direct verified state
  const handleVerifyReceipt = (id: string) => {
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: "verified" } : r));
  };

  // Commit and close OCR Auditor
  const handleSaveReviewedReceipt = (updated: Receipt) => {
    setReceipts(prev => prev.map(r => r.id === updated.id ? updated : r));
    setActiveReviewReceipt(null);
  };

  // Sync Ledger verified entries dynamically with SAP/Salesforce/ERP
  const handleSyncAll = (target: "SAP" | "Salesforce" | "ERP") => {
    setIsSyncing(true);
    setSyncFeedback(`Initiating high-volume handshake with ${target} API endpoints...`);

    setTimeout(() => {
      setSyncFeedback(`Mapping G/L Dimensions & streaming XML packets to ${target} Gateway...`);
      
      setTimeout(() => {
        // Mark all 'verified' outstanding assets to matched synced states!
        setReceipts(prev => prev.map(r => {
          if (r.status === "verified") {
            if (target === "SAP") return { ...r, sapStatus: "synced" };
            if (target === "Salesforce") return { ...r, sfStatus: "synced" };
            return { ...r, erpStatus: "synced" };
          }
          return r;
        }));

        setIsSyncing(false);
        setSyncFeedback(null);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="min-h-screen text-slate-900 flex flex-col font-sans">
      {/* Prime Header Accent Bar */}
      <div className="bg-slate-950 py-1.5 text-center text-[10px] text-slate-300 font-mono tracking-widest uppercase flex items-center justify-center space-x-1.5 selection:bg-slate-700 selection:text-white">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
        <span>LedgerAi Bookkeeping Engine • Core Node Connected • Gemini-3.5-Flash Ingest</span>
      </div>

      {/* Main Corporate Navigation/App Header Banner */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-2xl border border-indigo-550 shadow-md shadow-indigo-100 flex items-center justify-center">
                <FolderSync className="w-5.5 h-5.5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">LedgerAi</h1>
                  <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-sans">
                    Pro Ingest
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Month-End Bookkeeping Automation Workspace for Neha</p>
              </div>
            </div>
          </div>

          {/* Sync pipeline health */}
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>G/L Channels Connected</span>
            </div>
            <button
              onClick={() => {
                // Seed mock refresh
                setReceipts(INITIAL_RECEIPTS);
                setInboxFiles(MOCK_SHARED_INBOX_FILES);
              }}
              className="p-2 rounded-xl border border-slate-200 hover:border-slate-800 bg-white hover:bg-slate-50 text-slate-600 font-bold hover:shadow-xs transition flex items-center space-x-1 uppercase tracking-wider text-[10px] cursor-pointer"
              title="Reset initial ledger mock entries"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main App Layout Grid */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6 flex-1">
        {/* Sync Progress Loading Modal Indicator */}
        {isSyncing && (
          <div className="bg-white border border-slate-150 p-4 rounded-2xl flex items-center space-x-4 animate-pulse shadow-sm max-w-lg mx-auto">
            <RefreshCw className="w-5 h-5 text-slate-900 animate-spin" />
            <div>
              <p className="text-xs font-bold text-slate-900">Uploading Ledger batch...</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{syncFeedback}</p>
            </div>
          </div>
        )}

        {/* Global Statistics Indicators */}
        <StatsDashboard receipts={receipts} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main running ledger list (Wide panel) */}
          <div className="lg:col-span-2 space-y-6">
            <LedgerTable
              receipts={receipts}
              onEditReceipt={handleEditReceipt}
              onDeleteReceipt={handleDeleteReceipt}
              onVerifyReceipt={handleVerifyReceipt}
            />

            {/* Config & Integration Systems Setup tab panels */}
            <IntegrationPanel
              receipts={receipts}
              config={integrationConfig}
              onUpdateConfig={setIntegrationConfig}
              onSyncAll={handleSyncAll}
              isSyncing={isSyncing}
            />
          </div>

          {/* Right side ingestion streams panels (Standard panel) */}
          <div className="space-y-6">
            {/* Input queues */}
            <UploadQueue
              processingQueue={processingQueue}
              onUploadFiles={handleUploadFiles}
              onExtractPastedText={handleExtractPastedText}
              onClearQueueItem={handleClearQueueItem}
              onCommitBulkCsv={handleCommitBulkCsv}
              isQueueLoading={processingQueue.some(q => q.status !== "completed")}
            />

            {/* Ingestion stream inbox channel */}
            <SharedInboxWatcher
              files={inboxFiles}
              onProcessFile={handleProcessInboxFile}
              isLoading={processingQueue.some(q => q.status !== "completed")}
            />
          </div>
        </div>
      </main>

      {/* Side-by-side OCR audit reviewer modal screen popup */}
      {activeReviewReceipt && (
        <InvoiceOCRViewer
          receipt={activeReviewReceipt}
          onSave={handleSaveReviewedReceipt}
          onClose={() => setActiveReviewReceipt(null)}
        />
      )}

      {/* Human design foot notes */}
      <footer className="bg-white/60 backdrop-blur-xs border-t border-slate-150 py-5 text-center text-xs text-slate-400 font-mono">
        <p>© 2026 LedgerAi • Built with React, Vite & Gemini-3.5-Flash</p>
      </footer>
    </div>
  );
}
