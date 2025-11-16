import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCreateClinic } from "../services/hooks";

export default function CreateClinic() {
  const navigate = useNavigate();

  // Collapsible sections open state (stacked/docked)
  const [open, setOpen] = useState({ details: true, contact: false, hours: false, meta: false });
  const [form, setForm] = useState({
    enterpriseId: "",
    clinicName: "",
    clinicPhone: "",
    clinicEmail: "",
    clinicAddress: "",
    clinicCity: "",
    operatingHours: "",
    notes: ""
  });

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const createClinic = useCreateClinic();

  const isValid = useMemo(() => {
    return (
      form.enterpriseId !== "" &&
      form.clinicName.trim().length > 0 &&
      form.clinicAddress.trim().length > 0 &&
      form.clinicCity.trim().length > 0
    );
  }, [form]);

  const handleSave = async () => {
    if (!isValid || createClinic.loading) return;
    const payload = {
      enterpriseId: Number(form.enterpriseId),
      clinicName: form.clinicName.trim(),
      clinicAddress: form.clinicAddress.trim(),
      clinicCity: form.clinicCity.trim(),
      clinicPhone: form.clinicPhone?.trim() || "",
      clinicEmail: form.clinicEmail?.trim() || "",
      operatingHours: form.operatingHours?.trim() || "",
    };
    const result = await createClinic.mutate(payload);
    if (result) {
      navigate("/clinics");
    }
  };

  const InputField = ({ label, name, value, onChange, type = "text", required = false, placeholder = "", rows }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-stone-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          name={name}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={rows || 3}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
        />
      )}
    </div>
  );

  const CollapsibleSection = ({ title, icon, isOpen, onToggle, children }) => (
    <div className="mb-4">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-3 rounded-lg border transition shadow-sm ${
          isOpen ? "bg-amber-600 text-white border-amber-600" : "bg-white text-stone-800 border-stone-200 hover:bg-stone-50"
        }`}
      >
        <span className="flex items-center gap-3 font-semibold">
          <span className="text-lg">{icon}</span>
          {title}
        </span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="text-xl">
          ⌄
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-b-xl shadow-inner p-6 border border-t-0 border-stone-200">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Header Bar with Save */}
      <div className="sticky top-20 z-20 bg-white/80 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-700 via-rose-700 to-orange-700 bg-clip-text text-transparent">
              Create Clinic
            </h1>
            <p className="text-stone-600 text-sm">Provide clinic details in the sections below</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={!isValid || createClinic.loading}
            className={`px-6 py-2 rounded-lg font-semibold shadow-lg transition-colors ${
              !isValid || createClinic.loading
                ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-600 via-rose-600 to-orange-600 text-white hover:from-amber-700 hover:via-rose-700 hover:to-orange-700"
            }`}
          >
            {createClinic.loading ? "Saving..." : "Save Clinic"}
          </motion.button>
        </div>
      </div>

      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-gradient-to-br from-white via-amber-50/40 to-rose-50/40 rounded-2xl shadow-md border border-amber-100/60 p-6">
          <p className="text-stone-700">Please fill out the following information to create a new clinic. Fields marked with an asterisk are required.</p>
          {createClinic.error && (
            <p className="mt-3 text-sm text-rose-600">{createClinic.error}</p>
          )}
        </div>
      </div>

      {/* Docked collapsible sections */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <CollapsibleSection
          title="Clinic Details"
          icon="🏷️"
          isOpen={open.details}
          onToggle={() => setOpen((s) => ({ ...s, details: !s.details }))}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Enterprise ID"
              name="enterpriseId"
              value={form.enterpriseId}
              onChange={(v) => update("enterpriseId", v)}
              required
            />
            <InputField
              label="Clinic Name"
              name="clinicName"
              value={form.clinicName}
              onChange={(v) => update("clinicName", v)}
              required
            />
            <div className="md:col-span-2">
              <InputField
                label="Address"
                name="clinicAddress"
                value={form.clinicAddress}
                onChange={(v) => update("clinicAddress", v)}
                placeholder="Street, area, landmark"
              />
            </div>
            <InputField
              label="City"
              name="clinicCity"
              value={form.clinicCity}
              onChange={(v) => update("clinicCity", v)}
            />
          </div>
          {!isValid && (
            <p className="mt-2 text-sm text-rose-600">Please fill required fields: Enterprise ID, Clinic Name, Address, City.</p>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Contact & Address"
          icon="📞"
          isOpen={open.contact}
          onToggle={() => setOpen((s) => ({ ...s, contact: !s.contact }))}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Phone Number"
              name="clinicPhone"
              value={form.clinicPhone}
              onChange={(v) => update("clinicPhone", v)}
            />
            <InputField
              label="Email"
              name="clinicEmail"
              type="email"
              value={form.clinicEmail}
              onChange={(v) => update("clinicEmail", v)}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Operating Hours"
          icon="🕒"
          isOpen={open.hours}
          onToggle={() => setOpen((s) => ({ ...s, hours: !s.hours }))}
        >
          <InputField
            label="Working Hours"
            name="operatingHours"
            type="textarea"
            rows={4}
            value={form.operatingHours}
            onChange={(v) => update("operatingHours", v)}
            placeholder="Example: Mon-Fri 9:00 AM - 6:00 PM, Sat 9:00 AM - 2:00 PM"
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Additional Notes"
          icon="📝"
          isOpen={open.meta}
          onToggle={() => setOpen((s) => ({ ...s, meta: !s.meta }))}
        >
          <InputField
            label="Notes"
            name="notes"
            type="textarea"
            rows={5}
            value={form.notes}
            onChange={(v) => update("notes", v)}
            placeholder="Any special facilities, parking info, or other notes."
          />
        </CollapsibleSection>

        {/* Bottom Action Bar */}
        <div className="mt-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/80 backdrop-blur-sm border border-stone-200 rounded-xl p-4 flex items-center justify-between shadow"
          >
            <button
              onClick={() => navigate("/clinics")}
              className="px-5 py-2 bg-stone-200 text-stone-700 rounded-lg font-semibold hover:bg-stone-300 transition"
            >
              ← Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={!isValid || createClinic.loading}
              className={`px-6 py-2 rounded-lg font-semibold shadow-lg transition-colors ${
                !isValid || createClinic.loading
                  ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-600 via-rose-600 to-orange-600 text-white hover:from-amber-700 hover:via-rose-700 hover:to-orange-700"
              }`}
            >
              {createClinic.loading ? "Saving..." : "Save Clinic"}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
