import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPatient } from "../services/patientService";
import { getClinicsByEnterpriseId } from "../services/doctorService";
import { getSelectedAccess } from "../services/tokenManager";

// Reusable InputField component with validation
const InputField = ({ label, name, value, onChange, type = "text", required = false, placeholder = "", options = null, disabled = false, error = "", onBlur = null }) => (
    <div className="mb-2">
        {type === "date" ? (
            <>
                <label className={`block text-xs font-medium mb-1 transition ${disabled ? "text-gray-400" : "text-gray-700"
                    }`}>
                    {label} {required && <span className="text-red-500">*</span>}
                    {disabled && <span className="text-xs ml-1 text-gray-400">🔒</span>}
                </label>
                <input
                    type="date"
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    required={required}
                    disabled={disabled}
                    className={`w-full px-3 py-2 text-sm border rounded-lg transition ${error ? "border-red-500 focus:ring-2 focus:ring-red-400" :
                            disabled
                                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                : "border-stone-300 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        }`}
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </>
        ) : options ? (
            <>
                <label className={`block text-xs font-medium mb-1 transition ${disabled ? "text-gray-400" : "text-gray-700"
                    }`}>
                    {label} {required && <span className="text-red-500">*</span>}
                    {disabled && <span className="text-xs ml-1 text-gray-400">🔒</span>}
                </label>
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    required={required}
                    disabled={disabled}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg transition ${error ? "border-red-500 focus:ring-1 focus:ring-red-400" :
                            disabled
                                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                : "border-stone-300 focus:ring-1 focus:ring-amber-400 focus:border-transparent"
                        }`}
                >
                    <option value="">{disabled ? "Select patient first" : `Select ${label}`}</option>
                    {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </>
        ) : type === "textarea" ? (
            <>
                <label className={`block text-xs font-medium mb-1 transition ${disabled ? "text-gray-400" : "text-gray-700"
                    }`}>
                    {label} {required && <span className="text-red-500">*</span>}
                    {disabled && <span className="text-xs ml-1 text-gray-400">🔒</span>}
                </label>
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    rows={3}
                    disabled={disabled}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg transition resize-none ${error ? "border-red-500 focus:ring-1 focus:ring-red-400" :
                            disabled
                                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                : "border-stone-300 focus:ring-1 focus:ring-amber-400 focus:border-transparent"
                        }`}
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </>
        ) : (
            <>
                <label className={`block text-xs font-medium mb-1 transition ${disabled ? "text-gray-400" : "text-gray-700"
                    }`}>
                    {label} {required && <span className="text-red-500">*</span>}
                    {disabled && <span className="text-xs ml-1 text-gray-400">🔒</span>}
                </label>
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    required={required}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg transition ${error ? "border-red-500 focus:ring-1 focus:ring-red-400" :
                            disabled
                                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                : "border-stone-300 focus:ring-1 focus:ring-amber-400 focus:border-transparent"
                        }`}
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </>
        )}
    </div>
);
// Chronic Conditions Multi-Select Dropdown Component
const ChronicConditionsDropdown = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const conditions = ["Diabetes", "Hypertension", "Heart Disease", "Asthma", "Arthritis", "Thyroid Disease", "Kidney Disease", "Liver Disease", "Cancer History"];
    const selected = value.split(',').filter(Boolean);
    const hasOther = selected.some(c => c.startsWith('Other:'));
    const otherValue = selected.find(c => c.startsWith('Other:'))?.replace('Other:', '') || '';

    const toggleCondition = (condition) => {
        const current = selected.filter(c => !c.startsWith('Other:'));
        const updated = current.includes(condition)
            ? current.filter(c => c !== condition)
            : [...current, condition];
        const other = hasOther && otherValue ? `Other:${otherValue}` : '';
        onChange([...updated, other].filter(Boolean).join(','));
    };

    const handleOtherChange = (text) => {
        const current = selected.filter(c => !c.startsWith('Other:'));
        const other = text ? `Other:${text}` : '';
        onChange([...current, other].filter(Boolean).join(','));
    };

    return (
        <div className="relative">
            {/* Dropdown Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition text-left flex items-center justify-between"
            >
                <span className={selected.length === 0 ? 'text-slate-500' : 'text-slate-700'}>
                    {selected.length === 0 ? 'Select conditions...' : `${selected.length} condition${selected.length !== 1 ? 's' : ''} selected`}
                </span>
                <span className={`text-xs transition transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10">
                    <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
                        {/* Predefined Conditions */}
                        {conditions.map((condition) => (
                            <label key={condition} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded transition">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(condition)}
                                    onChange={() => toggleCondition(condition)}
                                    className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                                />
                                <span className="text-sm text-slate-700">{condition}</span>
                            </label>
                        ))}

                        {/* Other Option */}
                        <div className="border-t border-slate-200 pt-3">
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded transition">
                                <input
                                    type="checkbox"
                                    checked={hasOther}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            handleOtherChange('');
                                        } else {
                                            const current = selected.filter(c => !c.startsWith('Other:'));
                                            onChange(current.join(','));
                                        }
                                    }}
                                    className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                                />
                                <span className="text-sm text-slate-700">Other (please specify)</span>
                            </label>

                            {/* Other Text Input */}
                            {hasOther && (
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm mt-2 ml-6"
                                    placeholder="E.g., Diabetes Type 2, Migraine"
                                    value={otherValue}
                                    onChange={(e) => handleOtherChange(e.target.value)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Selected Tags */}
            {selected.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {selected.filter(c => !c.startsWith('Other:')).map((condition) => (
                        <span key={condition} className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-xs text-amber-800">
                            {condition}
                            <button
                                type="button"
                                onClick={() => toggleCondition(condition)}
                                className="ml-1 hover:text-amber-900 font-bold"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    {hasOther && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-xs text-amber-800">
                            Other: {otherValue || '...'}
                            <button
                                type="button"
                                onClick={() => handleOtherChange('')}
                                className="ml-1 hover:text-amber-900 font-bold"
                            >
                                ×
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};


export default function RegisterPatient() {
    const navigate = useNavigate();
    const [registerActiveTab, setRegisterActiveTab] = useState("patient");
    const [registeredPatient, setRegisteredPatient] = useState(null);
    const [showBookingOptions, setShowBookingOptions] = useState(false);

    // Form state
    const [patientData, setPatientData] = useState({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        bloodGroup: "",
        maritalStatus: "",
        enterpriseId: "",
        clinicId: "",
        isActive: true
    });

    const [contactData, setContactData] = useState({
        phoneNumber: "",
        alternatePhoneNumber: "",
        email: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelation: ""
    });

    const [medicalData, setMedicalData] = useState({
        allergies: "",
        chronicConditions: "",
        currentMedications: "",
        pastSurgeries: "",
        familyMedicalHistory: "",
        smokingStatus: "",
        alcoholConsumption: "",
        exerciseFrequency: "",
        dietaryRestrictions: "",
        lastDentalVisit: "",
        notes: ""
    });

    const [insuranceData, setInsuranceData] = useState({
        patientInsuranceProvider: "",
        insuranceProviderId: "",
        policyNumber: "",
        groupNumber: "",
        policyHolderName: "",
        relationshipToPolicyHolder: "",
        coverageStartDate: "",
        coverageEndDate: "",
        isPrimary: true,
        copayAmount: "",
        deductibleAmount: "",
        coveragePercentage: "",
        insurancePhone: "",
        providerEmail: "",
        providerAddress: ""
    });

    const [allEnterprises, setAllEnterprises] = useState([]);
    const [clinicList, setClinicList] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Validation errors state
    const [errors, setErrors] = useState({
        dateOfBirth: "",
        email: "",
        phoneNumber: "",
        alternatePhoneNumber: "",
        postalCode: "",
        emergencyContactPhone: "",
        city: "",
        state: "",
        country: ""
    });

    // Validation functions
    const validateDateOfBirth = (dob) => {
        if (!dob) return "";
        const dobDate = new Date(dob);
        const today = new Date();
        if (dobDate > today) {
            return "❌ Date of birth cannot be in the future";
        }
        return "";
    };

    const validateEmail = (email) => {
        if (!email) return "";
        // Email regex pattern
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return "❌ Please enter a valid email address (e.g., user@example.com)";
        }
        return "";
    };

    const validatePhoneNumber = (phone, isAlternate = false) => {
        if (!phone) return "";
        // Remove all non-digit characters
        const digitsOnly = phone.replace(/\D/g, "");
        if (digitsOnly.length > 10) {
            return `❌ Mobile number cannot be more than 10 digits (you entered ${digitsOnly.length})`;
        }
        if (digitsOnly.length > 0 && digitsOnly.length < 10) {
            return `❌ Mobile number should have 10 digits (you entered ${digitsOnly.length})`;
        }
        return "";
    };

    const validatePostalCode = (postalCode) => {
        if (!postalCode) return "";
        const digitsOnly = postalCode.replace(/\D/g, "");
        if (digitsOnly.length !== 6) {
            return `❌ Postal code must be exactly 6 digits (you entered ${digitsOnly.length})`;
        }
        return "";
    };

    const validateAlphaOnly = (value, fieldName) => {
        if (!value) return "";
        if (!/^[a-zA-Z\s]+$/.test(value)) {
            return `❌ ${fieldName} must contain letters only`;
        }
        return "";
    };

    // Handle field blur validation
    const handleFieldBlur = (field, value, validationFunc) => {
        const error = validationFunc(value);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    // Tab validation with debugging
    const isPatientTabValid = () => {
        const valid = patientData.firstName && patientData.lastName && patientData.dateOfBirth &&
            patientData.gender && patientData.clinicId;

        if (!valid) {
            const missing = [];
            if (!patientData.firstName) missing.push("firstName");
            if (!patientData.lastName) missing.push("lastName");
            if (!patientData.dateOfBirth) missing.push("dateOfBirth");
            if (!patientData.gender) missing.push("gender");
            if (!patientData.clinicId) missing.push("clinicId");
            console.log("❌ Patient Tab Invalid - Missing:", missing);
        }
        return valid;
    };

    const isContactTabValid = () => {
        const valid = contactData.phoneNumber && contactData.addressLine1 &&
            contactData.city && contactData.state && contactData.postalCode && contactData.country;

        if (!valid) {
            const missing = [];
            if (!contactData.phoneNumber) missing.push("phoneNumber");
            if (!contactData.addressLine1) missing.push("addressLine1");
            if (!contactData.city) missing.push("city");
            if (!contactData.state) missing.push("state");
            if (!contactData.postalCode) missing.push("postalCode");
            if (!contactData.country) missing.push("country");
            console.log("❌ Contact Tab Invalid - Missing:", missing);
        }
        return valid;
    };

    const isAllTabsValid = () => {
        const patientValid = isPatientTabValid();
        const contactValid = isContactTabValid();
        const allValid = patientValid && contactValid;

        if (allValid) {
            console.log("✅ All tabs VALID - Button should be ENABLED");
        } else {
            console.log("❌ All tabs NOT valid - Patient:", patientValid, "Contact:", contactValid);
        }

        return allValid;
    };

    // Track validation state changes
    useEffect(() => {
        console.log("📋 Current Form State:");
        console.log("   Patient Data:", patientData);
        console.log("   Contact Data:", contactData);
        console.log("   Patient Tab Valid:", isPatientTabValid());
        console.log("   Contact Tab Valid:", isContactTabValid());
        console.log("   All Valid:", isAllTabsValid());
    }, [patientData, contactData]);

    // Load enterprise and clinic from token on mount
    useEffect(() => {
        const selectedAccess = getSelectedAccess();
        if (selectedAccess && selectedAccess.enterpriseId && selectedAccess.clinicId) {
            console.log('🔐 Pre-populated from token - Enterprise:', selectedAccess.enterpriseId, 'Clinic:', selectedAccess.clinicId);
            setPatientData(prev => ({
                ...prev,
                enterpriseId: selectedAccess.enterpriseId.toString(),
                clinicId: selectedAccess.clinicId.toString()
            }));

            // Load clinic details for display
            loadClinicsForEnterprise(selectedAccess.enterpriseId);
        } else {
            console.error('❌ No enterprise/clinic found in login token');
            alert('⚠️ Unable to retrieve enterprise/clinic information from login token. Please re-login.');
        }
    }, []);

    // Load enterprises on mount (for reference, though not used for selection)
    useEffect(() => {
        const enterprisesData = JSON.parse(localStorage.getItem('allEnterprises') || '[]');
        setAllEnterprises(enterprisesData);
    }, []);

    // Load clinics when enterprise is selected
    useEffect(() => {
        if (patientData.enterpriseId) {
            loadClinicsForEnterprise(patientData.enterpriseId);
        } else {
            setClinicList([]);
        }
    }, [patientData.enterpriseId]);

    const loadClinicsForEnterprise = async (enterpriseId) => {
        try {
            const clinics = await getClinicsByEnterpriseId(parseInt(enterpriseId));
            setClinicList(clinics || []);
        } catch (error) {
            console.error("Error loading clinics:", error);
            setClinicList([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check for validation errors
        const dobError = validateDateOfBirth(patientData.dateOfBirth);
        const emailError = validateEmail(contactData.email);
        const phoneError = validatePhoneNumber(contactData.phoneNumber, false);
        const alternatePhoneError = validatePhoneNumber(contactData.alternatePhoneNumber, true);
        const postalCodeError = validatePostalCode(contactData.postalCode);
        const emergencyPhoneError = validatePhoneNumber(contactData.emergencyContactPhone, false);

        // Update errors state
        const newErrors = {
            dateOfBirth: dobError,
            email: emailError,
            phoneNumber: phoneError,
            alternatePhoneNumber: alternatePhoneError,
            postalCode: postalCodeError,
            emergencyContactPhone: emergencyPhoneError
        };
        setErrors(newErrors);

        // Check if there are any validation errors
        const hasValidationErrors = Object.values(newErrors).some(error => error !== "");

        if (hasValidationErrors) {
            alert("⚠️ Please fix the validation errors before submitting!");
            return;
        }

        if (!isAllTabsValid()) {
            alert("⚠️ Please fill all required fields in Patient Info and Contact tabs!");
            return;
        }

        setSubmitting(true);

        const patientDataModel = {
            patient: {
                patientId: 0,
                patientEntityID: "",
                patientFirstName: patientData.firstName,
                patientLastName: patientData.lastName,
                patientDOB: patientData.dateOfBirth,
                patientGender: patientData.gender,
                patientBloodType: patientData.bloodGroup || "",
                enterpriseID: patientData.enterpriseId || "",
                clinicID: patientData.clinicId || ""
            },
            patientContact: {
                patientId: 0,
                patientAddress: `${contactData.addressLine1}${contactData.addressLine2 ? ', ' + contactData.addressLine2 : ''}`,
                patientCity: contactData.city,
                patientPhone: contactData.phoneNumber,
                patientEmail: contactData.email || "",
                patientEmergencyContact: contactData.emergencyContactName
                    ? `${contactData.emergencyContactName} - ${contactData.emergencyContactPhone} (${contactData.emergencyContactRelation})`
                    : ""
            },
            patientMedicalInfo: {
                patientId: 0,
                patientMedicalHistory: medicalData.familyMedicalHistory || "",
                patientAllergies: medicalData.allergies || "",
                patientCurrentMedications: medicalData.currentMedications || "",
                patientPrimaryPhysician: "",
                no_of_visits: 0,
                lastVisitedDate: medicalData.lastDentalVisit || new Date().toISOString(),
                chronicDiseases: medicalData.chronicConditions || "",
                medicalHistory: `Past Surgeries: ${medicalData.pastSurgeries || 'None'}; Smoking: ${medicalData.smokingStatus || 'Unknown'}; Alcohol: ${medicalData.alcoholConsumption || 'Unknown'}; Exercise: ${medicalData.exerciseFrequency || 'Unknown'}; Diet: ${medicalData.dietaryRestrictions || 'None'}; Notes: ${medicalData.notes || 'None'}`
            },
            patientInsurance: {
                patientId: 0,
                patientInsuranceProvider: insuranceData.patientInsuranceProvider || "",
                insuranceProviderId: insuranceData.insuranceProviderId ? parseInt(insuranceData.insuranceProviderId) : null,
                policyNumber: insuranceData.policyNumber || "",
                groupNumber: insuranceData.groupNumber || "",
                policyHolderName: insuranceData.policyHolderName || "",
                relationshipToPolicyHolder: insuranceData.relationshipToPolicyHolder || "",
                coverageStartDate: insuranceData.coverageStartDate ? new Date(insuranceData.coverageStartDate).toISOString() : null,
                coverageEndDate: insuranceData.coverageEndDate ? new Date(insuranceData.coverageEndDate).toISOString() : null,
                isPrimary: insuranceData.isPrimary || false,
                copayAmount: insuranceData.copayAmount ? parseFloat(insuranceData.copayAmount) : null,
                deductibleAmount: insuranceData.deductibleAmount ? parseFloat(insuranceData.deductibleAmount) : null,
                coveragePercentage: insuranceData.coveragePercentage ? parseFloat(insuranceData.coveragePercentage) : null,
                insurancePhone: insuranceData.insurancePhone || "",
                providerEmail: insuranceData.providerEmail || "",
                providerAddress: insuranceData.providerAddress || "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        };

        try {
            console.log("📝 Submitting patient data:");
            console.log("   Enterprise ID (from login token):", patientData.enterpriseId);
            console.log("   Clinic ID (from login token):", patientData.clinicId);
            console.log("   Full payload:", patientDataModel);

            const response = await createPatient(patientDataModel);
            console.log("✅ Patient created successfully:", response);

            // Store the registered patient data for booking
            setRegisteredPatient({
                patientId: response.patient.patientId,
                patientName: `${patientData.firstName} ${patientData.lastName}`,
                patientFirstName: patientData.firstName,
                patientLastName: patientData.lastName,
                patientPhone: contactData.phoneNumber,
                patientEmail: contactData.email,
                patientDOB: patientData.dateOfBirth,
                patientGender: patientData.gender,
                clinicId: patientData.clinicId
            });

            // Show booking options modal
            setShowBookingOptions(true);
        } catch (error) {
            console.error("Error creating patient:", error);
            alert("❌ Error registering patient: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-2">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto px-4 mb-2"
            >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700 p-3 sm:p-4 shadow-2xl">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <motion.span
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                    className="text-3xl"
                                >
                                    📝
                                </motion.span>
                                <div>
                                    <h1 className="text-xl font-bold text-white mb-0.5">Register New Patient</h1>
                                    <p className="text-cyan-100 text-xs">Fill in the patient information to create a new record</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate("/")}
                                className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold backdrop-blur-lg border border-white/30 transition-all"
                            >
                                ← Back to Home
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Registration Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="max-w-4xl mx-auto px-4"
            >
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-teal-200 overflow-hidden flex flex-col h-[calc(100vh-120px)]">
                    {/* Tabs */}
                    <div className="sticky top-0 z-20 bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-3 border-b-2 border-teal-200 flex gap-2 overflow-x-auto shrink-0">
                        {[
                            { key: "patient", label: "Patient Info", icon: "👤" },
                            { key: "contact", label: "Contact", icon: "📞" },
                            { key: "medical", label: "Medical Info", icon: "🏥" },
                            { key: "insurance", label: "Insurance", icon: "💳" }
                        ].map((tab) => (
                            <motion.button
                                key={tab.key}
                                type="button"
                                onClick={() => setRegisterActiveTab(tab.key)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-4 py-2 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md ${registerActiveTab === tab.key
                                        ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg scale-105"
                                        : "bg-white text-slate-600 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-600 border-2 border-slate-200"
                                    }`}
                            >
                                <span className="text-base">{tab.icon}</span>
                                <span>{tab.label}</span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Form Content */}
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                        <form onSubmit={handleSubmit} id="register-patient-form">
                            <AnimatePresence mode="wait">
                                {/* Patient Tab */}
                                {registerActiveTab === "patient" && (
                                    <motion.div
                                        key="patient-tab"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                    >
                                        <h3 className="text-lg font-bold text-teal-900 mb-4 flex items-center gap-2">
                                            <span className="text-xl">👤</span>
                                            Patient Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <InputField
                                                label="First Name"
                                                name="firstName"
                                                value={patientData.firstName}
                                                onChange={(e) => setPatientData({ ...patientData, firstName: e.target.value })}
                                                required
                                                placeholder="Enter first name"
                                            />
                                            <InputField
                                                label="Last Name"
                                                name="lastName"
                                                value={patientData.lastName}
                                                onChange={(e) => setPatientData({ ...patientData, lastName: e.target.value })}
                                                required
                                                placeholder="Enter last name"
                                            />
                                            <InputField
                                                label="Date of Birth"
                                                name="dateOfBirth"
                                                type="date"
                                                value={patientData.dateOfBirth}
                                                onChange={(e) => setPatientData({ ...patientData, dateOfBirth: e.target.value })}
                                                onBlur={(e) => handleFieldBlur("dateOfBirth", e.target.value, validateDateOfBirth)}
                                                required
                                                error={errors.dateOfBirth}
                                            />
                                            <InputField
                                                label="Gender"
                                                name="gender"
                                                value={patientData.gender}
                                                onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                                                required
                                                options={["Male", "Female", "Other"]}
                                            />
                                            <InputField
                                                label="Blood Group"
                                                name="bloodGroup"
                                                value={patientData.bloodGroup}
                                                onChange={(e) => setPatientData({ ...patientData, bloodGroup: e.target.value })}
                                                options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
                                            />
                                            <InputField
                                                label="Marital Status"
                                                name="maritalStatus"
                                                value={patientData.maritalStatus}
                                                onChange={(e) => setPatientData({ ...patientData, maritalStatus: e.target.value })}
                                                options={["Single", "Married", "Divorced", "Widowed"]}
                                            />
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic <span className="text-xs text-gray-500">🔒 From Login</span></label>
                                                <div className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm bg-blue-50 text-gray-700 flex items-center gap-2">
                                                    <span className="text-lg">🏥</span>
                                                    <span className="font-medium">
                                                        {clinicList.find(c => c.clinicId === parseInt(patientData.clinicId))?.clinicName || patientData.clinicId}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Contact Tab */}
                                {registerActiveTab === "contact" && (
                                    <motion.div
                                        key="contact-tab"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                    >
                                        <h3 className="text-lg font-bold text-teal-900 mb-4 flex items-center gap-2">
                                            <span className="text-xl">📞</span>
                                            Contact Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <InputField
                                                label="Phone Number"
                                                name="phoneNumber"
                                                type="tel"
                                                value={contactData.phoneNumber}
                                                onChange={(e) => setContactData({ ...contactData, phoneNumber: e.target.value })}
                                                onBlur={(e) => handleFieldBlur("phoneNumber", e.target.value, (val) => validatePhoneNumber(val, false))}
                                                required
                                                placeholder="10-digit mobile number"
                                                error={errors.phoneNumber}
                                            />
                                            <InputField
                                                label="Alternate Phone"
                                                name="alternatePhoneNumber"
                                                type="tel"
                                                value={contactData.alternatePhoneNumber}
                                                onChange={(e) => setContactData({ ...contactData, alternatePhoneNumber: e.target.value })}
                                                onBlur={(e) => handleFieldBlur("alternatePhoneNumber", e.target.value, (val) => validatePhoneNumber(val, true))}
                                                placeholder="10-digit mobile number"
                                                error={errors.alternatePhoneNumber}
                                            />
                                            <InputField
                                                label="Email"
                                                name="email"
                                                type="email"
                                                value={contactData.email}
                                                onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                                                onBlur={(e) => handleFieldBlur("email", e.target.value, validateEmail)}
                                                placeholder="patient@example.com"
                                                error={errors.email}
                                            />
                                            <InputField
                                                label="Address Line 1"
                                                name="addressLine1"
                                                value={contactData.addressLine1}
                                                onChange={(e) => setContactData({ ...contactData, addressLine1: e.target.value })}
                                                required
                                                placeholder="Street address"
                                            />
                                            <InputField
                                                label="Address Line 2"
                                                name="addressLine2"
                                                value={contactData.addressLine2}
                                                onChange={(e) => setContactData({ ...contactData, addressLine2: e.target.value })}
                                                placeholder="Apt, suite, etc."
                                            />
                                            <InputField
                                                label="City"
                                                name="city"
                                                value={contactData.city}
                                                onChange={(e) => {
                                                    setContactData({ ...contactData, city: e.target.value });
                                                    setErrors(prev => ({ ...prev, city: validateAlphaOnly(e.target.value, "City") }));
                                                }}
                                                onBlur={(e) => handleFieldBlur("city", e.target.value, (v) => validateAlphaOnly(v, "City"))}
                                                required
                                                placeholder="City"
                                                error={errors.city}
                                            />
                                            <InputField
                                                label="State"
                                                name="state"
                                                value={contactData.state}
                                                onChange={(e) => {
                                                    setContactData({ ...contactData, state: e.target.value });
                                                    setErrors(prev => ({ ...prev, state: validateAlphaOnly(e.target.value, "State") }));
                                                }}
                                                onBlur={(e) => handleFieldBlur("state", e.target.value, (v) => validateAlphaOnly(v, "State"))}
                                                required
                                                placeholder="State"
                                                error={errors.state}
                                            />
                                            <InputField
                                                label="Postal Code"
                                                name="postalCode"
                                                value={contactData.postalCode}
                                                onChange={(e) => setContactData({ ...contactData, postalCode: e.target.value })}
                                                onBlur={(e) => handleFieldBlur("postalCode", e.target.value, validatePostalCode)}
                                                required
                                                placeholder="6-digit postal code"
                                                error={errors.postalCode}
                                            />
                                            <InputField
                                                label="Country"
                                                name="country"
                                                value={contactData.country}
                                                onChange={(e) => {
                                                    setContactData({ ...contactData, country: e.target.value });
                                                    setErrors(prev => ({ ...prev, country: validateAlphaOnly(e.target.value, "Country") }));
                                                }}
                                                onBlur={(e) => handleFieldBlur("country", e.target.value, (v) => validateAlphaOnly(v, "Country"))}
                                                required
                                                placeholder="Country"
                                                error={errors.country}
                                            />
                                            <InputField
                                                label="Emergency Contact Name"
                                                name="emergencyContactName"
                                                value={contactData.emergencyContactName}
                                                onChange={(e) => setContactData({ ...contactData, emergencyContactName: e.target.value })}
                                                placeholder="Full name"
                                            />
                                            <InputField
                                                label="Emergency Contact Phone"
                                                name="emergencyContactPhone"
                                                type="tel"
                                                value={contactData.emergencyContactPhone}
                                                onChange={(e) => setContactData({ ...contactData, emergencyContactPhone: e.target.value })}
                                                onBlur={(e) => handleFieldBlur("emergencyContactPhone", e.target.value, (val) => validatePhoneNumber(val, false))}
                                                placeholder="10-digit mobile number"
                                                error={errors.emergencyContactPhone}
                                            />
                                            <InputField
                                                label="Emergency Contact Relation"
                                                name="emergencyContactRelation"
                                                value={contactData.emergencyContactRelation}
                                                onChange={(e) => setContactData({ ...contactData, emergencyContactRelation: e.target.value })}
                                                placeholder="Spouse, Parent, etc."
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {/* Medical Tab */}
                                {registerActiveTab === "medical" && (
                                    <motion.div
                                        key="medical-tab"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                    >
                                        <h3 className="text-lg font-bold text-teal-900 mb-4 flex items-center gap-2">
                                            <span className="text-xl">🏥</span>
                                            Medical Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <InputField
                                                label="Allergies"
                                                name="allergies"
                                                type="textarea"
                                                value={medicalData.allergies}
                                                onChange={(e) => setMedicalData({ ...medicalData, allergies: e.target.value })}
                                                placeholder="List any allergies"
                                            />
                                            {/* Chronic Conditions Multi-Select Dropdown */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Chronic Conditions</label>
                                                <ChronicConditionsDropdown
                                                    value={medicalData.chronicConditions}
                                                    onChange={(value) => setMedicalData({ ...medicalData, chronicConditions: value })}
                                                />
                                            </div>
                                            <InputField
                                                label="Current Medications"
                                                name="currentMedications"
                                                type="textarea"
                                                value={medicalData.currentMedications}
                                                onChange={(e) => setMedicalData({ ...medicalData, currentMedications: e.target.value })}
                                                placeholder="List current medications"
                                            />
                                            <InputField
                                                label="Past Surgeries"
                                                name="pastSurgeries"
                                                type="textarea"
                                                value={medicalData.pastSurgeries}
                                                onChange={(e) => setMedicalData({ ...medicalData, pastSurgeries: e.target.value })}
                                                placeholder="List any previous surgeries"
                                            />
                                            <InputField
                                                label="Family Medical History"
                                                name="familyMedicalHistory"
                                                type="textarea"
                                                value={medicalData.familyMedicalHistory}
                                                onChange={(e) => setMedicalData({ ...medicalData, familyMedicalHistory: e.target.value })}
                                                placeholder="Relevant family medical history"
                                            />
                                            <InputField
                                                label="Smoking Status"
                                                name="smokingStatus"
                                                value={medicalData.smokingStatus}
                                                onChange={(e) => setMedicalData({ ...medicalData, smokingStatus: e.target.value })}
                                                options={["Non-smoker", "Former smoker", "Current smoker"]}
                                            />
                                            <InputField
                                                label="Alcohol Consumption"
                                                name="alcoholConsumption"
                                                value={medicalData.alcoholConsumption}
                                                onChange={(e) => setMedicalData({ ...medicalData, alcoholConsumption: e.target.value })}
                                                options={["Never", "Occasionally", "Regularly"]}
                                            />
                                            <InputField
                                                label="Exercise Frequency"
                                                name="exerciseFrequency"
                                                value={medicalData.exerciseFrequency}
                                                onChange={(e) => setMedicalData({ ...medicalData, exerciseFrequency: e.target.value })}
                                                options={["Sedentary", "1-2 times/week", "3-4 times/week", "5+ times/week"]}
                                            />
                                            <InputField
                                                label="Dietary Restrictions"
                                                name="dietaryRestrictions"
                                                type="textarea"
                                                value={medicalData.dietaryRestrictions}
                                                onChange={(e) => setMedicalData({ ...medicalData, dietaryRestrictions: e.target.value })}
                                                placeholder="Vegetarian, Vegan, etc."
                                            />
                                            <InputField
                                                label="Last Dental Visit"
                                                name="lastDentalVisit"
                                                type="date"
                                                value={medicalData.lastDentalVisit}
                                                onChange={(e) => setMedicalData({ ...medicalData, lastDentalVisit: e.target.value })}
                                            />
                                            <InputField
                                                label="Additional Notes"
                                                name="notes"
                                                type="textarea"
                                                value={medicalData.notes}
                                                onChange={(e) => setMedicalData({ ...medicalData, notes: e.target.value })}
                                                placeholder="Any other relevant medical information"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {/* Insurance Tab */}
                                {registerActiveTab === "insurance" && (
                                    <motion.div
                                        key="insurance-tab"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                    >
                                        <h3 className="text-lg font-bold text-teal-900 mb-4 flex items-center gap-2">
                                            <span className="text-xl">💳</span>
                                            Insurance Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <InputField
                                                label="Insurance Provider"
                                                name="patientInsuranceProvider"
                                                value={insuranceData.patientInsuranceProvider}
                                                onChange={(e) => setInsuranceData({ ...insuranceData, patientInsuranceProvider: e.target.value })}
                                                placeholder="Provider name"
                                            />
                                            <InputField
                                                label="Provider ID"
                                                name="insuranceProviderId"
                                                type="number"
                                                value={insuranceData.insuranceProviderId}
                                                onChange={(e) => setInsuranceData({ ...insuranceData, insuranceProviderId: e.target.value })}
                                                placeholder="Provider ID"
                                            />
                                            <InputField
                                                label="Policy Number"
                                                name="policyNumber"
                                                value={insuranceData.policyNumber}
                                                onChange={(e) => setInsuranceData({ ...insuranceData, policyNumber: e.target.value })}
                                                placeholder="Policy #"
                                            />
                                            <InputField
                                                label="Group Number"
                                                name="groupNumber"
                                                value={insuranceData.groupNumber}
                                                onChange={(e) => setInsuranceData({ ...insuranceData, groupNumber: e.target.value })}
                                                placeholder="Group #"
                                            />
                                            <InputField
                                                label="Policy Holder Name"
                                                name="policyHolderName"
                                                value={insuranceData.policyHolderName}
                                                onChange={(e) => setInsuranceData({ ...insuranceData, policyHolderName: e.target.value })}
                                                placeholder="Full name"
                                            />
                                            <InputField
                                                label="Relationship to Policy Holder"
                                                name="relationshipToPolicyHolder"
                                                value={insuranceData.relationshipToPolicyHolder}
                                                onChange={(e) => setInsuranceData({ ...insuranceData, relationshipToPolicyHolder: e.target.value })}
                                                placeholder="e.g., Self, Spouse, Child"
                                            />
                                            <InputField
                                                label="Insurance Phone"
                                                name="insurancePhone"
                                                value={insuranceData.insurancePhone}
                                                onChange={(e) => setInsuranceData({ ...insuranceData, insurancePhone: e.target.value })}
                                                placeholder="Provider phone"
                                            />
                                            <InputField
                                                label="Provider Email"
                                                name="providerEmail"
                                                type="email"
                                                value={insuranceData.providerEmail}
                                                onChange={(e) => setInsuranceData({ ...insuranceData, providerEmail: e.target.value })}
                                                placeholder="provider@insurance.com"
                                            />
                                            <InputField
                                                label="Provider Address"
                                                name="providerAddress"
                                                value={insuranceData.providerAddress}
                                                onChange={(e) => setInsuranceData({ ...insuranceData, providerAddress: e.target.value })}
                                                placeholder="Address"
                                            />
                                            <InputField
                                                label="Coverage Start Date"
                                                name="coverageStartDate"
                                                type="date"
                                                value={insuranceData.coverageStartDate}
                                                onChange={(e) => setInsuranceData({ ...insuranceData, coverageStartDate: e.target.value })}
                                            />
                                            <InputField
                                                label="Coverage End Date"
                                                name="coverageEndDate"
                                                type="date"
                                                value={insuranceData.coverageEndDate}
                                                onChange={(e) => setInsuranceData({ ...insuranceData, coverageEndDate: e.target.value })}
                                            />
                                            <InputField
                                                label="Copay Amount"
                                                name="copayAmount"
                                                type="number"
                                                value={insuranceData.copayAmount}
                                                onChange={(e) => setInsuranceData({ ...insuranceData, copayAmount: e.target.value })}
                                                placeholder="20"
                                            />
                                            <InputField
                                                label="Deductible Amount"
                                                name="deductibleAmount"
                                                type="number"
                                                value={insuranceData.deductibleAmount}
                                                onChange={(e) => setInsuranceData({ ...insuranceData, deductibleAmount: e.target.value })}
                                                placeholder="500"
                                            />
                                            <InputField
                                                label="Coverage Percentage"
                                                name="coveragePercentage"
                                                type="number"
                                                value={insuranceData.coveragePercentage}
                                                onChange={(e) => setInsuranceData({ ...insuranceData, coveragePercentage: e.target.value })}
                                                placeholder="80"
                                            />
                                            <div className="flex items-center">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={insuranceData.isPrimary}
                                                        onChange={(e) => setInsuranceData({ ...insuranceData, isPrimary: e.target.checked })}
                                                        className="w-5 h-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-400"
                                                    />
                                                    <span className="text-sm font-medium text-stone-700">Primary Insurance</span>
                                                </label>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </div>

                    {/* Footer with Navigation */}
                    <div className="bg-gradient-to-r from-slate-100 to-blue-50 p-4 border-t-2 border-teal-300 flex justify-between items-center gap-3 shrink-0">
                        <div className="flex gap-3">
                            {registerActiveTab !== "patient" && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={() => {
                                        const tabs = ["patient", "contact", "medical", "insurance"];
                                        const currentIndex = tabs.indexOf(registerActiveTab);
                                        if (currentIndex > 0) setRegisterActiveTab(tabs[currentIndex - 1]);
                                    }}
                                    className="px-6 py-3 bg-white text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition border-2 border-slate-300 shadow-md"
                                >
                                    ← Previous
                                </motion.button>
                            )}
                            {registerActiveTab !== "insurance" && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={() => {
                                        const tabs = ["patient", "contact", "medical", "insurance"];
                                        const currentIndex = tabs.indexOf(registerActiveTab);
                                        if (currentIndex < tabs.length - 1) setRegisterActiveTab(tabs[currentIndex + 1]);
                                    }}
                                    className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition shadow-md"
                                >
                                    Next →
                                </motion.button>
                            )}
                        </div>

                        <div className="flex gap-3 flex-col items-end">
                            {!isAllTabsValid() && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200"
                                >
                                    {!isPatientTabValid() && <div>⚠️ Complete Patient Info tab (First Name, Last Name, DOB, Gender)</div>}
                                    {!isContactTabValid() && <div>⚠️ Complete Contact tab (Phone, Address, City, State, Postal Code, Country)</div>}
                                </motion.div>
                            )}
                            <motion.button
                                whileHover={{ scale: isAllTabsValid() ? 1.05 : 1 }}
                                whileTap={{ scale: isAllTabsValid() ? 0.95 : 1 }}
                                type="submit"
                                form="register-patient-form"
                                disabled={!isAllTabsValid() || submitting}
                                className={`px-8 py-3 rounded-lg font-bold shadow-lg transition ${isAllTabsValid() && !submitting
                                        ? "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white cursor-pointer"
                                        : "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60"
                                    }`}
                            >
                                {submitting ? "Saving..." : "💾 Register Patient"}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Booking Options Modal */}
            <AnimatePresence>
                {showBookingOptions && registeredPatient && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => {
                            setShowBookingOptions(false);
                            navigate("/");
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border-2 border-teal-200"
                        >
                            <div className="text-center mb-6">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
                                    className="text-6xl mb-4"
                                >
                                    ✅
                                </motion.div>
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                                    Patient Registered!
                                </h2>
                                <p className="text-gray-600 text-base mb-1">
                                    <strong>{registeredPatient.patientName}</strong> has been successfully registered.
                                </p>
                                <p className="text-gray-500 text-sm">
                                    Patient ID: {registeredPatient.patientId}
                                </p>
                            </div>

                            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-4 mb-6 border border-teal-200">
                                <p className="text-gray-700 text-center text-sm">
                                    Would you like to book an appointment for this patient now?
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setShowBookingOptions(false);
                                        navigate("/");
                                    }}
                                    className="flex-1 px-4 py-3 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                                >
                                    ← Go Home
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setShowBookingOptions(false);
                                        // Navigate to Calendar with patient data
                                        navigate("/appointments", {
                                            state: {
                                                patientData: registeredPatient
                                            }
                                        });
                                    }}
                                    className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 transition shadow-lg"
                                >
                                    📅 Book Appointment
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
