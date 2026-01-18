import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSelectedAccess } from "../services/authService";

export default function ReceptionistOnboarding() {
  const navigate = useNavigate();
  const [enterprises, setEnterprises] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [loadingEnterprises, setLoadingEnterprises] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [freezeEnterprise, setFreezeEnterprise] = useState(false);
  const [lastRequest, setLastRequest] = useState({
    formSnapshot: null,
    payloadSnapshot: null,
    jsonBody: ""
  });
  
  // Local date string (YYYY-MM-DD) for input max validation
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // Available roles - using role names as both id and value to match API requirements
  const availableRoles = [
    { name: "entityadmin", label: "Entity Admin" },
    { name: "clinicadmin", label: "Clinic Admin" },
    { name: "staff", label: "Staff" },
    { name: "Doctor", label: "Doctor" },
    { name: "Receptionist", label: "Receptionist" }
  ];
  
  const [form, setForm] = useState({
    staffId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    enterpriseId: 0,
    clinicId: 0,
    dateOfBirth: "",
    gender: "",
    address: "",
    licenseNumber: "",
    licenseExpiry: "",
    education: "",
    certifications: "",
    languages: "",
    joiningDate: "",
    employmentStatus: "Full-time",
    availability: "",
    insuranceDetails: "",
    emergencyContact: "",
    bio: "",
    profilePhotoUrl: "",
    achievements: "",
    publications: "",
    socialLinks: "",
    specialtyId: "",
    yearsExperience: "",
    roleId: ""
  });

  // Pre-populate enterprise ID from login access data
  useEffect(() => {
    const access = getSelectedAccess();
    console.log('🔐 Login Access Data:', access);
    
    if (access?.enterpriseId) {
      setForm(prev => ({
        ...prev,
        enterpriseId: access.enterpriseId,
        clinicId: access.clinicId || 0
      }));
      setFreezeEnterprise(true);
      console.log('✅ Pre-populated enterpriseId from login:', access.enterpriseId);
    }
  }, []);

  useEffect(() => {
    const loadEnterprises = async () => {
      try {
        setLoadingEnterprises(true);
        const response = await fetch("`${API_BASE_URL}/Enterprise", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setEnterprises(Array.isArray(data) ? data : data.data || []);
        } else {
          setError("Failed to load enterprises");
        }
      } catch (err) {
        setError("Failed to load enterprises");
      } finally {
        setLoadingEnterprises(false);
      }
    };

    loadEnterprises();
  }, []);

  useEffect(() => {
    const loadClinics = async () => {
      if (!form.enterpriseId) {
        setClinics([]);
        return;
      }

      try {
        setLoadingClinics(true);
        const response = await fetch(
          ``${API_BASE_URL}/Clinic/GetClinicByID?id=${form.enterpriseId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setClinics(Array.isArray(data) ? data : data.data || []);
          setForm(prev => ({ ...prev, clinicId: 0 }));
        } else {
          setClinics([]);
          setError("Failed to load clinics for the selected enterprise");
        }
      } catch (err) {
        setClinics([]);
        setError("Failed to load clinics for the selected enterprise");
      } finally {
        setLoadingClinics(false);
      }
    };

    loadClinics();
  }, [form.enterpriseId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = e => {
    e.preventDefault();
    console.log("🚀 FORM SUBMISSION STARTED");
    console.log("Form state:", form);
    setError("");
    setSuccessMessage("");

    if (!form.firstName || !form.lastName || !form.email) {
        console.log("❌ Validation failed: Missing required fields");
      setError("Please fill all required fields");
      return;
    }
    // Validate date of birth not in future
    if (form.dateOfBirth && form.dateOfBirth > todayISO) {
      setError("Date of birth cannot be a future date");
      return;
    }

    // Validate phone and emergency contact are not the same (normalize digits)
    const norm = (s) => (s || "").replace(/\D/g, "");
    const phoneNorm = norm(form.phone);
    const emergencyNorm = norm(form.emergencyContact);
    if (phoneNorm && emergencyNorm && phoneNorm === emergencyNorm) {
      setError("Phone number and emergency contact cannot be the same");
      return;
    }
    if (!form.enterpriseId || !form.clinicId) {
        console.log("❌ Validation failed: Missing enterprise or clinic");
      setError("Please select an enterprise and clinic");
      return;
    }
    if (!form.roleId || form.roleId === "") {
      console.log("❌ Validation failed: Missing role. roleId:", form.roleId);
      setError("⚠️ Please select a role from dropdown");
      return;
    }

    const nonClinicalRoles = ["staff", "entityadmin", "clinicadmin"];
    if (nonClinicalRoles.includes((form.roleId || "").toLowerCase())) {
      const missingProfessional =
        form.yearsExperience === "" ||
        form.education.trim() === "" ||
        form.certifications.trim() === "" ||
        form.languages.trim() === "";

      if (missingProfessional) {
        setError("Please fill professional details: Years of experience, education, certifications, and languages");
        return;
      }
    }

    console.log("✅ All validations passed, building payload...");

    const rolesAssignedValue = form.roleId;

    // Determine if we should exclude license fields based on role
    const rolesToExcludeLicenseFields = ["entityadmin", "staff", "clinicadmin"];
    const shouldExcludeLicenseFields = rolesToExcludeLicenseFields.includes((rolesAssignedValue || "").toLowerCase());

    // Build payload matching backend C# StaffDetailModel (camelCase for JSON serialization)
    // DO NOT include staffId - it's auto-generated by the backend
    const payload = {
      enterpriseID: form.enterpriseId ? parseInt(form.enterpriseId, 10) : 0,
      clinicID: form.clinicId ? parseInt(form.clinicId, 10) : 0,
      firstName: form.firstName || "",
      lastName: form.lastName || "",
      email: form.email || "",
      phone: form.phone || "",
      dateOfBirth: form.dateOfBirth || null,
      gender: form.gender || "",
      address: form.address || "",
      yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience, 10) : null,
      education: form.education || "",
      certifications: form.certifications || "",
      languages: form.languages || "",
      joiningDate: form.joiningDate || null,
      employmentStatus: form.employmentStatus || "Full-time",
      availability: form.availability || "",
      insuranceDetails: form.insuranceDetails || "",
      emergencyContact: form.emergencyContact || "",
      bio: form.bio || "",
      profilePhotoUrl: form.profilePhotoUrl || "",
      achievements: form.achievements || "",
      publications: form.publications || "",
      socialLinks: form.socialLinks || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rolesAssigned: rolesAssignedValue
    };

    // Conditionally add license fields only if role is not in exclusion list
    if (!shouldExcludeLicenseFields) {
      payload.licenseNumber = form.licenseNumber || "";
      payload.licenseExpiry = form.licenseExpiry || null;
      payload.specialtyId = form.specialtyId ? parseInt(form.specialtyId, 10) : null;
    }


    console.log("=".repeat(80));
    console.log("📦 STAFF PROFILE CREATION PAYLOAD");
    console.log("=".repeat(80));
    console.log("\n🔍 FORM VALUES (Before Processing):");
    console.log("  rolesAssignedValue:", rolesAssignedValue);
    console.log("  shouldExcludeLicenseFields:", shouldExcludeLicenseFields);
    console.log("  form.licenseNumber:", form.licenseNumber);
    console.log("  form.licenseExpiry:", form.licenseExpiry);
    console.log("  form.specialtyId:", form.specialtyId);
    
    console.log("\n📤 PAYLOAD VALUES (After Processing):");
    console.log("  RolesAssigned:", payload.RolesAssigned);
    console.log("  LicenseNumber:", payload.LicenseNumber);
    console.log("  LicenseExpiry:", payload.LicenseExpiry);
    console.log("  SpecialtyId:", payload.SpecialtyId);
    
    console.log("\n📋 FULL PAYLOAD OBJECT:");
    console.log(JSON.stringify(payload, null, 2));

    // Confirmation dialog
    const confirmSummary = [
      "Confirm staff profile creation:",
      "",
      `Name: ${form.firstName} ${form.lastName}`,
      `Email: ${form.email}`,
      `EnterpriseID: ${form.enterpriseId}`,
      `ClinicID: ${form.clinicId}`,
      `Role: ${rolesAssignedValue}`,
      shouldExcludeLicenseFields ? "⚠️ License fields will NOT be sent" : "✓ License fields will be sent",
      "",
      "Click OK to submit or Cancel to revise."
    ].join("\n");
    const confirmed = window.confirm(confirmSummary);
    if (!confirmed) {
      console.log("🛑 Submission cancelled by user at confirm dialog");
      return;
    }

    // Store debug info
    const jsonBody = JSON.stringify(payload, null, 2);
    setLastRequest({
      formSnapshot: { ...form },
      payloadSnapshot: payload,
      jsonBody
    });
    setShowDebug(true);

    console.log("\n🌐 REQUEST BODY (as it will be sent):");
    console.log(jsonBody);
    console.log("=".repeat(80));
    
    // Call the backend API to save staff profile
    setError("");
    setSuccessMessage("");
    
    const apiUrl = "`${API_BASE_URL}/StaffDetail/CreateRoleBasedProfile";
    console.log("🎯 Calling API:", apiUrl);
    console.log("📋 Method: POST");
    console.log("🔑 Auth Token:", localStorage.getItem("accessToken") ? "Present" : "Missing");
    console.log("📦 Request body:", jsonBody);
    
    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
      },
      body: jsonBody
    })
      .then(async response => {
        console.log("📡 Response status:", response.status, response.statusText);
        
        // Handle 204 NoContent (success response from backend)
        if (response.status === 204) {
          const message = `✅ Staff profile for "${form.firstName} ${form.lastName}" created successfully!`;
          setSuccessMessage(message);
          console.log("✅ Success - NoContent (204)");
          alert(message);
          
          // Reset form
          setForm({
            staffId: "",
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            enterpriseId: 0,
            clinicId: 0,
            dateOfBirth: "",
            gender: "",
            address: "",
            licenseNumber: "",
            licenseExpiry: "",
            education: "",
            certifications: "",
            languages: "",
            joiningDate: "",
            employmentStatus: "Full-time",
            availability: "",
            insuranceDetails: "",
            emergencyContact: "",
            bio: "",
            profilePhotoUrl: "",
            achievements: "",
            publications: "",
            socialLinks: "",
            specialtyId: "",
            yearsExperience: "",
            roleId: ""
          });
          setTimeout(() => navigate(-1), 3000);
          return;
        }

        if (!response.ok) {
          // Get detailed error information
          const errorText = await response.text();
          console.error("❌ API Error Response:", errorText);
          console.error("❌ Response headers:", response.headers);
          
          // If 404, suggest checking the endpoint
          if (response.status === 404) {
            throw new Error(`HTTP 404 - Endpoint not found. Verify that ${apiUrl} exists on the backend.`);
          }
          // If 400, it's likely a validation error
          if (response.status === 400) {
            throw new Error(`HTTP 400 - Bad Request. ${errorText}`);
          }
          throw new Error(`HTTP ${response.status} - ${errorText || response.statusText}`);
        }
        
        // For other 2xx responses, try to parse as JSON
        return response.json().then(data => {
          const staffId = data?.staffId || data?.id || "Generated";
          const message = `✅ Staff profile for "${form.firstName} ${form.lastName}" created successfully! Staff ID: ${staffId}`;
          setSuccessMessage(message);
          console.log("✅ Success response:", data);
          alert(message);
          
          // Reset form
          setForm({
            staffId: "",
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            enterpriseId: 0,
            clinicId: 0,
            dateOfBirth: "",
            gender: "",
            address: "",
            licenseNumber: "",
            licenseExpiry: "",
            education: "",
            certifications: "",
            languages: "",
            joiningDate: "",
            employmentStatus: "Full-time",
            availability: "",
            insuranceDetails: "",
            emergencyContact: "",
            bio: "",
            profilePhotoUrl: "",
            achievements: "",
            publications: "",
            socialLinks: "",
            specialtyId: "",
            yearsExperience: "",
            roleId: ""
          });
          setTimeout(() => navigate(-1), 3000);
        }).catch(parseError => {
          // If JSON parsing fails, still show success (some APIs return non-JSON on success)
          console.warn("⚠️ Could not parse response as JSON:", parseError);
          const message = `✅ Staff profile for "${form.firstName} ${form.lastName}" created successfully!`;
          setSuccessMessage(message);
          alert(message);
          
          setForm({
            staffId: "",
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            enterpriseId: 0,
            clinicId: 0,
            dateOfBirth: "",
            gender: "",
            address: "",
            licenseNumber: "",
            licenseExpiry: "",
            education: "",
            certifications: "",
            languages: "",
            joiningDate: "",
            employmentStatus: "Full-time",
            availability: "",
            insuranceDetails: "",
            emergencyContact: "",
            bio: "",
            profilePhotoUrl: "",
            achievements: "",
            publications: "",
            socialLinks: "",
            specialtyId: "",
            yearsExperience: "",
            roleId: ""
          });
          setTimeout(() => navigate(-1), 3000);
        });
      })
      .catch(err => {
        console.error("❌ Error onboarding staff:", err);
        alert(`Failed to onboard staff: ${err.message}`);
        setError(`Failed to onboard staff: ${err.message}`);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700">Onboard Staff</h1>
            <p className="text-sm text-gray-600 mt-1">Select enterprise and clinic, then add core details.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border"
          >
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Profile ID</label>
              <input
                type="text"
                name="staffId"
                value={form.staffId}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Leave empty for auto-generation (e.g., S001)"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Enterprise ID *</label>
              <input
                type="number"
                name="enterpriseId"
                value={form.enterpriseId}
                onChange={handleChange}
                disabled={freezeEnterprise}
                className={`w-full border rounded-lg px-3 py-2 ${freezeEnterprise ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter enterprise ID"
              />
              {freezeEnterprise && (
                <p className="text-xs text-blue-600 mt-1">
                  🔒 Locked from login access
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Assign Role</label>
              <select
                name="roleId"
                value={form.roleId}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select a role</option>
                {availableRoles.map(role => (
                  <option key={role.name} value={role.name}>
                    {role.label}
                  </option>
                ))}
              </select>
              {form.roleId && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Selected: {availableRoles.find(r => r.name === form.roleId)?.label} (Role: {form.roleId})
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="name@example.com"
                title="Enter a valid work email ID, e.g., name@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">Use a valid email ID (e.g., name@example.com). This will be used for login and notifications.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Clinic *</label>
              <select
                name="clinicId"
                value={form.clinicId}
                onChange={handleChange}
                disabled={!form.enterpriseId || loadingClinics}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value={0}>Select clinic</option>
                {clinics.map(clinic => (
                  <option key={clinic.clinicId} value={clinic.clinicId}>
                    {clinic.clinicName || clinic.clinicId}
                  </option>
                ))}
              </select>
              {loadingClinics && <p className="text-xs text-gray-500 mt-1">Loading clinics...</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="e.g., +91 9876543210"
                title="Enter digits only, include country code if applicable"
              />
              <p className="text-xs text-gray-500 mt-1">Digits only. Include country code if needed (e.g., +91 9876543210). Recommended 10–15 digits.</p>
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="mt-6 pt-6 border-t-2 border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Optional Details</h2>
            
            {/* Personal Information */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                    max={todayISO}
                    title="Date of birth cannot be in the future"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="Other">Other</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Contact</label>
                  <input
                    type="tel"
                    name="emergencyContact"
                    value={form.emergencyContact}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Alternate contact number (e.g., +91 9876501234)"
                    title="Alternate number to reach in emergencies; include country code"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alternate number for emergencies. Include country code. Prefer a different number than the primary phone.</p>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Education</label>
                  <input
                    type="text"
                    name="education"
                    value={form.education}
                    onChange={handleChange}
                    placeholder="e.g., Bachelor's in Business"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Certifications</label>
                  <input
                    type="text"
                    name="certifications"
                    value={form.certifications}
                    onChange={handleChange}
                    placeholder="e.g., Customer Service Certification"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Languages</label>
                  <input
                    type="text"
                    name="languages"
                    value={form.languages}
                    onChange={handleChange}
                    placeholder="e.g., English, Tamil"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Availability</label>
                  <select
                    name="availability"
                    value={form.availability}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select availability</option>
                    <option value="Active">Active</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={form.joiningDate}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Employment Status</label>
                  <select
                    name="employmentStatus"
                    value={form.employmentStatus}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Specialty ID <span className="text-xs text-gray-500">(Only for Doctor role)</span></label>
                  <input
                    type="number"
                    name="specialtyId"
                    value={form.specialtyId}
                    onChange={handleChange}
                    disabled={["entityadmin", "clinicadmin", "staff"].includes((form.roleId || "").toLowerCase())}
                    className={`w-full border rounded-lg px-3 py-2 ${["entityadmin", "clinicadmin", "staff"].includes((form.roleId || "").toLowerCase()) ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                    placeholder="Leave empty if not applicable"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    name="yearsExperience"
                    value={form.yearsExperience}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                {(() => {
                  const disableLicense = ["entityadmin", "clinicadmin", "staff"].includes((form.roleId || "").toLowerCase());
                  const disabledClass = disableLicense ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "";
                  return (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">License Number</label>
                        <input
                          type="text"
                          name="licenseNumber"
                          value={form.licenseNumber}
                          onChange={handleChange}
                          disabled={disableLicense}
                          className={`w-full border rounded-lg px-3 py-2 ${disabledClass}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">License Expiry</label>
                        <input
                          type="date"
                          name="licenseExpiry"
                          value={form.licenseExpiry}
                          onChange={handleChange}
                          disabled={disableLicense}
                          className={`w-full border rounded-lg px-3 py-2 ${disabledClass}`}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Additional Information */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Additional Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Tell us about the staff member"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Social Links</label>
                  <input
                    type="text"
                    name="socialLinks"
                    value={form.socialLinks}
                    onChange={handleChange}
                    placeholder="e.g., LinkedIn, Twitter URLs"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Insurance Details</label>
                  <input
                    type="text"
                    name="insuranceDetails"
                    value={form.insuranceDetails}
                    onChange={handleChange}
                    placeholder="Insurance provider or policy number"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Profile Photo URL</label>
                  <input
                    type="text"
                    name="profilePhotoUrl"
                    value={form.profilePhotoUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/photo.jpg"
                    title="Publicly accessible image URL (JPG/PNG)"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Provide a publicly accessible image URL (https://...). JPG/PNG recommended.</p>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Achievements</label>
                  <textarea
                    name="achievements"
                    value={form.achievements}
                    onChange={handleChange}
                    placeholder="Awards, recognitions, or notable accomplishments"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Publications</label>
                  <textarea
                    name="publications"
                    value={form.publications}
                    onChange={handleChange}
                    placeholder="Articles, journals, or research work"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

          {/* Debug preview: shows JSON request body and raw form values */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowDebug(v => !v)}
              className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border"
            >
              {showDebug ? "Hide Request Preview" : "Show Request Preview"}
            </button>
            {showDebug && (
              <div className="mt-3 border rounded-lg p-3 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Request Preview</h3>
                <p className="text-xs text-gray-600">This is the body sent to the API.</p>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(lastRequest.jsonBody || "")}
                    className="px-2 py-1 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700"
                  >
                    Copy JSON
                  </button>
                </div>
                <pre className="text-xs overflow-auto max-h-64 bg-white border rounded p-2">{lastRequest.jsonBody || "No submission yet"}</pre>
                <h4 className="text-sm font-semibold text-gray-800 mt-3">Raw Form Values</h4>
                <pre className="text-xs overflow-auto max-h-48 bg-white border rounded p-2">{JSON.stringify(lastRequest.formSnapshot, null, 2) || "{}"}</pre>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Save Receptionist
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


