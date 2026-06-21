import React from "react";
import { CheckCircle2 } from "lucide-react";
import dantaLogo from "../assets/danta-logo.jpg";

export function InvoiceTemplate({ data }) {
  return (
    <div className="hidden print-only p-8 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-6 border-b-2 border-gray-200">
          <div className="flex items-center justify-between">
            {/* Logo + Brand */}
            <div className="flex items-center gap-3">
              <img
                src={dantaLogo}
                alt="Dentaesthetics Logo"
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
              />
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">DENTAESTHETICS</h2>
                <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase">The Dental Company</p>
                {data.clinic && <p className="text-xs text-slate-400 mt-0.5">{data.clinic}</p>}
              </div>
            </div>
            {/* Invoice Meta */}
            <div className="text-right">
              <h1 className="text-3xl font-black text-slate-800 tracking-wide">INVOICE</h1>
              <p className="text-sm text-slate-500 mt-1">Date: {data.date}</p>
              <p className="text-sm text-slate-500">Invoice #: {data.invoiceNumber || "INV-2026-001"}</p>
            </div>
          </div>
        </div>

        {/* Patient Info */}
        <div className="mb-8 grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-slate-700 mb-2">BILL TO:</h3>
            <p className="text-slate-900 font-semibold">{data.patientName}</p>
          </div>
          <div>
            <h3 className="font-bold text-slate-700 mb-2">BILL TYPE:</h3>
            <p className="text-slate-900 font-semibold">{data.type}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 text-slate-700 font-bold">Description</th>
              <th className="text-right py-3 text-slate-700 font-bold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-3 text-slate-800">{item.name || item.details}</td>
                <td className="text-right py-3 text-slate-800 font-semibold">
                  ${typeof item.amount === "number" ? item.amount.toFixed(2) : item.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b-2 border-gray-300 mb-4">
              <span className="font-bold text-slate-700">TOTAL:</span>
              <span className="font-bold text-lg text-blue-600">${data.totalAmount.toFixed(2)}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Amount Paid:</span>
                <span className="font-semibold text-slate-900">${data.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-700">Balance Due:</span>
                <span className={data.pendingAmount > 0 ? "text-red-600" : "text-green-600"}>
                  ${data.pendingAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
                <span className="text-slate-700">Status:</span>
                <span className="font-bold text-blue-600">{data.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t-2 border-gray-300 text-center text-xs text-slate-500">
          <p>Thank you for your business!</p>
          <p className="mt-2">This is a computer-generated invoice. Valid without signature.</p>
        </div>
      </div>
    </div>
  );
}
