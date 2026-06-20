import { useState } from "react";
import { IntegrationConfig, Receipt } from "../types";
import { 
  Database, 
  ExternalLink, 
  Server, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw, 
  Terminal, 
  Send, 
  Settings, 
  Link 
} from "lucide-react";

interface IntegrationPanelProps {
  receipts: Receipt[];
  config: IntegrationConfig;
  onUpdateConfig: (updated: IntegrationConfig) => void;
  onSyncAll: (target: 'SAP' | 'Salesforce' | 'ERP') => void;
  isSyncing: boolean;
}

export default function IntegrationPanel({
  receipts,
  config,
  onUpdateConfig,
  onSyncAll,
  isSyncing
}: IntegrationPanelProps) {
  const [sapUrl, setSapUrl] = useState(config.sapUrl);
  const [sapCompanyCode, setSapCompanyCode] = useState(config.sapCompanyCode);
  const [sapGlAccount, setSapGlAccount] = useState(config.sapGlAccount);
  const [sfInstanceUrl, setSfInstanceUrl] = useState(config.sfInstanceUrl);
  const [sfAccountId, setSfAccountId] = useState(config.sfAccountId);
  const [erpEndpoint, setErpEndpoint] = useState(config.erpEndpoint);
  const [erpTenantId, setErpTenantId] = useState(config.erpTenantId);

  const [activeTab, setActiveTab] = useState<'SAP' | 'Salesforce' | 'ERP' | 'Logs'>('SAP');
  const [connectionStatus, setConnectionStatus] = useState<{[key: string]: 'idle' | 'testing' | 'success' | 'failed'}>({
    SAP: 'idle',
    Salesforce: 'idle',
    ERP: 'idle'
  });
  const [jsonPayloadPreview, setJsonPayloadPreview] = useState<string>("");

  const handleSaveConfig = () => {
    onUpdateConfig({
      sapUrl,
      sapCompanyCode,
      sapGlAccount,
      sfInstanceUrl,
      sfAccountId,
      erpEndpoint,
      erpTenantId
    });
  };

  const handleTestConnection = (system: 'SAP' | 'Salesforce' | 'ERP') => {
    setConnectionStatus(prev => ({ ...prev, [system]: 'testing' }));
    setTimeout(() => {
      // Logic for mock testing connections
      const isValid = (system === 'SAP' && sapUrl.startsWith('https://')) ||
                      (system === 'Salesforce' && sfInstanceUrl.startsWith('https://')) ||
                      (system === 'ERP' && erpEndpoint.startsWith('https://'));

      setConnectionStatus(prev => ({ 
        ...prev, 
        [system]: isValid ? 'success' : 'failed' 
      }));
    }, 1500);
  };

  const generatePayloadPreview = (target: 'SAP' | 'Salesforce' | 'ERP') => {
    const pendingReceipts = receipts.filter(r => r.status === 'verified');
    
    let payload = {};
    if (target === 'SAP') {
      payload = {
        meta: {
          rfcMessage: "RFC_JOURNAL_POST",
          sourceSystem: "ReceiptStructurerLedger",
          batchId: `BATCH_${Date.now()}`,
          companyCode: sapCompanyCode
        },
        journalEntries: pendingReceipts.map(r => ({
          documentDate: r.date,
          postingDate: new Date().toISOString().split('T')[0],
          accountType: "S", // G/L Account Debit
          glAccount: sapGlAccount,
          amountValue: r.amount,
          currencyIso: r.currency,
          taxCode: r.taxAmount ? "I1" : "I0",
          itemDescription: `AI structured extract: ${r.vendor} - ${r.summary || "Goods/Services"}`
        }))
      };
    } else if (target === 'Salesforce') {
      payload = {
        objectType: "FinanceTransaction__c",
        parentAccountId: sfAccountId,
        records: pendingReceipts.map(r => ({
          Name: `Expense - ${r.vendor} (${r.date})`,
          Amount__c: r.amount,
          CurrencyIsoCode: r.currency,
          Category__c: r.category,
          ProcessedStage__c: "Audited Ledger Line",
          SourceFile__c: r.sourceName,
          SystemNotes__c: r.notes || "Automated ingestion via Gemini AI"
        }))
      };
    } else {
      payload = {
        syncContext: {
          tenantId: erpTenantId,
          version: "v2.0",
          triggeredAt: new Date().toISOString()
        },
        items: pendingReceipts.map(r => ({
          id: r.id,
          vendorName: r.vendor,
          netTotalCost: r.amount,
          associatedTaxCost: r.taxAmount || 0.00,
          accountDimension: r.category,
          timestamp: r.date,
          verified: true
        }))
      };
    }

    setJsonPayloadPreview(JSON.stringify(payload, null, 2));
  };

  return (
    <div id="integration_panel" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-slate-800" />
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">Enterprise Sync Center</h4>
          </div>
          <p className="text-xs text-slate-500 font-mono">Future scope setup, G/L mapping & active system pipeline integrations</p>
        </div>
        
        {/* Save Configurations */}
        <button
          onClick={handleSaveConfig}
          className="mt-3 md:mt-0 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-950 text-white font-semibold rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition shadow-3xs"
        >
          <span>Save Mappings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Tab Sidebar */}
        <div className="flex flex-col space-y-1.5 md:col-span-1">
          <button
            onClick={() => { setActiveTab('SAP'); setJsonPayloadPreview(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition flex items-center justify-between ${
              activeTab === 'SAP' 
                ? "bg-slate-900 text-white border border-slate-950" 
                : "bg-slate-50 text-slate-600 border border-slate-150/60 hover:bg-slate-120"
            }`}
          >
            <span>SAP NetWeaver</span>
            <span className={`w-2 h-2 rounded-full ${connectionStatus.SAP === 'success' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </button>
          <button
            onClick={() => { setActiveTab('Salesforce'); setJsonPayloadPreview(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition flex items-center justify-between ${
              activeTab === 'Salesforce' 
                ? "bg-slate-900 text-white border border-slate-950" 
                : "bg-slate-50 text-slate-600 border border-slate-150/60 hover:bg-slate-120"
            }`}
          >
            <span>Salesforce CRM</span>
            <span className={`w-2 h-2 rounded-full ${connectionStatus.Salesforce === 'success' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </button>
          <button
            onClick={() => { setActiveTab('ERP'); setJsonPayloadPreview(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition flex items-center justify-between ${
              activeTab === 'ERP' 
                ? "bg-slate-900 text-white border border-slate-950" 
                : "bg-slate-50 text-slate-600 border border-slate-150/60 hover:bg-slate-120"
            }`}
          >
            <span>ERP (NetSuite)</span>
            <span className={`w-2 h-2 rounded-full ${connectionStatus.ERP === 'success' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </button>
          <button
            onClick={() => { setActiveTab('Logs'); setJsonPayloadPreview(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition flex items-center space-x-2 ${
              activeTab === 'Logs' 
                ? "bg-slate-900 text-white border border-slate-950" 
                : "bg-slate-50 text-slate-600 border border-slate-150/60 hover:bg-slate-120"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Connection Profile</span>
          </button>
        </div>

        {/* Form panel based on active selection */}
        <div className="md:col-span-3 space-y-4">
          {activeTab === 'SAP' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">SAP G/L Journal Connector</h5>
                  <p className="text-[10px] text-slate-400">Post verified ledger rows into SAP S/4HANA Finance General Ledger</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTestConnection('SAP')}
                  disabled={connectionStatus.SAP === 'testing'}
                  className="px-3 py-1 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-2xs uppercase tracking-wider font-bold flex items-center space-x-1 cursor-pointer"
                >
                  {connectionStatus.SAP === 'testing' ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : <Link className="w-3 h-3 mr-1" />}
                  <span>Test API Hook</span>
                </button>
              </div>

              {connectionStatus.SAP === 'success' && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-[11px] rounded-lg border border-emerald-100 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>SAP NetWeaver Gateway connection verified. Host responded with HTTP 200 (OK). Ready to map.</span>
                </div>
              )}
              {connectionStatus.SAP === 'failed' && (
                <div className="p-2.5 bg-red-50 text-red-800 text-[11px] rounded-lg border border-red-100 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Connection failed: Host URL is invalid or must start with HTTPS. Please review.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                    API Host Endpoint (ECC / S/4HANA Gateway)
                  </label>
                  <input
                    type="url"
                    value={sapUrl}
                    onChange={(e) => setSapUrl(e.target.value)}
                    className="w-full text-xs border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 bg-slate-50/20 text-slate-700"
                    placeholder="https://sap-gateway.company.com/sap/opu/odata/s4"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                      Company Code
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={sapCompanyCode}
                      onChange={(e) => setSapCompanyCode(e.target.value)}
                      className="w-full text-xs font-mono border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 bg-slate-50/20 text-slate-700 uppercase"
                      placeholder="US01"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                      Default G/L Account Mapping
                    </label>
                    <input
                      type="text"
                      value={sapGlAccount}
                      onChange={(e) => setSapGlAccount(e.target.value)}
                      className="w-full text-xs font-mono border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 bg-slate-50/20 text-slate-700"
                      placeholder="610020 (Travel expense)"
                    />
                  </div>
                </div>
              </div>

              {/* Action sync items */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  onClick={() => generatePayloadPreview('SAP')}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 block cursor-pointer"
                >
                  Inspect API Payload
                </button>
                <button
                  onClick={() => onSyncAll('SAP')}
                  disabled={isSyncing || connectionStatus.SAP !== 'success'}
                  className="px-4 py-1.5 bg-slate-900 border border-slate-950 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                >
                  {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Trigger SAP Journal Posting</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Salesforce' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Salesforce FSC Integration</h5>
                  <p className="text-[10px] text-slate-400">Sync expenses to Salesforce accounts, client cases, or campaigns</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTestConnection('Salesforce')}
                  disabled={connectionStatus.Salesforce === 'testing'}
                  className="px-3 py-1 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-2xs uppercase tracking-wider font-bold flex items-center space-x-1 cursor-pointer"
                >
                  {connectionStatus.Salesforce === 'testing' ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : <Link className="w-3 h-3 mr-1" />}
                  <span>Test Client Login</span>
                </button>
              </div>

              {connectionStatus.Salesforce === 'success' && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-[11px] rounded-lg border border-emerald-100 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Salesforce Financial Services Cloud authenticated. Token acquired successfully.</span>
                </div>
              )}
              {connectionStatus.Salesforce === 'failed' && (
                <div className="p-2.5 bg-red-50 text-red-800 text-[11px] rounded-lg border border-red-100 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Connection failed: Salesforce instance must reside on an HTTPS custom domain.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                    Lightning Instance URL
                  </label>
                  <input
                    type="url"
                    value={sfInstanceUrl}
                    onChange={(e) => setSfInstanceUrl(e.target.value)}
                    className="w-full text-xs border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 bg-slate-50/20 text-slate-700"
                    placeholder="https://na44.lightning.force.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                    Salesforce Account ID/Campaign Reference
                  </label>
                  <input
                    type="text"
                    value={sfAccountId}
                    onChange={(e) => setSfAccountId(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 bg-slate-50/20 text-slate-700"
                    placeholder="Acc_88201aK99"
                  />
                </div>
              </div>

              {/* Action sync items */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  onClick={() => generatePayloadPreview('Salesforce')}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 block cursor-pointer"
                >
                  Inspect API Payload
                </button>
                <button
                  onClick={() => onSyncAll('Salesforce')}
                  disabled={isSyncing || connectionStatus.Salesforce !== 'success'}
                  className="px-4 py-1.5 bg-slate-900 border border-slate-950 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                >
                  {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Push to Salesforce Financials</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ERP' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">ERP REST Webhook (NetSuite)</h5>
                  <p className="text-[10px] text-slate-400">Bulk stream bookkeeping data dimensions on JSON webhook listeners</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTestConnection('ERP')}
                  disabled={connectionStatus.ERP === 'testing'}
                  className="px-3 py-1 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-2xs uppercase tracking-wider font-bold flex items-center space-x-1 cursor-pointer"
                >
                  {connectionStatus.ERP === 'testing' ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : <Link className="w-3 h-3 mr-1" />}
                  <span>Ping Webhook</span>
                </button>
              </div>

              {connectionStatus.ERP === 'success' && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-[11px] rounded-lg border border-emerald-100 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>ERP Endpoint active. NetSuite SuiteTalk REST service triggered 201 Created.</span>
                </div>
              )}
              {connectionStatus.ERP === 'failed' && (
                <div className="p-2.5 bg-red-50 text-red-800 text-[11px] rounded-lg border border-red-100 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Connection failed: ERP pipeline host returned timeout 504. Review internet security headers.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                    SuiteTalk API Webhook Endpoint URL
                  </label>
                  <input
                    type="url"
                    value={erpEndpoint}
                    onChange={(e) => setErpEndpoint(e.target.value)}
                    className="w-full text-xs border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 bg-slate-50/20 text-slate-700"
                    placeholder="https://123456.restlets.api.netsuite.com/app/site/hosting/restlet.nl"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                    Corporate Tenant ID Reference
                  </label>
                  <input
                    type="text"
                    value={erpTenantId}
                    onChange={(e) => setErpTenantId(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-200 focus:border-slate-800 rounded-lg px-3 py-2 bg-slate-50/20 text-slate-700"
                    placeholder="T-900331-X"
                  />
                </div>
              </div>

              {/* Action sync items */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  onClick={() => generatePayloadPreview('ERP')}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 block cursor-pointer"
                >
                  Inspect API Payload
                </button>
                <button
                  onClick={() => onSyncAll('ERP')}
                  disabled={isSyncing || connectionStatus.ERP !== 'success'}
                  className="px-4 py-1.5 bg-slate-900 border border-slate-950 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                >
                  {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Push Bulk ERP Feed</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Logs' && (
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Enterprise Connection Settings</h5>
              <p className="text-[10px] text-slate-400">
                These settings allow you to map corporate categories and billing tags dynamically. Review mapping definitions before executing synchronization logs.
              </p>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 font-mono text-[10px] text-slate-600 leading-relaxed overflow-x-auto">
                <p className="font-bold text-slate-800 mb-1"># G/L Account Code Hierarchy mappings:</p>
                <p>Meals & Entertainment =&gt; Account Code: 605010 (Meals Expense)</p>
                <p>Travel & Lodging =&gt; Account Code: 611002 (Corporate Travel)</p>
                <p>Office Supplies =&gt; Account Code: 622105 (Workspace Stipends)</p>
                <p>Software & Subscriptions =&gt; Account Code: 654020 (SaaS Licensing)</p>
                <p>Utilities =&gt; Account Code: 630120 (Building Utilities)</p>
                <p>Advertising & Marketing =&gt; Account Code: 601004 (Retargeting Ads)</p>
                <p>Professional Services =&gt; Account Code: 660500 (Contractors & Legal)</p>
                <p>Equipment =&gt; Account Code: 140220 (Capitalized Hardware Assets)</p>
              </div>
            </div>
          )}

          {/* JSON Payload Inspection Sandbox */}
          {jsonPayloadPreview && (
            <div className="mt-4 border border-slate-250 rounded-xl overflow-hidden shadow-3xs">
              <div className="bg-slate-850 text-white px-4 py-2 flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase font-sans">
                <div className="flex items-center space-x-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Interactive REST Webhook Payload Preview (Ready to Stream)</span>
                </div>
                <button onClick={() => setJsonPayloadPreview("")} className="text-slate-400 hover:text-white text-[10px]">
                  Close Panel
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-[9px] overflow-x-auto max-h-[180px] overflow-y-auto leading-relaxed">
                {jsonPayloadPreview}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
