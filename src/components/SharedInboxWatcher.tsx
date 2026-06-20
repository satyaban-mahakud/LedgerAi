import { useState } from "react";
import { SharedInboxFile } from "../types";
import { 
  Inbox, 
  ArrowRight, 
  RefreshCw, 
  Check, 
  Slack, 
  Mail, 
  FolderSync, 
  FileText, 
  Image as ImageIcon 
} from "lucide-react";

interface SharedInboxWatcherProps {
  files: SharedInboxFile[];
  onProcessFile: (file: SharedInboxFile) => void;
  isLoading: boolean;
}

export default function SharedInboxWatcher({ files, onProcessFile, isLoading }: SharedInboxWatcherProps) {
  const [filterSource, setFilterSource] = useState<string>("all");

  const sources = [
    { value: "all", label: "All Integrations" },
    { value: "Slack Finance Channel", label: "Slack" },
    { value: "Email Inbox", label: "Email" },
    { value: "Shared Drive Ingestion", label: "Shared Drive" }
  ];

  const filteredFiles = files.filter(f => filterSource === "all" || f.source === filterSource);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Inbox className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Live Integration Feed</h4>
          </div>
          <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100 font-bold">
            {files.filter(f => !f.parsed).length} New
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Incoming files automatically intercepted from Slack channels, corporate email, and shared cloud drives.
        </p>

        {/* Integration Source Filters */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {sources.map(src => (
            <button
              key={src.value}
              onClick={() => setFilterSource(src.value)}
              className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-bold transition duration-200 cursor-pointer ${
                filterSource === src.value
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-150 hover:bg-slate-100"
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>

        {/* Ingested File Queue */}
        <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
          {filteredFiles.length > 0 ? (
            filteredFiles.map(file => {
              const Icon = file.type === "application/pdf" ? FileText : ImageIcon;
              return (
                <div 
                  key={file.id} 
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    file.parsed 
                      ? "bg-slate-50 border-slate-100 opacity-60" 
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-2 text-[9px] text-slate-400 mt-0.5">
                        <span className="font-mono">{file.size}</span>
                        <span>•</span>
                        <span className="flex items-center text-slate-400">
                          {file.source === "Slack Finance Channel" && <Slack className="w-2.5 h-2.5 text-[#4a154b] mr-0.5" />}
                          {file.source === "Email Inbox" && <Mail className="w-2.5 h-2.5 text-slate-400 mr-0.5" />}
                          {file.source === "Shared Drive Ingestion" && <FolderSync className="w-2.5 h-2.5 text-slate-400 mr-0.5" />}
                          {file.source.split(" ")[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {file.parsed ? (
                      <span className="flex items-center text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 mr-0.5" /> Structured
                      </span>
                    ) : (
                      <button
                        onClick={() => onProcessFile(file)}
                        disabled={isLoading}
                        className="flex items-center text-[10px] font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 border border-slate-950 px-2.5 py-1 rounded-full cursor-pointer hover:shadow-xs transition"
                      >
                        OCR Extract
                        <ArrowRight className="w-2.5 h-2.5 ml-1" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-100 rounded-xl">
              <Inbox className="w-6 h-6 mx-auto text-slate-300 mb-1" />
              <p className="text-[11px] text-slate-400">No matching ingestion streams.</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Channel Sync Active (1m scan)</span>
        <span className="flex items-center text-slate-500 font-medium">
          <RefreshCw className="w-3 h-3 animate-spin mr-1 text-slate-400" /> Auto-listening
        </span>
      </div>
    </div>
  );
}
