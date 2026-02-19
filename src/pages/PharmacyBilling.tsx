import React, { useState, useMemo } from "react";
import { 
  Printer, 
  Mail, 
  MessageCircle, 
  Plus, 
  Trash2, 
  Search, 
  Pill, 
  Hospital,
  Stethoscope,
  Info
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { InvoiceTemplate } from "../components/InvoiceTemplate";

interface Medicine {
  id: string;
  name: string;
  rate: number;
  gst: number;
  quantity: number;
}

const MOCK_MEDICINES = [
  { id: "m1", name: "Amoxicillin 500mg", rate: 12.50, gst: 5 },
  { id: "m2", name: "Paracetamol 650mg", rate: 2.00, gst: 12 },
  { id: "m3", name: "Ibuprofen 400mg", rate: 5.50, gst: 5 },
  { id: "m4", name: "Azithromycin 500mg", rate: 45.00, gst: 18 },
  { id: "m5", name: "Vitamin C Chewable", rate: 1.50, gst: 12 },
];

export function PharmacyBilling() {
  const [patientName, setPatientName] = useState("");
  const [selectedItems, setSelectedItems] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMedicines = MOCK_MEDICINES.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = (med: typeof MOCK_MEDICINES[0]) => {
    const existing = selectedItems.find(i => i.id === med.id);
    if (existing) {
      updateItem(med.id, "quantity", existing.quantity + 1);
    } else {
      setSelectedItems([...selectedItems, { ...med, quantity: 1 }]);
    }
    setSearchTerm("");
  };

  const updateItem = (id: string, field: keyof Medicine, value: any) => {
    setSelectedItems(selectedItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter(i => i.id !== id));
  };

  const totals = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const subtotal = item.rate * item.quantity;
      const gstAmount = (subtotal * item.gst) / 100;
      return {
        subtotal: acc.subtotal + subtotal,
        gst: acc.gst + gstAmount,
        total: acc.total + subtotal + gstAmount
      };
    }, { subtotal: 0, gst: 0, total: 0 });
  }, [selectedItems]);

  const handlePrint = () => {
    window.print();
    toast.success("Preparing prescription...");
  };

  const invoiceData = {
    type: "Pharmacy / Medication Bill",
    patientName,
    date: new Date().toLocaleDateString(),
    items: selectedItems.map(i => ({
      name: i.name,
      amount: i.rate * i.quantity + (i.rate * i.quantity * i.gst / 100),
      details: `${i.quantity} x $${i.rate.toFixed(2)} + ${i.gst}% GST`
    })),
    totalAmount: totals.total,
    amountPaid: totals.total,
    pendingAmount: 0,
    status: "Paid",
    doctor: "Dr. Sarah Johnson",
    clinic: "MediCare+ Premium Clinic"
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Pharmacy Billing</h2>
          <p className="text-slate-500 mt-1">Manage medication billing and inventory sales.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => toast.success("Invoice emailed!")} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium shadow-sm">
            <Mail size={18} />
            Email
          </button>
          <button onClick={() => toast.success("WhatsApp sent!")} className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-100 text-green-700 rounded-xl hover:bg-green-100 transition-all font-medium shadow-sm">
            <MessageCircle size={18} />
            WhatsApp
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-200">
            <Printer size={18} />
            Print Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Search & Patient Info */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Hospital size={16} />
              Clinic Info
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-800 text-sm">MediCare+ Premium Clinic</p>
                <p className="text-xs text-slate-500">123 Health Ave, Medical District</p>
              </div>
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    <Stethoscope size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Dr. Sarah Johnson</p>
                    <p className="text-xs text-slate-500">MD, Internal Medicine</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Pill size={16} />
              Add Items
            </h3>
            <div className="relative mb-4">
              <input 
                type="text"
                placeholder="Search medicine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
              />
              <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {filteredMedicines.map(med => (
                <button
                  key={med.id}
                  onClick={() => addItem(med)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left group"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{med.name}</p>
                    <p className="text-xs text-slate-400">Rate: ${med.rate.toFixed(2)}</p>
                  </div>
                  <Plus size={16} className="text-slate-300 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Billing Table */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex-1 max-w-sm">
                <input 
                  type="text"
                  placeholder="Patient Name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full text-xl font-bold text-slate-800 placeholder:text-slate-300 border-none focus:ring-0 p-0"
                />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-500">{new Date().toDateString()}</p>
                <p className="text-xs text-slate-400">INV-2026-001</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Qty</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Rate ($)</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider w-32">GST (%)</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Total ($)</th>
                    <th className="px-6 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedItems.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                          className="w-16 text-center py-1 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <input 
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, "rate", Number(e.target.value))}
                          className="w-24 text-right py-1 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <input 
                          type="number"
                          value={item.gst}
                          onChange={(e) => updateItem(item.id, "gst", Number(e.target.value))}
                          className="w-16 text-right py-1 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800">
                        ${(item.rate * item.quantity * (1 + item.gst / 100)).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {selectedItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                        No medicines added yet. Search and add items from the sidebar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-slate-50/30 flex justify-end">
              <div className="w-80 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-700">${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Tax (GST)</span>
                  <span className="font-semibold text-slate-700">${totals.gst.toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-200 my-2"></div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold text-slate-900">Grand Total</span>
                  <span className="text-3xl font-black text-blue-600">${totals.total.toFixed(2)}</span>
                </div>
                <div className="pt-4 flex items-center gap-2 text-xs text-slate-400 italic">
                  <Info size={14} />
                  Includes all applicable taxes and fees.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Invoice Template for Printing */}
      <div className="print-only">
        <InvoiceTemplate data={invoiceData} />
      </div>
    </div>
  );
}
