import React, { useState, useMemo, useEffect } from "react";
import { 
  Printer, 
  Mail, 
  Plus, 
  Trash2, 
  Search, 
  Pill, 
  Hospital,
  Download,
  X,
  ChevronDown,
  Copy,
  Edit2,
  Lock,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendEmail } from "../services/emailService";
import { getClinic } from "../services/clinicService";
import { request } from "../services/apiClient";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function PharmacyBillingModal({ show, onClose, mode = "billing" }) {
  const [patientName, setPatientName] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedPatientMeta, setSelectedPatientMeta] = useState(null);
  const [selectedPatientEmail, setSelectedPatientEmail] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [loadingPatientAppointment, setLoadingPatientAppointment] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-001");
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryMeds, setInventoryMeds] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [clinicInfo, setClinicInfo] = useState(null);
  const [loadingClinic, setLoadingClinic] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [isPdfMode, setIsPdfMode] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [viewSearchType, setViewSearchType] = useState("patient");
  const [viewPatientName, setViewPatientName] = useState("");
  const [viewPatientResults, setViewPatientResults] = useState([]);
  const [showViewPatientDropdown, setShowViewPatientDropdown] = useState(false);
  const [loadingViewPatients, setLoadingViewPatients] = useState(false);
  const [selectedViewPatient, setSelectedViewPatient] = useState(null);
  const [viewAppointmentId, setViewAppointmentId] = useState("");
  const [loadingViewInvoices, setLoadingViewInvoices] = useState(false);
  const [viewInvoices, setViewInvoices] = useState([]);
  const [selectedViewInvoice, setSelectedViewInvoice] = useState(null);

  // Get clinic ID and doctor info
  const getClinicIdAndDoctorInfo = () => {
    const selectedAccessRaw = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
    const userDataRaw = JSON.parse(localStorage.getItem("userData") || "{}");
    const selectedAccess = Array.isArray(selectedAccessRaw) ? (selectedAccessRaw[0] || {}) : selectedAccessRaw;
    const userData = Array.isArray(userDataRaw) ? (userDataRaw[0] || {}) : userDataRaw;
    
    return {
      clinicId: selectedAccess.clinicId || userData.clinicId || 0,
      clinicName: selectedAccess.clinicName || userData.clinicName || "Clinic",
      doctorName: userData.username || "Dr. Dentist",
      registrationNumber: userData.registrationNumber || "Registration #"
    };
  };

  const getResolvedClinicName = () => {
    const selectedAccessRaw = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
    const userDataRaw = JSON.parse(localStorage.getItem("userData") || "{}");
    const selectedAccess = Array.isArray(selectedAccessRaw) ? (selectedAccessRaw[0] || {}) : selectedAccessRaw;
    const userData = Array.isArray(userDataRaw) ? (userDataRaw[0] || {}) : userDataRaw;

    const clinicCore = Array.isArray(clinicInfo)
      ? (clinicInfo[0] || {})
      : clinicInfo?.data?.clinic || clinicInfo?.data || clinicInfo?.clinic || clinicInfo || {};

    const resolvedName =
      clinicCore?.clinicName ||
      clinicCore?.ClinicName ||
      clinicCore?.name ||
      clinicCore?.Name ||
      selectedAccess?.clinicName ||
      selectedAccess?.ClinicName ||
      selectedAccess?.clinic?.clinicName ||
      selectedAccess?.clinic?.ClinicName ||
      selectedAccess?.clinic?.name ||
      selectedAccess?.clinic?.Name ||
      selectedAccess?.access?.clinicName ||
      selectedAccess?.access?.ClinicName ||
      selectedAccess?.access?.clinic?.clinicName ||
      selectedAccess?.access?.clinic?.ClinicName ||
      userData?.clinicName ||
      userData?.ClinicName ||
      userData?.clinic?.clinicName ||
      userData?.clinic?.ClinicName ||
      userData?.clinic?.name ||
      userData?.clinic?.Name ||
      "";

    return String(resolvedName || "").trim() || "Clinic";
  };

  // Load clinic data from API
  useEffect(() => {
    if (show) {
      const { clinicId } = getClinicIdAndDoctorInfo();
      if (clinicId) {
        loadClinicData(clinicId);
      } else {
        setInventoryMeds([]);
        toast.error("Clinic ID not found. Unable to load medicines.");
      }
    }
  }, [show]);

  useEffect(() => {
    if (!show) return;

    const { clinicId } = getClinicIdAndDoctorInfo();
    if (!clinicId) return;

    const searchDebounce = setTimeout(() => {
      loadInventoryMedications(clinicId, searchTerm);
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [show, searchTerm]);

  useEffect(() => {
    if (!show) return;
    setPatientName("");
    setSelectedPatientId(null);
    setSelectedPatientMeta(null);
    setSelectedPatientEmail("");
    setPatientResults([]);
    setPatientAppointments([]);
    setSelectedAppointmentId("");
    setSelectedItems([]);
    setSearchTerm("");
    setAmountPaid(0);
    setRecipientEmail("");
    setShowEmailModal(false);
    setIsEditMode(true);
    setIsPdfMode(false);
    setSavingInvoice(false);
    setShowConfirmModal(false);
    setShowDropdown(false);
    setShowPatientDropdown(false);
    setShowViewInvoiceModal(mode === "view-invoice");
    setViewSearchType("patient");
    setViewPatientName("");
    setViewPatientResults([]);
    setShowViewPatientDropdown(false);
    setLoadingViewPatients(false);
    setSelectedViewPatient(null);
    setViewAppointmentId("");
    setLoadingViewInvoices(false);
    setViewInvoices([]);
    setSelectedViewInvoice(null);
  }, [show, mode]);

  useEffect(() => {
    if (!show) return;

    const keyword = (patientName || "").trim();
    if (keyword.length < 2) {
      setPatientResults([]);
      setLoadingPatients(false);
      return;
    }

    const { clinicId } = getClinicIdAndDoctorInfo();

    const debounceTimer = setTimeout(() => {
      searchPatientsFromBackend(clinicId, keyword);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [show, patientName]);

  useEffect(() => {
    if (!showViewInvoiceModal || viewSearchType !== "patient") return;

    const keyword = (viewPatientName || "").trim();
    if (keyword.length < 2) {
      setViewPatientResults([]);
      setLoadingViewPatients(false);
      return;
    }

    const { clinicId } = getClinicIdAndDoctorInfo();
    const debounceTimer = setTimeout(() => {
      searchPatientsForView(clinicId, keyword);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [showViewInvoiceModal, viewSearchType, viewPatientName]);

  const normalizeViewInvoiceItem = (item, index) => {
    const toNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    return {
      itemId: item?.itemId || item?.ItemId || index + 1,
      itemName: item?.itemName || item?.ItemName || "Unknown Item",
      qty: toNumber(item?.qty ?? item?.Qty ?? item?.quantity ?? item?.Quantity),
      batchNo: item?.batchNo || item?.BatchNo || "",
      expiry: item?.expiry || item?.Expiry || null,
      mrp: toNumber(item?.mrp ?? item?.MRP ?? item?.rate ?? item?.Rate),
      amount: toNumber(item?.amount ?? item?.Amount),
      cgst: toNumber(item?.cgst ?? item?.CGST),
      sgst: toNumber(item?.sgst ?? item?.SGST)
    };
  };

  const normalizeViewedInvoice = (invoice, index) => {
    const itemsRaw =
      invoice?.items ||
      invoice?.Items ||
      invoice?.invoiceItems ||
      invoice?.InvoiceItems ||
      invoice?.pharmacyInvoiceItems ||
      invoice?.PharmacyInvoiceItems ||
      [];

    const itemsArray = Array.isArray(itemsRaw) ? itemsRaw : [];
    const normalizedItems = itemsArray.map((item, itemIndex) => normalizeViewInvoiceItem(item, itemIndex));

    const subtotalCalculated = normalizedItems.reduce((sum, item) => sum + item.amount, 0);
    const totalCGSTCalculated = normalizedItems.reduce((sum, item) => sum + item.cgst, 0);
    const totalSGSTCalculated = normalizedItems.reduce((sum, item) => sum + item.sgst, 0);

    const toNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    return {
      id: invoice?.invoiceId || invoice?.InvoiceId || `inv-${index + 1}`,
      patientId: invoice?.patientId || invoice?.PatientId || invoice?.patientID || invoice?.PatientID || null,
      patientEmail: invoice?.patientEmail || invoice?.PatientEmail || invoice?.email || invoice?.Email || "",
      invoiceNumber: String(
        invoice?.invoiceNumber ||
        invoice?.InvoiceNumber ||
        invoice?.invoiceNo ||
        invoice?.InvoiceNo ||
        "N/A"
      ),
      invoiceDate: invoice?.invoiceDate || invoice?.InvoiceDate || invoice?.createdAt || invoice?.CreatedAt || new Date().toISOString(),
      patientName:
        invoice?.patientName ||
        invoice?.PatientName ||
        `${invoice?.patientFirstName || ""} ${invoice?.patientLastName || ""}`.trim() ||
        "Patient",
      appointmentId: invoice?.appointmentId || invoice?.AppointmentId || "N/A",
      doctorName: invoice?.doctorName || invoice?.DoctorName || invoice?.attendingPhysician || invoice?.AttendingPhysician || "N/A",
      clinicName: invoice?.clinicName || invoice?.ClinicName || getResolvedClinicName(),
      items: normalizedItems,
      subtotal: toNumber(invoice?.subtotal ?? invoice?.Subtotal) || subtotalCalculated,
      totalCGST: toNumber(invoice?.totalCGST ?? invoice?.TotalCGST) || totalCGSTCalculated,
      totalSGST: toNumber(invoice?.totalSGST ?? invoice?.TotalSGST) || totalSGSTCalculated,
      totalAmount:
        toNumber(invoice?.totalAmount ?? invoice?.TotalAmount) ||
        subtotalCalculated + totalCGSTCalculated + totalSGSTCalculated,
      modeOfPayment: invoice?.modeOfPayment || invoice?.ModeOfPayment || "N/A"
    };
  };

  const searchPatientsForView = async (clinicId, keyword) => {
    if (!keyword?.trim()) {
      setViewPatientResults([]);
      return;
    }

    setLoadingViewPatients(true);
    try {
      const words = keyword.trim().split(/\s+/);
      const firstName = words[0] || "";
      const lastName = words.slice(1).join(" ");

      const queryParams = new URLSearchParams();
      if (clinicId) queryParams.append("clinicId", String(clinicId));
      if (firstName) queryParams.append("firstName", firstName);
      if (lastName) queryParams.append("lastName", lastName);

      const data = await request(`/Patient/Patientsearch?${queryParams.toString()}`, { method: "GET" });
      const resultArray = Array.isArray(data) ? data : data ? [data] : [];

      const normalized = resultArray.map((item, index) => {
        const patient = item?.patient || item?.patientDetails || item;
        const first = patient?.patientFirstName || patient?.firstName || "";
        const last = patient?.patientLastName || patient?.lastName || "";
        return {
          id: patient?.patientId || patient?.patientID || patient?.id || null,
          key: patient?.patientId || patient?.patientID || patient?.id || `view-p-${index}`,
          name: `${first} ${last}`.trim() || patient?.patientName || patient?.name || "Unknown Patient"
        };
      }).filter(patient => patient.id);

      setViewPatientResults(normalized);
    } catch (error) {
      console.error("Failed to search patients for view invoice:", error);
      setViewPatientResults([]);
    } finally {
      setLoadingViewPatients(false);
    }
  };

  const handleSearchInvoices = async () => {
    setLoadingViewInvoices(true);
    setViewInvoices([]);
    setSelectedViewInvoice(null);

    try {
      let data = [];

      if (viewSearchType === "patient") {
        const patientId = Number(selectedViewPatient?.id);
        if (!Number.isFinite(patientId) || patientId <= 0) {
          toast.error("Please select a patient from the list.");
          setLoadingViewInvoices(false);
          return;
        }

        data = await request(`/PharmacyInvoice/GetInvoicesByPatient?patientId=${patientId}`, {
          method: "GET"
        });
      } else {
        const appointmentId = Number(viewAppointmentId);
        if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
          toast.error("Please enter a valid appointment ID.");
          setLoadingViewInvoices(false);
          return;
        }

        data = await request(`/PharmacyInvoice/GetInvoicesByAppointment?appointmentId=${appointmentId}`, {
          method: "GET"
        });
      }

      const invoiceArray = Array.isArray(data) ? data : data ? [data] : [];
      const normalizedInvoices = invoiceArray.map((invoice, index) => normalizeViewedInvoice(invoice, index));

      setViewInvoices(normalizedInvoices);
      if (normalizedInvoices.length > 0) {
        setSelectedViewInvoice(normalizedInvoices[0]);
      } else {
        toast.error("No invoices found.");
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      toast.error("Failed to fetch invoices.");
    } finally {
      setLoadingViewInvoices(false);
    }
  };

  const handleOpenViewInvoiceModal = () => {
    setShowViewInvoiceModal(true);
  };

  const resetViewInvoiceState = () => {
    setViewSearchType("patient");
    setViewPatientName("");
    setViewPatientResults([]);
    setShowViewPatientDropdown(false);
    setSelectedViewPatient(null);
    setViewAppointmentId("");
    setViewInvoices([]);
    setSelectedViewInvoice(null);
  };

  const handleCloseViewInvoiceModal = () => {
    resetViewInvoiceState();
    setShowViewInvoiceModal(false);
  };

  const handleOpenInvoiceInMainView = async (invoice) => {
    if (!invoice) return;

    const mappedItems = (invoice.items || []).map((item, index) => {
      const qty = Math.max(1, Number(item.qty) || 1);
      const lineAmount = Number(item.amount) || 0;
      const resolvedRate = Number(item.mrp) || (qty > 0 ? lineAmount / qty : 0);

      return {
        itemId: item.itemId || index + 1,
        name: item.itemName || "Unknown Item",
        itemCode: item.itemCode || "N/A",
        batchNo: item.batchNo || "",
        expiry: item.expiry || null,
        mrp: Number(item.mrp) || resolvedRate,
        quantity: qty,
        rate: resolvedRate,
        cgst: Number(item.cgst) || 0,
        sgst: Number(item.sgst) || 0,
        gst: (Number(item.cgst) || 0) + (Number(item.sgst) || 0),
        availableQuantity: null
      };
    });

    const appointmentIdText = String(invoice.appointmentId || "N/A");
    const invoicePatientEmail = String(invoice.patientEmail || "").trim();
    const invoicePatientId = Number(invoice.patientId);

    setInvoiceNumber(String(invoice.invoiceNumber || "INV-2026-001"));
    setPatientName(String(invoice.patientName || ""));
    setSelectedPatientId(Number.isFinite(invoicePatientId) && invoicePatientId > 0 ? String(invoicePatientId) : null);
    setSelectedPatientMeta((prev) => ({ ...(prev || {}), email: invoicePatientEmail }));
    setSelectedPatientEmail(invoicePatientEmail);
    setRecipientEmail(invoicePatientEmail);
    setPatientAppointments([
      {
        appointmentId: appointmentIdText,
        attendingPhysician: String(invoice.doctorName || "N/A"),
        appointmentDate: invoice.invoiceDate || null
      }
    ]);
    setSelectedAppointmentId(appointmentIdText);
    setSelectedItems(mappedItems);
    setAmountPaid(Number(invoice.totalAmount) || 0);
    setIsEditMode(false);
    setShowViewInvoiceModal(false);

    if (!invoicePatientEmail && Number.isFinite(invoicePatientId) && invoicePatientId > 0) {
      await loadPatientEmailById(invoicePatientId, { applyToRecipient: true });
    }

    toast.success("Invoice loaded. You can now Print, PDF, or Email.");
  };

  const loadClinicData = async (clinicId) => {
    setLoadingClinic(true);
    try {
      const data = await getClinic(clinicId);
      const clinicSource = Array.isArray(data)
        ? (data[0] || {})
        : data?.data?.clinic || data?.data || data?.clinic || data || {};

      setClinicInfo({
        clinicName: clinicSource.clinicName || clinicSource.ClinicName || clinicSource.name || clinicSource.Name || "",
        clinicAddress: clinicSource.clinicAddress || clinicSource.ClinicAddress || clinicSource.address || clinicSource.Address || "",
        clinicPhone: clinicSource.clinicPhone || clinicSource.ClinicPhone || clinicSource.phone || clinicSource.Phone || "",
        clinicEmail: clinicSource.clinicEmail || clinicSource.ClinicEmail || clinicSource.email || clinicSource.Email || ""
      });
      console.log("✅ Clinic data loaded:", data);
    } catch (error) {
      console.error("Failed to load clinic:", error);
      toast.error("Failed to load clinic details");
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      setClinicInfo({
        clinicName: userData.clinicName || "Dental Clinic",
        clinicAddress: userData.clinicAddress || "Clinic Address",
        clinicPhone: userData.clinicPhone || "+1-555-1234",
        clinicEmail: userData.clinicEmail || "clinic@example.com"
      });
    } finally {
      setLoadingClinic(false);
    }
  };

  const searchPatientsFromBackend = async (clinicId, keyword) => {
    if (!keyword?.trim()) {
      setPatientResults([]);
      return;
    }

    setLoadingPatients(true);
    try {
      const words = keyword.trim().split(/\s+/);
      const firstName = words[0] || "";
      const lastName = words.slice(1).join(" ");

      const normalizePatients = (responseData) => {
        const resultArray = Array.isArray(responseData) ? responseData : responseData ? [responseData] : [];
        return resultArray.map((p, index) => {
          const patientCore = p.patient || p.patientDetails || p;
          const contactCore = p.patientContact || patientCore.patientContact || {};

          const first = patientCore.patientFirstName || patientCore.firstName || p.patientFirstName || p.firstName || "";
          const last = patientCore.patientLastName || patientCore.lastName || p.patientLastName || p.lastName || "";
          const fullName =
            `${first} ${last}`.trim() ||
            patientCore.patientName ||
            patientCore.name ||
            p.patientName ||
            p.name ||
            "Unknown Patient";

          const age = patientCore.patientAge || patientCore.age || patientCore.patientDOB || p.patientAge || p.age || p.patientDOB || "";
          const gender = patientCore.gender || patientCore.patientGender || p.gender || p.patientGender || "";
          const phone =
            contactCore.patientPhone ||
            contactCore.phone ||
            contactCore.phoneNumber ||
            contactCore.mobile ||
            contactCore.mobileNumber ||
            patientCore.patientPhone ||
            patientCore.phone ||
            patientCore.phoneNumber ||
            patientCore.mobile ||
            patientCore.mobileNumber ||
            p.patientPhone ||
            p.phone ||
            p.phoneNumber ||
            p.mobile ||
            p.mobileNumber ||
            "";
          const email =
            contactCore.patientEmail ||
            contactCore.email ||
            contactCore.emailAddress ||
            patientCore.patientEmail ||
            patientCore.email ||
            patientCore.emailAddress ||
            p.patientEmail ||
            p.email ||
            p.emailAddress ||
            "";

          const resolvedPatientId =
            patientCore.patientId ||
            patientCore.patientID ||
            patientCore.id ||
            p.patientId ||
            p.patientID ||
            p.id ||
            null;

          const resolvedPatientCode =
            patientCore.patientCode ||
            patientCore.patientNo ||
            patientCore.patientNumber ||
            p.patientCode ||
            p.patientNo ||
            p.patientNumber ||
            "";

          return {
            id: resolvedPatientId,
            key: resolvedPatientId ? `pid-${resolvedPatientId}` : `p-${index}`,
            name: fullName,
            patientCode: resolvedPatientCode,
            firstName: first,
            lastName: last,
            age,
            gender,
            phone,
            email
          };
        });
      };

      const fetchSearch = async (paramsObj) => {
        const queryParams = new URLSearchParams();
        if (paramsObj.clinicId) queryParams.append("clinicId", String(paramsObj.clinicId));
        if (paramsObj.firstName) queryParams.append("firstName", paramsObj.firstName);
        if (paramsObj.lastName) queryParams.append("lastName", paramsObj.lastName);
        if (paramsObj.patientId) queryParams.append("patientId", String(paramsObj.patientId));

        if (![...queryParams.keys()].length) return [];

        const data = await request(`/Patient/Patientsearch?${queryParams.toString()}`, {
          method: "GET"
        });
        return normalizePatients(data);
      };

      const attempts = [
        { clinicId, firstName, lastName },
        { clinicId, firstName: keyword.trim() },
        { firstName, lastName },
        { firstName: keyword.trim() }
      ];

      const numericPatientId = Number(keyword);
      if (Number.isInteger(numericPatientId) && numericPatientId > 0) {
        attempts.unshift({ clinicId, patientId: numericPatientId });
        attempts.push({ patientId: numericPatientId });
      }

      let finalResults = [];
      for (const params of attempts) {
        try {
          const results = await fetchSearch(params);
          if (results.length > 0) {
            finalResults = results;
            break;
          }
        } catch {
          // Try next strategy
        }
      }

      const uniqueResults = finalResults.filter((patient, index, arr) =>
        arr.findIndex((p) => String(p.id) === String(patient.id)) === index
      );

      setPatientResults(uniqueResults);
    } catch (error) {
      console.error("Failed to search patients:", error);
      setPatientResults([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setPatientName(patient.name);
    setSelectedPatientId(patient.id);
    setSelectedPatientMeta(patient);
    setSelectedPatientEmail(patient.email || "");
    setShowPatientDropdown(false);
    if (!patient.id || !Number.isFinite(Number(patient.id))) {
      toast.error("Unable to load appointment details: patient ID not found in search response.");
      setPatientAppointments([]);
      setSelectedAppointmentId("");
      return;
    }

    if (!patient.email) {
      loadPatientEmailById(patient.id);
    }

    loadPatientAppointmentDetails(patient.id, patient);
  };

  const extractPatientEmail = (data) => {
    if (!data) return "";

    const source = Array.isArray(data) ? data[0] : data;
    const patientCore = source?.patient || source?.patientDetails || source;
    const contactCore = source?.patientContact || patientCore?.patientContact || {};

    return (
      contactCore.patientEmail ||
      contactCore.email ||
      contactCore.emailAddress ||
      patientCore.patientEmail ||
      patientCore.email ||
      patientCore.emailAddress ||
      source?.patientEmail ||
      source?.email ||
      source?.emailAddress ||
      ""
    );
  };

  const loadPatientEmailById = async (patientId, options = {}) => {
    const { applyToRecipient = false } = options;
    const numericPatientId = Number(patientId);
    if (!Number.isFinite(numericPatientId) || numericPatientId <= 0) return "";

    try {
      const profileData = await request(`/Patient/details/fullProfile?patientId=${numericPatientId}`, {
        method: "GET"
      });

      const resolvedEmail = extractPatientEmail(profileData);
      if (resolvedEmail) {
        setSelectedPatientEmail(resolvedEmail);
        if (applyToRecipient) {
          setRecipientEmail(resolvedEmail);
        }
        setSelectedPatientMeta((prev) => (prev ? { ...prev, email: resolvedEmail } : prev));
      }
      return resolvedEmail || "";
    } catch (error) {
      console.error("Failed to load patient email by id:", error);
      return "";
    }
  };

  const loadPatientAppointmentDetails = async (patientId, patientMeta = null) => {
    const numericPatientId = Number(patientId);
    if (!Number.isFinite(numericPatientId) || numericPatientId <= 0) {
      setPatientAppointments([]);
      setSelectedAppointmentId("");
      return;
    }

    setLoadingPatientAppointment(true);
    try {
      const { clinicId } = getClinicIdAndDoctorInfo();

      const getArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

      let appointments = [];

      try {
        const byPatient = await request(`/Appointments/GetByPatient?patientId=${numericPatientId}`, {
          method: "GET"
        });
        appointments = getArray(byPatient);
      } catch {
        appointments = [];
      }

      const effectiveFirstName = (patientMeta?.firstName || patientName.split(" ")[0] || "").trim();
      const effectiveLastName = (patientMeta?.lastName || patientName.split(" ").slice(1).join(" ") || "").trim();

      if (!appointments.length && clinicId && (effectiveFirstName || effectiveLastName)) {
        try {
          const queryParams = new URLSearchParams({ clinicId: String(clinicId) });
          if (effectiveFirstName) queryParams.append("firstName", effectiveFirstName);
          if (effectiveLastName) queryParams.append("lastName", effectiveLastName);

          const byName = await request(`/Appointments/GetAppointmentById?${queryParams.toString()}`, {
            method: "GET"
          });
          appointments = getArray(byName);
        } catch {
          appointments = [];
        }
      }

      if (!appointments.length && clinicId) {
        try {
          const byClinic = await request(`/Appointments/GetByClinic?clinicId=${clinicId}`, {
            method: "GET"
          });
          const clinicAppointments = getArray(byClinic);
          appointments = clinicAppointments.filter((appointment) => {
            const appointmentPatientId = Number(appointment.patientId ?? appointment.patientID ?? appointment.patient?.patientId);
            if (Number.isFinite(appointmentPatientId) && appointmentPatientId === numericPatientId) {
              return true;
            }

            const appointmentFirstName = String(appointment.firstName || appointment.patientFirstName || appointment.patient?.patientFirstName || "").toLowerCase();
            const appointmentLastName = String(appointment.lastName || appointment.patientLastName || appointment.patient?.patientLastName || "").toLowerCase();
            return (
              effectiveFirstName && appointmentFirstName === effectiveFirstName.toLowerCase() &&
              (!effectiveLastName || appointmentLastName === effectiveLastName.toLowerCase())
            );
          });
        } catch {
          appointments = [];
        }
      }

      if (!appointments.length) {
        setPatientAppointments([]);
        setSelectedAppointmentId("");
        toast.error("No appointments found for selected patient in appointment endpoints.");
        return;
      }

      const sortedAppointments = [...appointments].sort((a, b) => {
        const aDate = new Date(a.appointmentDate || a.createdAt || 0).getTime();
        const bDate = new Date(b.appointmentDate || b.createdAt || 0).getTime();
        return bDate - aDate;
      });

      const normalizedAppointments = sortedAppointments.map((appointment, index) => {
        const appointmentId = appointment.appointmentId || appointment.id || `A-${index + 1}`;
        const attendingPhysician =
          appointment.attendingPhysician ||
          appointment.doctorName ||
          appointment.physicianName ||
          "N/A";
        const appointmentDate = appointment.appointmentDate || appointment.createdAt || null;

        return {
          appointmentId,
          attendingPhysician,
          appointmentDate
        };
      });

      setPatientAppointments(normalizedAppointments);
      setSelectedAppointmentId(String(normalizedAppointments[0].appointmentId));
    } catch (error) {
      console.error("Failed to load appointment details for patient:", error);
      setPatientAppointments([]);
      setSelectedAppointmentId("");
    } finally {
      setLoadingPatientAppointment(false);
    }
  };

  const selectedAppointment = useMemo(() => {
    return patientAppointments.find((appointment) => String(appointment.appointmentId) === String(selectedAppointmentId)) || null;
  }, [patientAppointments, selectedAppointmentId]);

  const loadInventoryMedications = async (clinicId, itemName = "") => {
    if (!clinicId) {
      setInventoryMeds([]);
      return;
    }

    setLoadingMeds(true);
    try {
      const queryParams = new URLSearchParams({ clinicId: String(clinicId) });
      if (itemName?.trim()) {
        queryParams.append("itemName", itemName.trim());
      }
      const data = await request(`/PharmacyInvoice/GetClinicInventoryWithGST?${queryParams.toString()}`, {
        method: "GET"
      });

      const toNumber = (value) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === "number") return Number.isFinite(value) ? value : 0;
        const normalized = String(value).replace(/[^0-9.-]/g, "");
        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
      };

      const normalizedMeds = (data || []).map((item, index) => {
        const rateValue = toNumber(item.rate ?? item.Amount ?? item.amount ?? item.price ?? item.sellingPrice);
        const mrpValue = toNumber(item.mrp ?? item.MRP ?? item.rate ?? item.Amount ?? item.amount ?? item.price ?? item.sellingPrice);
        const cgstValue = toNumber(item.cgst ?? item.CGST);
        const sgstValue = toNumber(item.sgst ?? item.SGST);
        const totalGstValue = toNumber(item.gst ?? item.GST ?? item.gstPercent ?? item.GSTPercent ?? item.gstPercentage ?? item.tax ?? item.Tax);
        const availableQuantityRaw =
          item.quantityAvailable ??
          item.QuantityAvailable ??
          item.quantity ??
          item.Quantity ??
          item.qty ??
          item.Qty ??
          item.availableQty ??
          item.AvailableQty ??
          item.availableQuantity ??
          item.AvailableQuantity ??
          item.currentStock ??
          item.CurrentStock ??
          item.remainingQuantity ??
          item.RemainingQuantity ??
          item.balanceQuantity ??
          item.BalanceQuantity ??
          item.stock ??
          item.Stock ??
          item.itemQuantity ??
          item.ItemQuantity;
        const availableQuantityValue =
          availableQuantityRaw === null || availableQuantityRaw === undefined || availableQuantityRaw === ""
            ? null
            : Math.max(0, Math.floor(toNumber(availableQuantityRaw)));

        const resolvedCGST = cgstValue || (totalGstValue > 0 ? totalGstValue / 2 : 0);
        const resolvedSGST = sgstValue || (totalGstValue > 0 ? totalGstValue - resolvedCGST : 0);

        return {
          itemId: item.itemId || item.ItemId || item.inventoryId || item.InventoryId || index + 1,
          itemName: item.itemName || item.ItemName || "Unknown Item",
          itemCode: item.itemCode || item.ItemCode || "N/A",
          batchNo: item.batchNo || item.BatchNo || item.batch || item.Batch || "",
          expiry: item.expiry || item.Expiry || item.expiryDate || item.ExpiryDate || null,
          mrp: mrpValue,
          rate: rateValue,
          cgst: resolvedCGST,
          sgst: resolvedSGST,
          gst: resolvedCGST + resolvedSGST,
          availableQuantity: availableQuantityValue
        };
      });

      setInventoryMeds(normalizedMeds);
    } catch (error) {
      console.error("Failed to load medicines:", error);
      toast.error("Failed to load medicines from inventory");
      setInventoryMeds([]);
    } finally {
      setLoadingMeds(false);
    }
  };

  const filteredMedicines = inventoryMeds.filter(m => 
    m.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.itemCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = (med) => {
    const existing = selectedItems.find(i => i.itemId === med.itemId);

    const availableQty = med.availableQuantity;
    if (availableQty !== null && availableQty !== undefined && availableQty <= 0) {
      toast.error(`Warning: ${med.itemName} has lesser available quantity (0).`);
      return;
    }

    if (existing) {
      updateItem(med.itemId, "quantity", existing.quantity + 1);
    } else {
      setSelectedItems([...selectedItems, { 
        itemId: med.itemId, 
        name: med.itemName,
        itemCode: med.itemCode,
        batchNo: med.batchNo || "",
        expiry: med.expiry || null,
        mrp: med.mrp ?? med.rate ?? 0,
        quantity: 1, 
        rate: med.rate || 0,
        cgst: med.cgst || 0,
        sgst: med.sgst || 0,
        gst: med.gst || 0,
        availableQuantity: availableQty
      }]);
    }
    setSearchTerm("");
    setShowDropdown(false);
  };

  const updateItem = (id, field, value) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.itemId !== id) return item;

      if (field === "quantity") {
        const parsedQuantity = Math.max(1, parseInt(value, 10) || 1);
        const selectedItemAvailableQtyRaw = item.availableQuantity;
        const selectedItemAvailableQty =
          selectedItemAvailableQtyRaw === null ||
          selectedItemAvailableQtyRaw === undefined ||
          selectedItemAvailableQtyRaw === ""
            ? null
            : Number(selectedItemAvailableQtyRaw);
        const inventoryMatch = inventoryMeds.find(m =>
          String(m.itemId) === String(item.itemId) ||
          String(m.itemCode || "") === String(item.itemCode || "") ||
          String(m.itemName || "").toLowerCase() === String(item.name || "").toLowerCase()
        );
        const inventoryAvailableQtyRaw = inventoryMatch?.availableQuantity;
        const inventoryAvailableQty =
          inventoryAvailableQtyRaw === null ||
          inventoryAvailableQtyRaw === undefined ||
          inventoryAvailableQtyRaw === ""
            ? null
            : Number(inventoryAvailableQtyRaw);
        const availableQty = Number.isFinite(selectedItemAvailableQty)
          ? selectedItemAvailableQty
          : Number.isFinite(inventoryAvailableQty)
            ? inventoryAvailableQty
            : null;

        if (Number.isFinite(availableQty) && parsedQuantity > availableQty) {
          toast.error(`Warning: available quantity for ${item.name} is lesser (${availableQty}).`);
          return { ...item, quantity: parsedQuantity };
        }

        return { ...item, quantity: parsedQuantity };
      }

      if (field === "rate") {
        return { ...item, rate: parseFloat(value) || 0 };
      }

      if (field === "gst") {
        return { ...item, gst: parseFloat(value) || 0 };
      }

      return { ...item, [field]: value };
    }));
  };

  const removeItem = (id) => {
    setSelectedItems(selectedItems.filter(i => i.itemId !== id));
  };

  const getItemCGSTAmount = (item) => {
    return (Number(item.cgst) || 0) * (Number(item.quantity) || 0);
  };

  const getItemSGSTAmount = (item) => {
    return (Number(item.sgst) || 0) * (Number(item.quantity) || 0);
  };

  const totals = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const itemCGSTAmount = getItemCGSTAmount(item);
      const itemSGSTAmount = getItemSGSTAmount(item);
      const itemTaxAmount = itemCGSTAmount + itemSGSTAmount;
      const itemSubtotal = item.rate * item.quantity;
      return {
        subtotal: acc.subtotal + itemSubtotal,
        cgst: acc.cgst + itemCGSTAmount,
        sgst: acc.sgst + itemSGSTAmount,
        gst: acc.gst + itemTaxAmount,
        total: acc.total + itemSubtotal + itemTaxAmount
      };
    }, { subtotal: 0, cgst: 0, sgst: 0, gst: 0, total: 0 });
  }, [selectedItems]);

  const handleSendEmail = async (overrideEmail) => {
    const targetEmail = (overrideEmail || recipientEmail || "").trim();
    if (!targetEmail) {
      toast.error("Please enter a recipient email");
      return;
    }
    
    setSendingEmail(true);
    try {
      const emailHTML = generatePharmacyBillingEmail();
      const resolvedClinicName = getResolvedClinicName();
      
      await sendEmail({
        Email: targetEmail,
        Subject: `Pharmacy Bill ${invoiceNumber} from ${resolvedClinicName}`,
        HtmlBody: emailHTML
      });

      toast.success("Email sent successfully!");
      if (showEmailModal) {
        setShowEmailModal(false);
        setRecipientEmail("");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const generatePdfLikeEmailHTML = async () => {
    const invoiceElement = document.getElementById("pharmacy-invoice-print");
    if (!invoiceElement) {
      return generatePharmacyBillingEmail();
    }

    try {
      setIsPdfMode(true);
      setShowDropdown(false);
      setShowPatientDropdown(false);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const canvas = await html2canvas(invoiceElement, {
        scale: 1.5,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.9);

      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Pharmacy Invoice</title>
</head>
<body style="margin:0;padding:20px;background:#f3f4f6;">
  <div style="max-width:900px;margin:0 auto;background:#ffffff;padding:12px;border-radius:10px;">
    <img src="${imgData}" alt="Pharmacy Invoice" style="width:100%;height:auto;display:block;border-radius:8px;" />
  </div>
</body>
</html>`;
    } catch (error) {
      console.error("Failed to generate PDF-like email HTML:", error);
      return generatePharmacyBillingEmail();
    } finally {
      setIsPdfMode(false);
    }
  };

  const handleEmailClick = async () => {
    const patientEmail = (selectedPatientEmail || selectedPatientMeta?.email || "").trim();

    if (patientEmail) {
      await handleSendEmail(patientEmail);
      return;
    }

    toast.error("Selected patient email not found. Please enter recipient email.");
    setRecipientEmail("");
    setShowEmailModal(true);
  };

  const generatePharmacyBillingEmail = () => {
    const { doctorName, registrationNumber } = getClinicIdAndDoctorInfo();
    const resolvedClinicName = getResolvedClinicName();
    const appointmentIdForEmail = selectedAppointment?.appointmentId || selectedAppointmentId || "N/A";
    const attendingPhysicianForEmail = selectedAppointment?.attendingPhysician
      ? (String(selectedAppointment.attendingPhysician).toLowerCase().startsWith("dr.")
          ? String(selectedAppointment.attendingPhysician)
          : `Dr. ${String(selectedAppointment.attendingPhysician)}`)
      : `Dr. ${doctorName}`;
    const itemsHTML = selectedItems.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: center; background-color: #f9fafb; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 12px; background-color: #f9fafb;">
          <strong>${item.name}</strong><br/>
          <span style="font-size: 12px; color: #6b7280;">SKU: ${item.itemCode}</span>
        </td>
        <td style="padding: 12px; text-align: center; background-color: #f9fafb;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; background-color: #f9fafb;">₹${item.rate.toFixed(2)}</td>
        <td style="padding: 12px; text-align: right; background-color: #f9fafb;">${item.gst}%</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; background-color: #f9fafb; color: #10b981;">₹${(item.rate * item.quantity * (1 + item.gst / 100)).toFixed(2)}</td>
      </tr>
    `).join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 0; }
    .container { max-width: 850px; margin: 30px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 50px 40px; text-align: center; }
    .clinic-name { font-size: 28px; font-weight: 700; margin-bottom: 5px; }
    .clinic-subtitle { font-size: 14px; opacity: 0.9; margin-bottom: 20px; }
    .invoice-no { font-size: 12px; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 4px; display: inline-block; }
    .patient-section { background: linear-gradient(to right, #f0fdf4, #ecfdf5); padding: 30px 40px; border-bottom: 2px solid #d1fae5; }
    .content { padding: 40px; }
    .patient-name { font-size: 18px; font-weight: 700; color: #065f46; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    thead tr { background: #f0fdf4; }
    th { padding: 15px 12px; text-align: left; font-weight: 700; color: #065f46; border-bottom: 2px solid #d1fae5; font-size: 13px; text-transform: uppercase; }
    .totals-section { background: #f0fdf4; padding: 25px 40px; border-top: 2px solid #d1fae5; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; }
    .total-row.final { font-size: 18px; font-weight: 700; color: #10b981; border-top: 2px solid #d1fae5; padding-top: 12px; }
    .footer { background: #f9fafb; padding: 30px 40px; text-align: center; border-top: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    .doctor-sig { background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #10b981; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="clinic-name">💊 ${resolvedClinicName}</div>
      <div class="clinic-subtitle">Pharmacy & Medication Billing Invoice</div>
      <div class="invoice-no">Invoice # ${invoiceNumber}</div>
    </div>

    <div class="patient-section">
      <div class="patient-name">👤 ${patientName || "Patient"}</div>
      <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
        <strong>Invoice #:</strong> ${invoiceNumber}<br/>
        <strong>Date:</strong> ${new Date().toLocaleDateString()}<br/>
        <strong>Clinic:</strong> ${resolvedClinicName}<br/>
        <strong>Attending Physician:</strong> ${attendingPhysicianForEmail}<br/>
        <strong>Appointment ID:</strong> ${appointmentIdForEmail}<br/>
        <strong>Contact:</strong> ${clinicInfo?.clinicPhone || "N/A"} | ${clinicInfo?.clinicEmail || "N/A"}
      </div>
    </div>

    <div class="content">
      <h3 style="color: #10b981; margin-bottom: 20px; font-size: 16px; text-transform: uppercase;">Medication Details</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 40%">Medicine</th>
            <th style="width: 8%">Qty</th>
            <th style="width: 15%">Rate</th>
            <th style="width: 12%">GST</th>
            <th style="width: 20%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    </div>

    <div class="totals-section">
      <div class="total-row">
        <span style="color: #6b7280;">Subtotal:</span>
        <span style="color: #1f2937;">₹${totals.subtotal.toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span style="color: #6b7280;">GST (Inclusive):</span>
        <span style="color: #1f2937;">₹${totals.gst.toFixed(2)}</span>
      </div>
      <div class="total-row final">
        <span>Total Amount:</span>
        <span>₹${totals.total.toFixed(2)}</span>
      </div>
    </div>

    <div class="content">
      <div class="doctor-sig">
        <p style="margin: 0; color: #065f46; font-weight: 700; font-size: 14px;">
          Dr. ${doctorName}
        </p>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">
          ${registrationNumber}
        </p>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0;">This is a computer-generated invoice. Valid without signature.</p>
      <p style="margin: 10px 0 0 0;">For queries, contact ${clinicInfo?.clinicPhone || "N/A"} or ${clinicInfo?.clinicEmail || "N/A"}</p>
      <p style="margin: 10px 0 0 0; color: #9ca3af;">&copy; ${new Date().getFullYear()} ${resolvedClinicName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  const handleDownloadPDF = async () => {
    const invoiceElement = document.getElementById("pharmacy-invoice-print");
    if (!invoiceElement) {
      toast.error("Invoice element not found");
      return;
    }

    try {
      setIsPdfMode(true);
      setShowDropdown(false);
      setShowPatientDropdown(false);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const canvas = await html2canvas(invoiceElement, {
        scale: 1.5,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      pdf.save(`pharmacy-invoice-${patientName || invoiceNumber}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsPdfMode(false);
    }
  };

  const handlePrint = () => {
    const invoiceElement = document.getElementById("pharmacy-invoice-print");
    if (!invoiceElement) {
      toast.error("Invoice element not found");
      return;
    }

    const runPrint = async () => {
      const existingPrintRoot = document.getElementById("prescription-print");
      const printRoot = existingPrintRoot || document.createElement("div");

      const cleanup = () => {
        if (!existingPrintRoot) {
          printRoot.remove();
        } else {
          printRoot.innerHTML = "";
        }
        setIsPdfMode(false);
        window.removeEventListener("afterprint", cleanup);
      };

      try {
        setIsPdfMode(true);
        setShowDropdown(false);
        setShowPatientDropdown(false);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        const canvas = await html2canvas(invoiceElement, {
          scale: 1.5,
          logging: false,
          useCORS: true,
          backgroundColor: "#ffffff"
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.9);

        if (!existingPrintRoot) {
          printRoot.id = "prescription-print";
          document.body.appendChild(printRoot);
        }

        printRoot.innerHTML = "";
        const wrapper = document.createElement("div");
        wrapper.style.width = "210mm";
        wrapper.style.minHeight = "297mm";
        wrapper.style.margin = "0 auto";
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.justifyContent = "center";
        wrapper.style.background = "white";

        const image = document.createElement("img");
        image.style.width = "190mm";
        image.style.maxHeight = "277mm";
        image.style.objectFit = "contain";
        image.style.display = "block";

        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = imgData;
        });

        wrapper.appendChild(image);
        printRoot.appendChild(wrapper);

        window.addEventListener("afterprint", cleanup);
        window.print();
        setTimeout(cleanup, 1200);
      } catch (error) {
        console.error("Failed to print pharmacy invoice:", error);
        toast.error("Failed to print invoice");
        cleanup();
      }
    };

    runPrint();
  };

  const handleConfirmAndCreateInvoice = async () => {
    const patientId = Number(selectedPatientId);
    const appointmentId = Number(selectedAppointment?.appointmentId || selectedAppointmentId);
    const { clinicId } = getClinicIdAndDoctorInfo();

    if (!Number.isFinite(patientId) || patientId <= 0) {
      toast.error("Please select a patient before clicking Done.");
      return;
    }

    if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
      toast.error("Please select an appointment before clicking Done.");
      return;
    }

    if (!selectedItems.length) {
      toast.error("Please add at least one medicine before clicking Done.");
      return;
    }

    const toDateOrNull = (value) => {
      if (!value) return null;
      const dateObj = new Date(value);
      return Number.isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
    };

    const modeOfPayment = Number(amountPaid) >= Number(totals.total) ? "Paid" : Number(amountPaid) > 0 ? "Partial" : "Pending";

    const payload = {
      PatientId: patientId,
      AppointmentId: appointmentId,
      ClinicId: Number(clinicId) || 0,
      DoctorName: resolvedDoctorDisplayName,
      ModeOfPayment: modeOfPayment,
      TotalAmount: Number(totals.total) || 0,
      TotalGST: Number(totals.gst) || 0,
      Items: selectedItems.map((item) => {
        const qty = Number(item.quantity) || 0;
        return {
          ItemId: Number(item.itemId) || 0,
          ItemName: item.name || item.itemName || "",
          Qty: qty,
          BatchNo: item.batchNo || "",
          Expiry: toDateOrNull(item.expiry),
          MRP: Number(item.mrp ?? item.rate) || 0,
          Amount: (Number(item.rate) || 0) * qty,
          CGST: getItemCGSTAmount(item),
          SGST: getItemSGSTAmount(item)
        };
      })
    };

    setSavingInvoice(true);
    try {
      const response = await request("/PharmacyInvoice/CreateInvoice", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const resolvedInvoiceNumber =
        response?.invoiceNumber ||
        response?.invoiceNo ||
        response?.InvoiceNumber ||
        response?.InvoiceNo ||
        response?.invoiceId ||
        response?.InvoiceId ||
        null;

      if (resolvedInvoiceNumber) {
        setInvoiceNumber(String(resolvedInvoiceNumber));
      }

      toast.success(response?.message || "Pharmacy invoice created successfully.");
      setIsEditMode(false);
      setShowConfirmModal(false);
    } catch (error) {
      console.error("Failed to create pharmacy invoice:", error);
      toast.error("Failed to create pharmacy invoice.");
    } finally {
      setSavingInvoice(false);
    }
  };

  if (!show) return null;

  const { doctorName, registrationNumber } = getClinicIdAndDoctorInfo();
  const resolvedClinicName = getResolvedClinicName();
  const appointmentDoctorName = String(selectedAppointment?.attendingPhysician || "").trim();
  const resolvedDoctorDisplayName = appointmentDoctorName
    ? (appointmentDoctorName.toLowerCase().startsWith("dr.") ? appointmentDoctorName : `Dr. ${appointmentDoctorName}`)
    : `Dr. ${doctorName}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 z-10 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pill size={36} />
                <div>
                  <h2 className="text-3xl font-bold">Pharmacy Billing</h2>
                  <p className="text-emerald-100 text-sm">Professional Medication Invoice</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenViewInvoiceModal}
                  className="flex items-center gap-2 px-4 py-2.5 border text-white rounded-lg transition-all font-medium bg-white/20 border-white/40 hover:bg-white/30"
                >
                  <Search size={18} />
                  View Invoice
                </motion.button>
                {isEditMode && (
                  <motion.button 
                    whileHover={!savingInvoice ? { scale: 1.05 } : {}}
                    whileTap={!savingInvoice ? { scale: 0.95 } : {}}
                    onClick={() => setShowConfirmModal(true)}
                    disabled={savingInvoice}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium bg-green-500 border border-green-600 text-white hover:bg-green-600"
                  >
                    <Lock size={18} />
                    {savingInvoice ? 'Saving...' : 'Done'}
                  </motion.button>
                )}
                <motion.button 
                  whileHover={!isEditMode ? { scale: 1.05 } : {}}
                  whileTap={!isEditMode ? { scale: 0.95 } : {}}
                  onClick={handleEmailClick}
                  disabled={isEditMode}
                  className={`flex items-center gap-2 px-4 py-2.5 border text-white rounded-lg transition-all font-medium ${
                    isEditMode 
                      ? 'bg-gray-400 border-gray-500 cursor-not-allowed opacity-50' 
                      : 'bg-white/20 border-white/40 hover:bg-white/30'
                  }`}
                >
                  <Mail size={18} />
                  Email
                </motion.button>
                <motion.button 
                  whileHover={!isEditMode ? { scale: 1.05 } : {}}
                  whileTap={!isEditMode ? { scale: 0.95 } : {}}
                  onClick={handleDownloadPDF}
                  disabled={isEditMode}
                  className={`flex items-center gap-2 px-4 py-2.5 border text-white rounded-lg transition-all font-medium ${
                    isEditMode 
                      ? 'bg-gray-400 border-gray-500 cursor-not-allowed opacity-50' 
                      : 'bg-white/20 border-white/40 hover:bg-white/30'
                  }`}
                >
                  <Download size={18} />
                  PDF
                </motion.button>
                <motion.button 
                  whileHover={!isEditMode ? { scale: 1.05 } : {}}
                  whileTap={!isEditMode ? { scale: 0.95 } : {}}
                  onClick={handlePrint}
                  disabled={isEditMode}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium shadow-lg ${
                    isEditMode 
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50' 
                      : 'bg-white text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <Printer size={18} />
                  Print
                </motion.button>
                <button
                  onClick={onClose}
                  className="text-2xl hover:bg-white/20 p-2 rounded-lg transition"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Edit Mode Warning */}
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-amber-50 border-b-2 border-amber-200 px-6 py-4 flex items-center gap-3"
            >
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
              <p className="text-amber-800 font-semibold">
                ⚠️ Columns are editable. Please make sure to click <span className="font-bold text-amber-900">"Done"</span> to lock all values before you download or print.
              </p>
            </motion.div>
          )}

          {/* Main Content */}
          <div className="p-8">
            <div id="pharmacy-invoice-print" className="bg-gradient-to-b from-emerald-50 to-white rounded-3xl border-2 border-emerald-200 shadow-lg overflow-hidden">
              
              {/* Invoice Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 text-center">
                <div className="inline-block mb-3 p-3 bg-white/20 rounded-full">
                  <Pill size={28} />
                </div>
                <h1 className="text-2xl font-bold mb-1">{resolvedClinicName}</h1>
                <p className="text-emerald-100 text-sm mb-3">PHARMACY BILLING INVOICE</p>
                <div className="flex justify-center gap-4 text-emerald-50">
                  <div className="text-xs">
                    <span className="font-semibold">Invoice #</span><br/>
                    <span className="text-sm font-bold">{invoiceNumber}</span>
                  </div>
                  <div className="border-l border-emerald-300"></div>
                  <div className="text-xs">
                    <span className="font-semibold">Date</span><br/>
                    <span className="text-sm font-bold">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="p-8 space-y-6">
                
                {/* Patient + Physician + Appointment + Medicine Search */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border border-emerald-200 p-3">
                      <label className="text-xs font-semibold text-emerald-700 mb-1 block">Patient</label>
                      <div className="relative">
                        {isPdfMode ? (
                          <p className="text-sm font-semibold text-slate-800">{patientName || "-"}</p>
                        ) : (
                          <input
                            type="text"
                            placeholder="Search patient name"
                            value={patientName}
                            onChange={(e) => {
                              setPatientName(e.target.value);
                              setSelectedPatientId(null);
                              setSelectedPatientMeta(null);
                              setSelectedPatientEmail("");
                              setPatientAppointments([]);
                              setSelectedAppointmentId("");
                              setShowPatientDropdown(true);
                            }}
                            onFocus={() => setShowPatientDropdown(true)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && patientResults.length > 0) {
                                e.preventDefault();
                                handleSelectPatient(patientResults[0]);
                              }
                            }}
                            onBlur={() => setTimeout(() => setShowPatientDropdown(false), 150)}
                            className="w-full text-sm font-semibold text-slate-800 border-none focus:ring-0 p-0"
                          />
                        )}

                        <AnimatePresence>
                          {!isPdfMode && showPatientDropdown && (patientName || "").trim().length >= 2 && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-emerald-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto"
                            >
                              {loadingPatients ? (
                                <div className="p-3 text-sm text-slate-500">Searching patients...</div>
                              ) : patientResults.length > 0 ? (
                                patientResults.map((patient) => (
                                  <button
                                    key={patient.key || patient.id}
                                    type="button"
                                    onClick={() => handleSelectPatient(patient)}
                                    className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 border-b border-emerald-100 last:border-b-0"
                                  >
                                    <p className="text-sm font-semibold text-slate-700">{patient.name}</p>
                                    {patient.patientCode && <p className="text-xs text-slate-500">ID: {patient.patientCode}</p>}
                                  </button>
                                ))
                              ) : (
                                <div className="p-3 text-sm text-slate-500">No patients found</div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-emerald-200 p-3">
                      <label className="text-xs font-semibold text-emerald-700 mb-1 block">Attending Physician</label>
                      <p className="text-sm font-semibold text-slate-800">{resolvedDoctorDisplayName}</p>
                    </div>

                    <div className="bg-white rounded-lg border border-emerald-200 p-3">
                      <label className="text-xs font-semibold text-emerald-700 mb-1 block">Appointment ID</label>
                      {selectedPatientId ? (
                        loadingPatientAppointment ? (
                          <p className="text-xs text-slate-600">Loading appointment details...</p>
                        ) : patientAppointments.length > 0 ? (
                          <>
                            {!isPdfMode && (
                              <select
                                value={selectedAppointmentId}
                                onChange={(e) => setSelectedAppointmentId(e.target.value)}
                                className="w-full rounded border border-emerald-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 print:hidden"
                              >
                                {patientAppointments.map((appointment) => (
                                  <option key={appointment.appointmentId} value={appointment.appointmentId}>
                                    {`ID: ${appointment.appointmentId}${appointment.appointmentDate ? ` • ${new Date(appointment.appointmentDate).toLocaleDateString()}` : ""}`}
                                  </option>
                                ))}
                              </select>
                            )}
                            <p className="text-xs font-semibold text-slate-700 mt-1">
                              Appointment ID: {selectedAppointment?.appointmentId || selectedAppointmentId || "N/A"}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-slate-600">No appointment found for selected patient</p>
                        )
                      ) : (
                        <p className="text-xs text-slate-600">Select patient to load appointments</p>
                      )}
                    </div>
                  </div>

                  <div className={`bg-white rounded-lg border border-emerald-200 p-3 print:hidden ${isPdfMode ? "hidden" : ""}`}>
                    <label className="text-xs font-semibold text-emerald-700 mb-1 block">Search & Add Medicine</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        disabled={loadingMeds}
                        className="w-full pl-3 pr-10 py-2 rounded border border-emerald-300 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all text-sm disabled:opacity-50"
                      />
                      <ChevronDown size={18} className="absolute right-3 top-2 text-emerald-400 pointer-events-none" />

                      <AnimatePresence>
                        {showDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-emerald-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto print:hidden"
                          >
                            {loadingMeds ? (
                              <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>
                            ) : filteredMedicines.length > 0 ? (
                              filteredMedicines.map(med => (
                                <button
                                  key={med.itemId}
                                  onClick={() => addItem(med)}
                                  className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-emerald-100 last:border-b-0 transition-colors"
                                >
                                  <p className="font-semibold text-slate-700 text-sm">{med.itemName}</p>
                                  <p className="text-xs text-slate-500">SKU: {med.itemCode}</p>
                                  <p className="text-xs text-slate-500">Available: {med.availableQuantity ?? "-"}</p>
                                </button>
                              ))
                            ) : (
                              <div className="p-4 text-center text-slate-500 text-sm">No medicines found</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Billing Table */}
                <div className="bg-white rounded-xl border-2 border-emerald-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-emerald-50 border-b-2 border-emerald-200">
                          <th className="px-3 py-3 text-left text-xs font-bold text-emerald-700 uppercase">#</th>
                          <th className="px-3 py-3 text-left text-xs font-bold text-emerald-700 uppercase">Medicine Name</th>
                          <th className="px-3 py-3 text-center text-xs font-bold text-emerald-700 uppercase">Qty</th>
                          <th className="px-3 py-3 text-right text-xs font-bold text-emerald-700 uppercase">Rate (₹)</th>
                          <th className="px-3 py-3 text-center text-xs font-bold text-emerald-700 uppercase">CGST (₹)</th>
                          <th className="px-3 py-3 text-center text-xs font-bold text-emerald-700 uppercase">SGST (₹)</th>
                          <th className="px-3 py-3 text-right text-xs font-bold text-emerald-700 uppercase">Total (₹)</th>
                          <th className="px-3 py-3 text-center text-xs font-bold text-emerald-700 uppercase print:hidden">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100">
                        {selectedItems.length > 0 ? (
                          selectedItems.map((item, idx) => (
                            <tr key={item.itemId} className="hover:bg-emerald-50 transition-colors">
                              <td className="px-3 py-3 text-sm font-bold text-slate-600">{idx + 1}</td>
                              <td className="px-3 py-3">
                                <p className="font-semibold text-slate-700 text-sm">{item.name}</p>
                                {!isPdfMode && <p className="text-xs text-slate-500">{item.itemCode}</p>}
                              </td>
                              <td className="px-3 py-3">
                                {isEditMode ? (
                                  <div>
                                    <input 
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => updateItem(item.itemId, "quantity", Number(e.target.value))}
                                      className="w-16 mx-auto block text-center py-1.5 px-2 rounded border border-emerald-200 focus:ring-2 focus:ring-emerald-300 outline-none text-sm font-bold"
                                    />
                                    {item.availableQuantity !== null &&
                                      item.availableQuantity !== undefined &&
                                      item.availableQuantity !== "" &&
                                      Number.isFinite(Number(item.availableQuantity)) &&
                                      Number(item.quantity) > Number(item.availableQuantity) && (
                                      <p className="mt-1 text-[10px] font-semibold text-red-600 text-center">
                                        Available is lesser ({item.availableQuantity})
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-sm font-bold text-slate-800 text-center">{item.quantity}</p>
                                    {item.availableQuantity !== null &&
                                      item.availableQuantity !== undefined &&
                                      item.availableQuantity !== "" &&
                                      Number.isFinite(Number(item.availableQuantity)) &&
                                      Number(item.quantity) > Number(item.availableQuantity) && (
                                      <p className="mt-1 text-[10px] font-semibold text-red-600 text-center">
                                        Available is lesser ({item.availableQuantity})
                                      </p>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                <p className="text-sm font-bold text-slate-800 text-right">₹{item.rate.toFixed(2)}</p>
                              </td>
                              <td className="px-3 py-3">
                                <p className="text-sm font-bold text-slate-800 text-center">₹{getItemCGSTAmount(item).toFixed(2)}</p>
                              </td>
                              <td className="px-3 py-3">
                                <p className="text-sm font-bold text-slate-800 text-center">₹{getItemSGSTAmount(item).toFixed(2)}</p>
                              </td>
                              <td className="px-3 py-3 text-right font-bold text-emerald-600 text-sm">
                                ₹{(item.rate * item.quantity + getItemCGSTAmount(item) + getItemSGSTAmount(item)).toFixed(2)}
                              </td>
                              <td className="px-3 py-3 text-center print:hidden">
                                {isEditMode && (
                                  <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => removeItem(item.itemId)}
                                    className="p-1 text-slate-300 hover:text-red-500 transition-colors inline-flex items-center justify-center"
                                  >
                                    <Trash2 size={16} />
                                  </motion.button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                              <Pill size={32} className="mx-auto mb-3 opacity-30" />
                              <p className="text-sm">No medicines added. Search and select medicines to begin billing.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Footer */}
                  {selectedItems.length > 0 && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-t-2 border-emerald-200 px-6 py-6">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm">
                          <p className="text-xs font-bold text-emerald-700 uppercase mb-2">Subtotal</p>
                          <p className="text-2xl font-bold text-slate-800">₹{totals.subtotal.toFixed(2)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-amber-200 shadow-sm">
                          <p className="text-xs font-bold text-amber-700 uppercase mb-2">Total CGST</p>
                          <p className="text-2xl font-bold text-amber-600">₹{totals.cgst.toFixed(2)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-amber-200 shadow-sm">
                          <p className="text-xs font-bold text-amber-700 uppercase mb-2">Total SGST</p>
                          <p className="text-2xl font-bold text-amber-600">₹{totals.sgst.toFixed(2)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg p-4 border-2 border-emerald-300 shadow-md">
                          <p className="text-xs font-bold text-emerald-700 uppercase mb-2">Total Amount</p>
                          <p className="text-2xl font-bold text-emerald-700">₹{totals.total.toFixed(2)}</p>
                        </div>

                      </div>

                      {/* Amount Paid Section */}
                      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-5 print:hidden">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-blue-700 uppercase mb-2 block">Amount Paid</label>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-lg font-bold text-blue-600">₹</span>
                              {isEditMode ? (
                                <input 
                                  type="number"
                                  step="0.01"
                                  value={amountPaid}
                                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                                  className="w-full pl-8 py-2.5 rounded-lg border-2 border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none text-lg font-bold"
                                />
                              ) : (
                                <p className="w-full pl-8 py-2.5 text-lg font-bold text-slate-800">{amountPaid.toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-end">
                            <div className="w-full">
                              <label className="text-xs font-bold text-blue-700 uppercase mb-2 block">Balance Due</label>
                              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border-2 border-red-300 text-center">
                                <p className="text-lg font-bold text-red-600">₹{Math.max(0, totals.total - amountPaid).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* View Invoice Modal */}
          <AnimatePresence>
            {showViewInvoiceModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                onClick={handleCloseViewInvoiceModal}
              >
                <motion.div
                  initial={{ scale: 0.96, opacity: 0, y: 16 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.96, opacity: 0, y: 16 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[86vh] flex flex-col overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                    <div>
                      <h3 className="text-xl font-bold">View Pharmacy Invoices</h3>
                      <p className="text-emerald-100 text-sm">Search by patient or appointment ID</p>
                    </div>
                    <button
                      onClick={handleCloseViewInvoiceModal}
                      className="text-2xl hover:bg-white/20 p-2 rounded-lg transition"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-5 border-b border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                          type="radio"
                          name="viewInvoiceSearchType"
                          checked={viewSearchType === "patient"}
                          onChange={() => {
                            setViewSearchType("patient");
                            setViewAppointmentId("");
                            setViewInvoices([]);
                            setSelectedViewInvoice(null);
                          }}
                        />
                        Patient Name
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                          type="radio"
                          name="viewInvoiceSearchType"
                          checked={viewSearchType === "appointment"}
                          onChange={() => {
                            setViewSearchType("appointment");
                            setViewPatientName("");
                            setViewPatientResults([]);
                            setSelectedViewPatient(null);
                            setShowViewPatientDropdown(false);
                            setViewInvoices([]);
                            setSelectedViewInvoice(null);
                          }}
                        />
                        Appointment ID
                      </label>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                      {viewSearchType === "patient" ? (
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={viewPatientName}
                            onChange={(e) => {
                              const value = e.target.value;
                              setViewPatientName(value);
                              setSelectedViewPatient(null);
                              setShowViewPatientDropdown(true);
                            }}
                            onFocus={() => setShowViewPatientDropdown(true)}
                            placeholder="Search patient by name"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-400 outline-none"
                          />
                          <AnimatePresence>
                            {showViewPatientDropdown && (viewPatientResults.length > 0 || loadingViewPatients) && (
                              <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto"
                              >
                                {loadingViewPatients ? (
                                  <div className="p-3 text-sm text-slate-500">Searching patients...</div>
                                ) : (
                                  viewPatientResults.map((patient) => (
                                    <button
                                      key={patient.key}
                                      onClick={() => {
                                        setSelectedViewPatient(patient);
                                        setViewPatientName(patient.name);
                                        setShowViewPatientDropdown(false);
                                      }}
                                      className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 border-b border-slate-100 last:border-b-0"
                                    >
                                      <p className="font-medium text-slate-800">{patient.name}</p>
                                      <p className="text-xs text-slate-500">Patient ID: {patient.id}</p>
                                    </button>
                                  ))
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={viewAppointmentId}
                          onChange={(e) => setViewAppointmentId(e.target.value)}
                          placeholder="Enter appointment ID"
                          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-400 outline-none"
                        />
                      )}

                      <button
                        onClick={handleSearchInvoices}
                        disabled={loadingViewInvoices}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium disabled:opacity-50"
                      >
                        {loadingViewInvoices ? "Searching..." : "Search Invoices"}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
                    <div className="border-r border-slate-200 overflow-y-auto">
                      <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h4 className="font-semibold text-slate-800">Invoice Results</h4>
                        <p className="text-xs text-slate-500">Select an invoice to preview</p>
                      </div>
                      {viewInvoices.length === 0 ? (
                        <div className="p-4 text-sm text-slate-500">No invoice selected yet.</div>
                      ) : (
                        <div className="p-2 space-y-2">
                          {viewInvoices.map((invoice) => (
                            <div
                              key={invoice.id}
                              className={`w-full text-left rounded-lg p-3 border transition-all ${
                                selectedViewInvoice?.id === invoice.id
                                  ? "border-emerald-400 bg-emerald-50"
                                  : "border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <button
                                onClick={() => setSelectedViewInvoice(invoice)}
                                className="w-full text-left"
                              >
                                <p className="font-semibold text-slate-800">{invoice.invoiceNumber}</p>
                                <p className="text-xs text-slate-600">Patient: {invoice.patientName}</p>
                                <p className="text-xs text-slate-500">Appointment: {invoice.appointmentId}</p>
                                <p className="text-xs text-slate-500">Total: ₹{invoice.totalAmount.toFixed(2)}</p>
                              </button>
                              <button
                                onClick={() => handleOpenInvoiceInMainView(invoice)}
                                className="mt-2 text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                              >
                                View Invoice
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-2 overflow-y-auto bg-slate-50 p-5">
                      {!selectedViewInvoice ? (
                        <div className="h-full flex items-center justify-center text-sm text-slate-500">
                          Select an invoice from the list to preview details.
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                            <h4 className="text-lg font-bold">{selectedViewInvoice.clinicName}</h4>
                            <p className="text-sm text-emerald-100">Pharmacy Invoice Preview</p>
                          </div>

                          <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <p><span className="font-semibold text-slate-700">Invoice:</span> {selectedViewInvoice.invoiceNumber}</p>
                              <p><span className="font-semibold text-slate-700">Date:</span> {new Date(selectedViewInvoice.invoiceDate).toLocaleDateString()}</p>
                              <p><span className="font-semibold text-slate-700">Patient:</span> {selectedViewInvoice.patientName}</p>
                              <p><span className="font-semibold text-slate-700">Appointment ID:</span> {selectedViewInvoice.appointmentId}</p>
                              <p><span className="font-semibold text-slate-700">Doctor:</span> {selectedViewInvoice.doctorName}</p>
                              <p><span className="font-semibold text-slate-700">Payment:</span> {selectedViewInvoice.modeOfPayment}</p>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-100 text-slate-700">
                                  <tr>
                                    <th className="px-3 py-2 text-left">Item</th>
                                    <th className="px-3 py-2 text-center">Qty</th>
                                    <th className="px-3 py-2 text-right">MRP</th>
                                    <th className="px-3 py-2 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedViewInvoice.items.length === 0 ? (
                                    <tr>
                                      <td className="px-3 py-3 text-slate-500" colSpan={4}>No items found.</td>
                                    </tr>
                                  ) : (
                                    selectedViewInvoice.items.map((item, index) => (
                                      <tr key={`${item.itemId}-${index}`} className="border-t border-slate-100">
                                        <td className="px-3 py-2">{item.itemName}</td>
                                        <td className="px-3 py-2 text-center">{item.qty}</td>
                                        <td className="px-3 py-2 text-right">₹{item.mrp.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right">₹{item.amount.toFixed(2)}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>

                            <div className="ml-auto w-full max-w-sm space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-600">Subtotal</span>
                                <span className="font-semibold">₹{selectedViewInvoice.subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">CGST</span>
                                <span className="font-semibold">₹{selectedViewInvoice.totalCGST.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">SGST</span>
                                <span className="font-semibold">₹{selectedViewInvoice.totalSGST.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-base border-t border-slate-200 pt-2">
                                <span className="font-bold text-slate-800">Total</span>
                                <span className="font-bold text-emerald-700">₹{selectedViewInvoice.totalAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirm Modal */}
          <AnimatePresence>
            {showConfirmModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                onClick={() => !savingInvoice && setShowConfirmModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
                >
                  <h3 className="text-xl font-bold text-slate-900">Confirm Invoice</h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Are you sure you want to finalize and create this pharmacy invoice?
                  </p>
                  <div className="flex gap-3 pt-5">
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      disabled={savingInvoice}
                      className="flex-1 px-4 py-2.5 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmAndCreateInvoice}
                      disabled={savingInvoice}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium disabled:opacity-50"
                    >
                      {savingInvoice ? "Saving..." : "Confirm"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Modal */}
          <AnimatePresence>
            {showEmailModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                onClick={() => setShowEmailModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4"
                >
                  <h3 className="text-xl font-bold text-slate-900">Send Invoice Email</h3>
                  <input 
                    type="email"
                    placeholder="Recipient email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 outline-none transition-all"
                  />
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowEmailModal(false)}
                      className="flex-1 px-4 py-2.5 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium disabled:opacity-50"
                    >
                      {sendingEmail ? "Sending..." : "Send"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
