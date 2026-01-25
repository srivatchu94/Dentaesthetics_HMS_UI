import React, { useEffect, useMemo, useState } from "react";
import {
  listClinicalSpecialties,
  searchDoctors,
  getDoctorsByEnterpriseId,
  mapDoctorToClinics,
  getDoctorsForMapping,
  getDoctorClinicMappings,
} from "../services/doctorService";
import { getClinicsByEnterpriseId } from "../services/clinicService";
import { listEnterprises } from "../services/enterpriseService";

const todayIso = new Date().toISOString().split("T")[0];

const defaultClinicConfig = () => ({
  doctorRole: "Consultant",
  consultationType: "In-person",
  startDate: todayIso,
  endDate: "",
  availableDays: "",
  isPrimaryClinic: false,
});

export default function DoctorClinicMappingSuperAdmin() {
  const [filters, setFilters] = useState({
    enterpriseId: "",
    doctorId: "",
    firstName: "",
    lastName: "",
  });
  const [specialties, setSpecialties] = useState([]);
  const [enterprises, setEnterprises] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedClinics, setSelectedClinics] = useState([]);
  const [primaryClinicId, setPrimaryClinicId] = useState(null);
  const [clinicConfigs, setClinicConfigs] = useState({});
  const [activeClinicId, setActiveClinicId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState({ doctors: false, clinics: false, save: false, initial: true });
  const [toast, setToast] = useState({ type: "", message: "" });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState({ doctorName: "", clinics: [], count: 0, primaryClinic: "" });

  // Debug logging to see if enterprises are in state
  console.log('🔍 Enterprises in state:', enterprises);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 5000);
  };

  useEffect(() => {
    let mounted = true;
    
    // Set a timeout to ensure loading state is cleared after 15 seconds
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('⚠️ Enterprise loading timeout - clearing loading state');
        setLoading((s) => ({ ...s, initial: false }));
      }
    }, 15000);
    
    // Load both in parallel for faster performance
    Promise.all([
      listClinicalSpecialties()
        .then((data) => {
          console.log('✅ Specialties loaded:', data);
          return { specialties: Array.isArray(data) ? data : [] };
        })
        .catch((err) => {
          console.error("❌ Failed to load specialties:", err);
          return { specialties: [] };
        }),
      listEnterprises()
        .then((data) => {
          console.log("✅ Enterprises loaded:", data);
          return { enterprises: Array.isArray(data) ? data : [] };
        })
        .catch((err) => {
          console.error("❌ Failed to load enterprises:", err);
          if (mounted) {
            showToast("error", `Failed to load enterprises: ${err?.message || 'Unknown error'}`);
          }
          return { enterprises: [] };
        })
    ])
    .then((results) => {
      if (!mounted) return;
      clearTimeout(timeoutId);
      
      // results is an array from Promise.all: [specResult, entResult]
      const [specResult, entResult] = results;
      const spec = specResult?.specialties || [];
      const ent = entResult?.enterprises || [];
      
      setSpecialties(spec);
      setEnterprises(ent);
      setLoading((s) => ({ ...s, initial: false }));
      
      console.log(`📊 Loaded ${spec.length} specialties and ${ent.length} enterprises`);
      
      if (ent.length === 0) {
        showToast("warning", "No enterprises available. Please contact admin.");
      }
    })
    .catch((err) => {
      if (mounted) {
        clearTimeout(timeoutId);
        console.error('❌ Critical error loading data:', err);
        setSpecialties([]);
        setEnterprises([]);
        setLoading((s) => ({ ...s, initial: false }));
        showToast("error", "Failed to load page data. Please refresh.");
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const filteredDoctors = useMemo(() => {
    if (!searchTerm.trim()) return doctors;
    const term = searchTerm.toLowerCase();
    return doctors.filter((d) =>
      `${d.firstName || ""} ${d.lastName || ""}`.toLowerCase().includes(term) ||
      (d.staffId || "").toString().includes(term)
    );
  }, [doctors, searchTerm]);

  const handleSearch = async () => {
    const enterpriseId = filters.enterpriseId;
    if (!enterpriseId || !enterpriseId.trim()) {
      showToast("error", "Choose an enterprise to search.");
      return;
    }
    setLoading((s) => ({ ...s, doctors: true }));
    try {
      console.log('🔍 Starting doctor search with filters:', filters);
      
      // Call the doctors/mapping endpoint
      const result = await getDoctorsForMapping({
        enterpriseId: enterpriseId,
        profileId: filters.doctorId || undefined,
        firstName: filters.firstName || undefined,
        lastName: filters.lastName || undefined,
      });

      console.log('✅ Doctors received:', result);

      const refined = result || [];

      setDoctors(refined);
      setSelectedDoctor(null);
      setClinics([]);
      setSelectedClinics([]);
      setClinicConfigs({});
      setActiveClinicId(null);
      setPrimaryClinicId(null);
      if (refined.length === 0) {
        showToast("info", "No doctors found for this enterprise.");
      } else {
        showToast("success", `Found ${refined.length} doctor(s).`);
      }
    } catch (err) {
      console.error("❌ Doctor search failed:", err);
      console.error("Error details:", err?.response || err?.message || err);
      showToast("error", `Unable to fetch doctors: ${err?.message || 'Try again.'}`);
      setDoctors([]);
    } finally {
      setLoading((s) => ({ ...s, doctors: false }));
    }
  };

  const hydrateConfigs = (clinicIds) => {
    setClinicConfigs((prev) => {
      const next = { ...prev };
      clinicIds.forEach((id) => {
        if (!next[id]) next[id] = defaultClinicConfig();
      });
      return next;
    });
  };

  const handleDoctorSelect = async (doctor) => {
    setSelectedDoctor(doctor);
    const enterpriseId = parseInt(filters.enterpriseId || doctor?.enterpriseId, 10);
    if (!enterpriseId) {
      showToast("error", "Enterprise ID required to load clinics.");
      return;
    }
    setLoading((s) => ({ ...s, clinics: true }));
    try {
      console.log(`🏥 Loading clinics for enterprise ID: ${enterpriseId}`);
      const resp = await getClinicsByEnterpriseId(enterpriseId);
      const clinicList = Array.isArray(resp) ? resp : resp ? [resp] : [];
      console.log(`✅ Clinics received: ${clinicList.length} clinic(s)`, clinicList);
      setClinics(clinicList);
      
      // Fetch doctor's existing clinic mappings to set assigned and primary clinics
      let primaryId = null;
      let mappedClinicIds = [];
      try {
        const doctorId = doctor?.doctorId || doctor?.staffId || doctor?.profileId || doctor?.doctorProfileId || doctor?.id;
        if (doctorId) {
          const mappings = await getDoctorClinicMappings(doctorId);
          console.log('📋 Doctor Clinic Mappings:', mappings);
          if (Array.isArray(mappings)) {
            mappedClinicIds = mappings
              .map(m => parseInt(m.clinicId || m.ClinicId, 10))
              .filter(Boolean);

            const primaryMapping = mappings.find(m => m.isPrimaryClinic || m.IsPrimaryClinic);
            if (primaryMapping) {
              primaryId = parseInt(primaryMapping.clinicId || primaryMapping.ClinicId, 10) || null;
              console.log('⭐ Found Primary Clinic from Mappings:', primaryId);
            }
          }
        }
      } catch (mappingErr) {
        console.warn('⚠️ Could not fetch doctor mappings:', mappingErr);
      }

      // Fallback: use doctor.clinicId as primary if mappings did not provide one
      if (!primaryId && doctor?.clinicId) {
        primaryId = parseInt(doctor.clinicId, 10) || null;
        if (primaryId) {
          mappedClinicIds = mappedClinicIds.length ? mappedClinicIds : [primaryId];
          console.log('⭐ Fallback primary from doctor.clinicId:', primaryId);
        }
      }

      setPrimaryClinicId(primaryId);
      console.log('⭐ Final Primary Clinic ID:', primaryId);

      // Only keep mapped clinics that exist in the loaded clinic list
      const clinicIdsAvailable = clinicList.map(c => parseInt(c.clinicId, 10)).filter(Boolean);
      let dedupedSelected = Array.from(new Set(mappedClinicIds))
        .filter(Boolean)
        .filter(id => clinicIdsAvailable.includes(id));

      // If still none selected but primaryId exists in available clinics, preselect it
      if (dedupedSelected.length === 0 && primaryId && clinicIdsAvailable.includes(primaryId)) {
        dedupedSelected = [primaryId];
      }
      setSelectedClinics(dedupedSelected);
      hydrateConfigs(dedupedSelected);
      // ensure clinicConfigs marks the primary one
      setClinicConfigs((prev) => {
        const next = { ...prev };
        dedupedSelected.forEach((id) => {
          if (!next[id]) next[id] = defaultClinicConfig();
          if (primaryId && parseInt(id, 10) === primaryId) {
            next[id] = { ...next[id], isPrimaryClinic: true };
          }
        });
        return next;
      });
      setActiveClinicId(primaryId || dedupedSelected[0] || null);
      if (clinicList.length === 0) {
        showToast("warning", "No clinics found for this enterprise.");
      }
    } catch (err) {
      console.error("❌ Clinic fetch failed", err);
      showToast("error", `Unable to load clinics: ${err?.message || 'Try again'}`);
      setClinics([]);
      setSelectedClinics([]);
      setClinicConfigs({});
      setActiveClinicId(null);
      setPrimaryClinicId(null);
    } finally {
      setLoading((s) => ({ ...s, clinics: false }));
    }
  };

  const toggleClinic = (clinicId) => {
    setSelectedClinics((prev) => {
      const exists = prev.includes(clinicId);
      if (exists) {
        const next = prev.filter((id) => id !== clinicId);
        const configs = { ...clinicConfigs };
        delete configs[clinicId];
        setClinicConfigs(configs);
        if (activeClinicId === clinicId) setActiveClinicId(next[0] || null);
        return next;
      }
      const next = [...prev, clinicId];
      hydrateConfigs([clinicId]);
      setActiveClinicId(clinicId);
      return next;
    });
  };

  const updateClinicConfig = (clinicId, field, value) => {
    setClinicConfigs((prev) => {
      const current = prev[clinicId] || defaultClinicConfig();
      const updated = { ...current, [field]: value };
      let next = { ...prev, [clinicId]: updated };
      if (field === "isPrimaryClinic" && value) {
        // Ensure only one primary
        Object.keys(next).forEach((id) => {
          if (parseInt(id, 10) !== clinicId) {
            next[id] = { ...next[id], isPrimaryClinic: false };
          }
        });
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedDoctor) {
      showToast("error", "Choose a doctor before saving.");
      return;
    }
    if (selectedClinics.length === 0) {
      showToast("error", "Select at least one clinic.");
      return;
    }
    
    console.log('👨‍⚕️ Selected doctor object:', selectedDoctor);
    console.log('Doctor properties:', {
      doctorId: selectedDoctor.doctorId,
      staffId: selectedDoctor.staffId,
      profileId: selectedDoctor.profileId,
      id: selectedDoctor.id,
      doctorProfileId: selectedDoctor.doctorProfileId,
    });
    
    // Require at least one primary clinic before saving
    const hasPrimary = selectedClinics.some((id) => clinicConfigs[id]?.isPrimaryClinic) || !!primaryClinicId;
    if (!hasPrimary) {
      showToast("error", "Select at least one primary clinic before saving.");
      return;
    }

    const mappings = selectedClinics.map((clinicId) => {
      const cfg = clinicConfigs[clinicId] || defaultClinicConfig();
      const doctorId = selectedDoctor.doctorId || selectedDoctor.staffId || selectedDoctor.profileId || selectedDoctor.id;
      
      console.log(`Mapping for clinic ${clinicId}:`, { doctorId, clinicId });
      
      return {
        DoctorId: doctorId,
        ClinicId: clinicId,
        IsActive: true,
        DoctorRole: cfg.doctorRole,
        Specialty: selectedDoctor.specialty || null,
        StartDate: cfg.startDate ? new Date(cfg.startDate).toISOString() : new Date().toISOString(),
        EndDate: cfg.endDate ? new Date(cfg.endDate).toISOString() : null,
        AvailableDays: cfg.availableDays || null,
        IsPrimaryClinic: cfg.isPrimaryClinic || (primaryClinicId && primaryClinicId === clinicId) || false,
        ConsultationType: cfg.consultationType,
        CreatedBy: "System",
        CreatedAt: new Date().toISOString(),
        UpdatedBy: "System",
        UpdatedAt: new Date().toISOString(),
      };
    });

    console.log('💾 Saving mappings:', {
      doctor: selectedDoctor.firstName + ' ' + selectedDoctor.lastName,
      clinicCount: selectedClinics.length,
      mappings: mappings
    });

    setLoading((s) => ({ ...s, save: true }));
    try {
      const result = await mapDoctorToClinics(mappings);
      console.log('✅ Save response:', result);
      
      // Show detailed success message
      const doctorName = `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`;
      const clinicNames = selectedClinics.map(id => {
        const clinic = clinics.find(c => c.clinicId === id);
        return clinic?.clinicName || `Clinic ${id}`;
      }).join(', ');
      const primaryFromConfig = selectedClinics.find((id) => clinicConfigs[id]?.isPrimaryClinic);
      const resolvedPrimaryId = primaryFromConfig || primaryClinicId || null;
      const primaryClinicName = resolvedPrimaryId
        ? (clinics.find(c => parseInt(c.clinicId, 10) === parseInt(resolvedPrimaryId, 10))?.clinicName || `Clinic ${resolvedPrimaryId}`)
        : null;
      
      const primarySuffix = primaryClinicName ? ` Primary clinic: ${primaryClinicName}.` : "";
      showToast("success", `✅ Successfully mapped ${doctorName} to ${selectedClinics.length} clinic(s).${primarySuffix}`);
      
      // Show success modal with details
      setSuccessDetails({
        doctorName: doctorName,
        clinics: clinicNames.split(', '),
        count: selectedClinics.length,
        primaryClinic: primaryClinicName || ""
      });
      setShowSuccessModal(true);
      
      // Reset only selections, keep enterprise, doctors, and clinics loaded
      setSelectedDoctor(null);
      setSelectedClinics([]);
      setClinicConfigs({});
      setActiveClinicId(null);
      setClinics([]);
      setSearchTerm("");
    } catch (err) {
      console.error("❌ Save mapping failed:", err);
      showToast("error", `Unable to save mapping: ${err?.message || 'Try again'}`);
    } finally {
      setLoading((s) => ({ ...s, save: false }));
    }
  };

  const handleClear = () => {
    setFilters({ enterpriseId: "", doctorId: "", firstName: "", lastName: "", specialtyId: "" });
    setDoctors([]);
    setSelectedDoctor(null);
    setClinics([]);
    setSelectedClinics([]);
    setClinicConfigs({});
    setActiveClinicId(null);
    setSearchTerm("");
  };

  const activeClinic = useMemo(() => clinics.find((c) => c.clinicId === activeClinicId), [clinics, activeClinicId]);

  const activeConfig = activeClinicId ? clinicConfigs[activeClinicId] || defaultClinicConfig() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-50 px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <header className="bg-white shadow-lg rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">🔗 Doctor-Clinic Mapping</p>
            <h1 className="text-2xl font-bold text-slate-900">Map doctors to multiple clinic locations</h1>
          </div>
          {toast.message && (
            <div
              className={`px-4 py-2 rounded-xl text-sm font-semibold shadow ${
                toast.type === "error"
                  ? "bg-rose-100 text-rose-700"
                  : toast.type === "success"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {toast.message}
            </div>
          )}
        </header>

        <section className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <select
                value={filters.enterpriseId}
                onChange={(e) => setFilters({ ...filters, enterpriseId: e.target.value })}
                disabled={loading.initial}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loading.initial ? "Loading enterprises..." : "Select Enterprise"}
                </option>
                {enterprises && enterprises.length > 0 ? (
                  enterprises.map((ent) => (
                    <option key={ent.enterpriseId} value={ent.enterpriseId}>
                      {ent.enterpriseName || ent.name || `Enterprise ${ent.enterpriseId}`}
                    </option>
                  ))
                ) : (
                  <option disabled>No enterprises available</option>
                )}
              </select>
              {loading.initial && (
                <div className="absolute right-4 top-2.5 text-indigo-600">
                  <span className="animate-spin">⟳</span>
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="🆔 Doctor ID"
              value={filters.doctorId}
              onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}
              className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400"
            />
            <input
              type="text"
              placeholder="👤 First Name"
              value={filters.firstName}
              onChange={(e) => setFilters({ ...filters, firstName: e.target.value })}
              className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400"
            />
            <input
              type="text"
              placeholder="📝 Last Name"
              value={filters.lastName}
              onChange={(e) => setFilters({ ...filters, lastName: e.target.value })}
              className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={loading.doctors}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow disabled:opacity-70"
            >
              {loading.doctors ? "Searching..." : "🔍 Search"}
            </button>
            <button
              onClick={handleClear}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold"
            >
              🗑️ Clear
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[320px_340px_1fr] gap-4 min-h-[600px]">
          <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👨‍⚕️</span>
                <div>
                  <p className="text-sm text-slate-500">Doctors</p>
                  <p className="text-lg font-bold text-slate-900">{doctors.length || "0"}</p>
                </div>
              </div>
              {doctors.length > 0 && (
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="🔍 Search..."
                  className="px-3 py-2 border-2 border-slate-200 rounded-xl text-sm"
                />
              )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loading.doctors ? (
                <div className="text-center text-slate-500 py-10">Loading doctors...</div>
              ) : filteredDoctors.length === 0 ? (
                <div className="text-center text-slate-400 py-10">No doctors yet. Search to begin.</div>
              ) : (
                filteredDoctors.map((doc) => {
                  console.log('📋 Doctor from left panel:', doc);
                  const selected = selectedDoctor?.doctorId === doc.doctorId;
                  return (
                    <button
                      key={doc.doctorId}
                      onClick={() => {
                        console.log('🔍 Selected doctor from left panel:', doc);
                        console.log('Doctor ID field:', doc.doctorId);
                        handleDoctorSelect(doc);
                      }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition shadow-sm ${
                        selected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 hover:border-indigo-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-slate-100 rounded-xl p-2 text-2xl">👨‍⚕️</div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">Dr. {doc.firstName} {doc.lastName}</p>
                          <p className="text-xs text-slate-500">Staff ID: {doc.staffId || "—"}</p>
                          <p className="text-xs text-slate-500">Specialty ID: {doc.specialtyId || "—"}</p>
                        </div>
                        {selected && <span className="text-2xl">✅</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏥</span>
                <div>
                  <p className="text-sm text-slate-500">Clinics</p>
                  <p className="text-lg font-bold text-slate-900">{selectedClinics.length} selected</p>
                </div>
              </div>
            </div>

            {!selectedDoctor ? (
              <div className="text-center text-slate-400 py-10">Select a doctor to view clinics.</div>
            ) : (
              <>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                  <p className="text-xs text-slate-500">Mapping for:</p>
                  <p className="font-bold text-slate-900">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</p>
                  <p className="text-xs text-slate-500">Staff ID: {selectedDoctor.staffId || "—"}</p>
                </div>

                <div className="text-xs text-slate-500 mb-2">Clinics for Enterprise</div>
                <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                  {loading.clinics ? (
                    <div className="text-center text-slate-500 py-10">Loading clinics...</div>
                  ) : clinics.length === 0 ? (
                    <div className="text-center text-slate-400 py-10">No clinics available.</div>
                  ) : (
                    clinics.map((clinic) => {
                      const clinicIdNum = parseInt(clinic.clinicId, 10);
                      const chosen = selectedClinics.some((id) => parseInt(id, 10) === clinicIdNum);
                      const isPrimary = primaryClinicId && primaryClinicId === clinicIdNum;
                      
                      console.log(`Checking clinic: ${clinic.clinicName} - ID: ${clinicIdNum}, Primary: ${primaryClinicId}, Is Primary: ${isPrimary}`);
                      
                      return (
                        <button
                          key={clinic.clinicId}
                          onClick={() => toggleClinic(clinic.clinicId)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition ${
                            chosen
                              ? "border-emerald-500 bg-emerald-50 shadow"
                              : "border-slate-200 hover:border-emerald-200"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xl">{chosen ? "✓" : "🏥"}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-slate-900">{clinic.clinicName}</p>
                                {isPrimary && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                                    ⭐ Primary
                                  </span>
                                )}
                                {chosen && !isPrimary && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                                    ✓ Assigned
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">{clinic.clinicAddress || clinic.clinicCity || ""}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">⚙️</span>
              <p className="font-bold text-slate-900">Configuration Panel</p>
            </div>

            {!primaryClinicId && (
              <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm px-3 py-2">
                ⭐ Please set a primary clinic before configuring.
              </div>
            )}

            {selectedClinics.length > 0 ? (
              <>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                  {selectedClinics.map((id) => {
                    const clinic = clinics.find((c) => c.clinicId === id);
                    const isActive = id === activeClinicId;
                    return (
                      <button
                        key={id}
                        onClick={() => setActiveClinicId(id)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 whitespace-nowrap ${
                          isActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-200"
                        }`}
                      >
                        {clinic?.clinicName || "Clinic"}
                        {isActive && <span className="ml-2">✨</span>}
                      </button>
                    );
                  })}
                </div>

                {activeClinic ? (
                  <div className="space-y-3 flex-1">
                    <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl p-3 shadow">
                      <p className="font-bold text-sm">{activeClinic.clinicName}</p>
                      <p className="text-xs opacity-80">{activeClinic.clinicAddress || activeClinic.clinicCity || ""}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600">👨‍⚕️ Doctor Role</label>
                        <select
                          value={activeConfig?.doctorRole || "Consultant"}
                          onChange={(e) => updateClinicConfig(activeClinicId, "doctorRole", e.target.value)}
                          className="w-full mt-1 px-3 py-2 border-2 border-slate-200 rounded-xl"
                        >
                          <option value="Consultant">🩺 Consultant</option>
                          <option value="Visiting Specialist">✨ Visiting Specialist</option>
                          <option value="Resident">🎓 Resident</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600">💬 Consultation Type</label>
                        <select
                          value={activeConfig?.consultationType || "In-person"}
                          onChange={(e) => updateClinicConfig(activeClinicId, "consultationType", e.target.value)}
                          className="w-full mt-1 px-3 py-2 border-2 border-slate-200 rounded-xl"
                        >
                          <option value="In-person">🏥 In-person</option>
                          <option value="Telehealth">💻 Telehealth</option>
                          <option value="Hybrid">🔄 Hybrid</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600">📅 Start Date</label>
                        <input
                          type="date"
                          value={activeConfig?.startDate || todayIso}
                          onChange={(e) => updateClinicConfig(activeClinicId, "startDate", e.target.value)}
                          className="w-full mt-1 px-3 py-2 border-2 border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600">🏁 End Date</label>
                        <input
                          type="date"
                          value={activeConfig?.endDate || ""}
                          onChange={(e) => updateClinicConfig(activeClinicId, "endDate", e.target.value)}
                          className="w-full mt-1 px-3 py-2 border-2 border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600">📆 Available Days</label>
                      <input
                        type="text"
                        placeholder="e.g., Mon, Wed, Fri"
                        value={activeConfig?.availableDays || ""}
                        onChange={(e) => updateClinicConfig(activeClinicId, "availableDays", e.target.value)}
                        className="w-full mt-1 px-3 py-2 border-2 border-slate-200 rounded-xl"
                      />
                    </div>

                    <label className="flex items-center gap-3 border-2 border-slate-200 rounded-xl px-3 py-2">
                      <input
                        type="checkbox"
                        checked={!!activeConfig?.isPrimaryClinic}
                        onChange={(e) => updateClinicConfig(activeClinicId, "isPrimaryClinic", e.target.checked)}
                        className="w-5 h-5 accent-indigo-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">⭐ Primary Clinic</p>
                        <p className="text-xs text-slate-500">Set as main location</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="text-slate-400">Select a clinic to configure.</div>
                )}

                <div className="flex gap-3 pt-4 border-t mt-4">
                  <button
                    onClick={() => {
                      setSelectedClinics([]);
                      setClinicConfigs({});
                      setActiveClinicId(null);
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-semibold"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading.save}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow disabled:opacity-70"
                  >
                    {loading.save ? "Saving..." : "💾 Save"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-slate-400">Pick clinics to configure.</div>
            )}
          </div>
        </section>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-bounce-in">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Mapping Successful!</h2>
              <p className="text-slate-600">Doctor has been successfully mapped to clinics</p>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">👨‍⚕️</span>
                <p className="font-bold text-slate-900">{successDetails.doctorName}</p>
              </div>

              {successDetails.primaryClinic && (
                <div className="flex items-center gap-2 mb-3 text-sm text-amber-700 font-semibold">
                  <span className="text-lg">⭐</span>
                  <span>Primary clinic: {successDetails.primaryClinic}</span>
                </div>
              )}
              
              <div className="border-t border-slate-200 pt-3">
                <p className="text-sm text-slate-600 mb-2 font-semibold">Mapped to {successDetails.count} clinic(s):</p>
                <ul className="space-y-1">
                  {successDetails.clinics.map((clinic, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-emerald-600">✓</span>
                      <span>{clinic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Continue Mapping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
