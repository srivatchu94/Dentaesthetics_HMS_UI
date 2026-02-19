import React, { useState, useEffect, useMemo } from "react";
import { 
  Printer, 
  Mail, 
  MessageCircle, 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar, 
  User, 
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { InvoiceTemplate } from "../components/InvoiceTemplate";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ConsultationBilling() {
  const [patientName, setPatientName] = useState("");
  const [consultationFee, setConsultationFee] = useState(500);
  const [otherCharges, setOtherCharges] = useState<{ id: string; name: string; amount: number }[]>([
    { id: "1", name: "Registration", amount: 50 }
  ]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [showPrint, setShowPrint] = useState(false);

  const totalAmount = useMemo(() => {
    const others = otherCharges.reduce((sum, item) => sum + item.amount, 0);
    return consultationFee + others;
  }, [consultationFee, otherCharges]);

  const pendingAmount = Math.max(0, totalAmount - amountPaid);

  const status = useMemo(() => {
    if (amountPaid === 0) return "Pending";
    if (amountPaid >= totalAmount) return "Paid";
    return "Partial";
  }, [amountPaid, totalAmount]);

  const addCharge = () => {
    setOtherCharges([
      ...otherCharges,
      { id: Math.random().toString(36).substr(2, 9), name: "", amount: 0 }
    ]);
  };

  const removeCharge = (id: string) => {
    setOtherCharges(otherCharges.filter(c => c.id !== id));
  };

  const updateCharge = (id: string, field: "name" | "amount", value: any) => {
    setOtherCharges(otherCharges.map(c => 
      c.id === id ? { ...c, [field]: field === "amount" ? Number(value) : value } : c
    ));
  };

  const handlePrint = () => {
    window.print();
    toast.success("Opening print dialog...");
  };

  const handleEmail = () => {
    toast.success("Invoice sent to patient's email!");
  };

  const handleWhatsApp = () => {
    toast.success("WhatsApp message scheduled!");
  };

  const invoiceData = {
    type: "Consultation & Services",
    patientName,
    date: new Date().toLocaleDateString(),
    items: [
      { name: "Consultation Fee", amount: consultationFee },
      ...otherCharges
    ],
    totalAmount,
    amountPaid,
    pendingAmount,
    status
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Patient Billing</h2>
          <p className="text-slate-500 mt-1">Generate consultation and service invoices effortlessly.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleEmail}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium shadow-sm"
          >
            <Mail size={18} />
            Email
          </button>
          <button 
            onClick={handleWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-100 text-green-700 rounded-xl hover:bg-green-100 transition-all font-medium shadow-sm"
          >
            <MessageCircle size={18} />
            WhatsApp
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-200"
          >
            <Printer size={18} />
            Print Bill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Billing Form */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <User size={20} className="text-blue-500" />
              Patient Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Patient Name</label>
                <input 
                  type="text"
                  placeholder="Enter patient name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Date</label>
                <div className="relative">
                  <input 
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all pl-10"
                  />
                  <Calendar size={18} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FileText size={20} className="text-blue-500" />
                Service Charges
              </h3>
              <button 
                onClick={addCharge}
                className="text-blue-600 text-sm font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus size={16} />
                Add Charge
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">Consultation Fee</p>
                </div>
                <div className="w-32">
                  <div className="relative">
                    <input 
                      type="number"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none transition-all pl-7 text-right"
                    />
                    <DollarSign size={14} className="absolute left-2 top-3 text-slate-400" />
                  </div>
                </div>
                <div className="w-10"></div>
              </div>

              {otherCharges.map((charge) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={charge.id} 
                  className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100"
                >
                  <div className="flex-1">
                    <input 
                      type="text"
                      placeholder="e.g. Blood Test, X-Ray"
                      value={charge.name}
                      onChange={(e) => updateCharge(charge.id, "name", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <input 
                        type="number"
                        value={charge.amount}
                        onChange={(e) => updateCharge(charge.id, "amount", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none transition-all pl-7 text-right"
                      />
                      <DollarSign size={14} className="absolute left-2 top-3 text-slate-400" />
                    </div>
                  </div>
                  <button 
                    onClick={() => removeCharge(charge.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Summary Card */}
        <div className="space-y-6">
          <section className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <h3 className="text-slate-400 font-medium uppercase tracking-wider text-xs mb-8">Bill Summary</h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-slate-400">Total Amount</span>
                <span className="text-3xl font-bold">${totalAmount.toFixed(2)}</span>
              </div>
              
              <div className="h-px bg-slate-800"></div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Amount Paid</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all pl-8"
                    />
                    <DollarSign size={16} className="absolute left-3 top-4 text-slate-500" />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">Pending</span>
                    <span className={cn(
                      "text-xl font-bold",
                      pendingAmount > 0 ? "text-orange-400" : "text-green-400"
                    )}>
                      ${pendingAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5",
                    status === "Paid" ? "bg-green-500/20 text-green-400" : 
                    status === "Partial" ? "bg-orange-500/20 text-orange-400" : 
                    "bg-red-500/20 text-red-400"
                  )}>
                    {status === "Paid" && <CheckCircle2 size={14} />}
                    {status === "Partial" && <Clock size={14} />}
                    {status === "Pending" && <AlertCircle size={14} />}
                    {status}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h4 className="text-blue-900 font-semibold mb-2 flex items-center gap-2">
              <CheckCircle2 size={18} />
              Quick Actions
            </h4>
            <p className="text-blue-700 text-sm mb-4">You can settle the bill directly or send a reminder to the patient.</p>
            <button 
              onClick={() => setAmountPaid(totalAmount)}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Mark as Fully Paid
            </button>
          </section>
        </div>
      </div>

      {/* Hidden Invoice Template for Printing */}
      <div className="print-only">
        <InvoiceTemplate data={invoiceData} />
      </div>
    </div>
  );
}
