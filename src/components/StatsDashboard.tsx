import { useMemo } from "react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from "recharts";
import { Receipt } from "../types";
import { TrendingUp, CreditCard, DollarSign, ListFilter, Percent } from "lucide-react";

interface StatsDashboardProps {
  receipts: Receipt[];
}

export default function StatsDashboard({ receipts }: StatsDashboardProps) {
  // 1. Calculate Total Spend
  const totalSpend = useMemo(() => {
    return receipts.reduce((sum, rec) => sum + rec.amount, 0);
  }, [receipts]);

  // 2. Calculate Pending Audit Sum
  const pendingCount = useMemo(() => {
    return receipts.filter(rec => rec.status === "pending_review").length;
  }, [receipts]);

  const pendingAmount = useMemo(() => {
    return receipts
      .filter(rec => rec.status === "pending_review")
      .reduce((sum, rec) => sum + rec.amount, 0);
  }, [receipts]);

  // 3. Category Breakdown Data
  const categoryData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    receipts.forEach(rec => {
      counts[rec.category] = (counts[rec.category] || 0) + rec.amount;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  }, [receipts]);

  // 4. Vendor Breakdown Data (Top 5 Vendors)
  const vendorData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    receipts.forEach(rec => {
      counts[rec.vendor] = (counts[rec.vendor] || 0) + rec.amount;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [receipts]);

  // COLORS for Recharts Pie cells
  const COLORS = [
    "#0f172a", // Slate-900
    "#334155", // Slate-700
    "#64748b", // Slate-500
    "#94a3b8", // Slate-400
    "#cbd5e1", // Slate-300
    "#475569", // Slate-600
    "#3b82f6", // Blue-500
    "#60a5fa", // Blue-400
    "#10b981", // Emerald-500
  ];

  return (
    <div id="stats_dashboard" className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* KPI Cards */}
      <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="bg-linear-to-br from-indigo-50/40 via-white to-white p-5 rounded-2xl border border-indigo-100/80 shadow-xs flex items-center space-x-4 hover:shadow-md transition duration-300">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Total Ledger Volume</p>
            <h3 className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
              ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Total Receipts */}
        <div className="bg-linear-to-br from-slate-50/50 via-white to-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center space-x-4 hover:shadow-md transition duration-300">
          <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-150">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Records</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{receipts.length} receipts</h3>
          </div>
        </div>

        {/* Pending Review count */}
        <div className="bg-linear-to-br from-amber-50/40 via-white to-white p-5 rounded-2xl border border-amber-100/80 shadow-xs flex items-center space-x-4 hover:shadow-md transition duration-300">
          <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-100">
            <ListFilter className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Needs Audit Review</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{pendingCount} pending</h3>
          </div>
        </div>

        {/* Pending Audit Volume */}
        <div className="bg-linear-to-br from-emerald-50/40 via-white to-white p-5 rounded-2xl border border-emerald-100/80 shadow-xs flex items-center space-x-4 hover:shadow-md transition duration-300">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Audit Volume</p>
            <h3 className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
              ${pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      {receipts.length > 0 ? (
        <>
          {/* Category Pie Chart */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Expense by Category</h4>
              <p className="text-xs text-slate-500">Distribution of structured ledger volumes</p>
            </div>
            <div className="h-48 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toLocaleString()}`, "Amount"]}
                    contentStyle={{ border: "1px solid #f1f5f9", borderRadius: "8px", fontSize: "12px", fontFamily: "monospace" }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ fontSize: "11px", paddingLeft: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Vendors Bar Chart */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Top Merchant Volumes</h4>
              <p className="text-xs text-slate-500 font-mono">Top billing vendors by aggregate cost</p>
            </div>
            <div className="h-48 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={9} fontStyle="monospace" />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={9} width={90} ellipsizeMode="tail" />
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toLocaleString()}`, "Spend"]}
                    contentStyle={{ border: "1px solid #f1f5f9", borderRadius: "8px", fontSize: "12px", fontFamily: "monospace" }}
                  />
                  <Bar dataKey="value" fill="#0f172a" radius={[0, 4, 4, 0]}>
                    {vendorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#0f172a" : "#475569"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="md:col-span-4 bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
          <p className="text-slate-500 text-sm">Add some receipts or invoices to view analytical visual graphs.</p>
        </div>
      )}
    </div>
  );
}
