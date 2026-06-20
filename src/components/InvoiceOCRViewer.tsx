import { useState, useEffect, FormEvent } from "react";
import { Receipt, LineItem } from "../types";
import { 
  Check, 
  X, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  RefreshCw, 
  HelpCircle, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  Tag, 
  Info 
} from "lucide-react";

interface InvoiceOCRViewerProps {
  receipt: Receipt | null;
  onSave: (updatedReceipt: Receipt) => void;
  onClose: () => void;
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

export default function InvoiceOCRViewer({ receipt, onSave, onClose }: InvoiceOCRViewerProps) {
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState("USD");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Miscellaneous");
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Synchronize internal state with selected receipt
  useEffect(() => {
    if (receipt) {
      setVendor(receipt.vendor || "");
      setAmount(receipt.amount || 0);
      setCurrency(receipt.currency || "USD");
      setDate(receipt.date || "");
      setCategory(receipt.category || "Miscellaneous");
      setTaxAmount(receipt.taxAmount || 0);
      setSummary(receipt.summary || "");
      setNotes(receipt.notes || "");
      setLineItems(receipt.lineItems || []);
    }
  }, [receipt]);

  if (!receipt) return null;

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, amount: 0 }]);
  };

  const handleUpdateLineItem = (index: number, updated: Partial<LineItem>) => {
    const updatedList = lineItems.map((item, idx) => {
      if (idx === index) {
        return { ...item, ...updated };
      }
      return item;
    });
    setLineItems(updatedList);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      ...receipt,
      vendor,
      amount,
      currency,
      date,
      category,
      taxAmount,
      summary,
      notes,
      lineItems,
      status: "verified" // Flag it as audited and verified
    });
  };

  // Determine confidence color schemes
  const getConfidenceColor = (score: number) => {
    if (score >= 0.90) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 0.70) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-650 text-white rounded-lg shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">LedgerAi Auditor</h3>
              <p className="text-[10px] text-slate-500 font-mono">Source file: {receipt.sourceName}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left: Input parameters */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center space-x-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              <span>Extracted Transaction Metadata</span>
            </h4>

            {/* Merchant / Vendor */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                Vendor / Merchant Name
              </label>
              <input
                type="text"
                required
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 focus:border-slate-800 focus:ring-0 rounded-lg px-3 py-2 bg-slate-50/20 text-slate-800 font-semibold"
                placeholder="e.g. Slack Technologies"
              />
            </div>

            {/* Amount & Currency in double columns */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Grand Total Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono border border-slate-200 focus:border-slate-800 focus:ring-0 rounded-lg pl-6 pr-3 py-2 bg-slate-50/20 text-slate-800 font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1" id="currency-label">
                  Currency
                </label>
                <select
                  aria-labelledby="currency-label"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 focus:border-slate-800 focus:ring-0 rounded-lg px-2.5 py-2 bg-slate-50/20 text-slate-800"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
              </div>
            </div>

            {/* Date & Category mapping */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Transaction Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 focus:border-slate-800 focus:ring-0 rounded-lg px-3 py-2 bg-slate-50/20 text-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1" id="category-label">
                  Asset Category
                </label>
                <select
                  aria-labelledby="category-label"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 focus:border-slate-800 focus:ring-0 rounded-lg px-2.5 py-2 bg-slate-50/20 text-slate-800"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tax & Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Tax Cost (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={taxAmount || 0}
                  onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono border border-slate-200 focus:border-slate-800 focus:ring-0 rounded-lg px-3 py-2 bg-slate-50/20 text-slate-800"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Summary Description / Memo
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-slate-800 focus:ring-0 rounded-lg px-3 py-2 bg-slate-50/20 text-slate-800"
                  placeholder="e.g. June annual SaaS workspace subscription"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                Audit Review Notes / G/L Account Coding
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-16 text-xs border border-slate-200 focus:border-slate-800 focus:ring-0 rounded-lg px-3 py-2 bg-slate-50/20 text-slate-700"
                placeholder="Enter G/L coding mappings or audit approvals (e.g., Charged to Corporate Marketing CC-901)"
              />
            </div>
          </div>

          {/* Right side: Line Items & Quality stats */}
          <div className="md:col-span-2 space-y-4 border-l border-slate-100 pl-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Confidence Meter Badge */}
              <div className={`p-3 rounded-xl border flex items-center space-x-2.5 ${getConfidenceColor(receipt.confidence)}`}>
                <Info className="w-4 h-4 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider block">AI Inference Confidence</span>
                  <span className="text-xs font-semibold block font-mono">
                    {Math.round(receipt.confidence * 100)}% matching reliability via Gemini OCR
                  </span>
                </div>
              </div>

              {/* Line Items Expansion */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Broken Down Line Items
                  </h5>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-[9px] uppercase tracking-wider font-bold text-slate-900 border border-slate-350 hover:bg-slate-55 shadow-3xs rounded-full px-2 py-0.5 cursor-pointer"
                  >
                    + Add row
                  </button>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {lineItems.length > 0 ? (
                    lineItems.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 space-y-1.5 relative">
                        <div className="flex items-center space-x-1.5 pr-6">
                          <input
                            type="text"
                            required
                            placeholder="Line Item Label"
                            value={item.description}
                            onChange={(e) => handleUpdateLineItem(idx, { description: e.target.value })}
                            className="text-[10px] font-medium border-0 border-b border-dashed border-slate-200 p-0 hover:border-slate-400 bg-transparent focus:ring-0 focus:outline-hidden w-full text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="absolute right-2 top-2 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-1">
                            <span className="text-[8px] uppercase tracking-wider text-slate-400">Qty:</span>
                            <input
                              type="number"
                              value={item.quantity || 1}
                              onChange={(e) => handleUpdateLineItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                              className="text-[9px] font-mono border-0 p-0 w-8 text-center bg-transparent focus:ring-0 focus:outline-hidden text-slate-600"
                            />
                          </div>
                          <div className="flex items-center justify-end space-x-1">
                            <span className="text-[8px] uppercase tracking-wider text-slate-400">Cost ($):</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.amount || 0}
                              onChange={(e) => handleUpdateLineItem(idx, { amount: parseFloat(e.target.value) || 0 })}
                              className="text-[9px] font-mono border-0 p-0 w-16 text-right bg-transparent focus:ring-0 focus:outline-hidden text-slate-800 font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-150 rounded-xl">
                      <p className="text-[10px] text-slate-400">No line items parsed. Standard invoice bulk tier.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Commit triggers */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Back to Inbox
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 border border-slate-950 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer hover:bg-slate-800"
              >
                <Check className="w-4 h-4" />
                <span>Verify & Commit Item</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
