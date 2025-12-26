import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function ViewStaffDetails() {
  const navigate = useNavigate();
  
  // Search state
  const [searchFilters, setSearchFilters] = useState({
    rolesAssigned: "",
    profileID: "",
    firstName: "",
    lastName: "",
    enterpriseId: "",
    clinicId: ""
  });

  // Staff list and UI state
  const [staffList, setStaffList] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSearchResult, setShowSearchResult] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeletingStaff, setIsDeletingStaff] = useState(false);

  // Enterprise and Clinic state
  const [enterprises, setEnterprises] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [isLoadingEnterprises, setIsLoadingEnterprises] = useState(false);
  const [isLoadingClinics, setIsLoadingClinics] = useState(false);

  // Available roles
  const availableRoles = [
    { id: "entityadmin", name: "Entity Admin" },
    { id: "staff", name: "Staff" },
    { id: "clinicadmin", name: "Clinic Admin" },
    { id: "Doctor", name: "Doctor" },
    { id: "Nurse", name: "Nurse" }
  ];

  // Fetch all enterprises on component mount
  useEffect(() => {
    const fetchEnterprises = async () => {
      try {
        setIsLoadingEnterprises(true);
        const response = await fetch("https://localhost:7104/api/Enterprise/GetAllEnterprises", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const enterpriseList = Array.isArray(data) ? data : (data?.enterprises || []);
          console.log("📋 Enterprises loaded:", enterpriseList);
          setEnterprises(enterpriseList);
        } else {
          console.error("Failed to fetch enterprises");
        }
      } catch (err) {
        console.error("Error fetching enterprises:", err);
      } finally {
        setIsLoadingEnterprises(false);
      }
    };

    fetchEnterprises();
  }, []);

  // Fetch clinics when enterprise is selected
  useEffect(() => {
    const fetchClinics = async () => {
      if (!searchFilters.enterpriseId) {
        setClinics([]);
        return;
      }

      try {
        setIsLoadingClinics(true);
        const response = await fetch(
          `https://localhost:7104/api/Clinic/GetClinicByID?id=${searchFilters.enterpriseId}`,
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
          const clinicList = Array.isArray(data) ? data : (data?.clinics || [data]);
          console.log("📋 Clinics loaded:", clinicList);
          setClinics(clinicList);
        } else {
          console.error("Failed to fetch clinics");
          setClinics([]);
        }
      } catch (err) {
        console.error("Error fetching clinics:", err);
        setClinics([]);
      } finally {
        setIsLoadingClinics(false);
      }
    };

    fetchClinics();
  }, [searchFilters.enterpriseId]);

  // UI helpers
  const getInitials = (first, last) => {
    const f = (first || "").trim();
    const l = (last || "").trim();
    const initials = `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
    return initials || "S";
  };

  const RoleBadge = ({ role }) => {
    const r = (role || "").toLowerCase();
    const styles = {
      entityadmin: "bg-indigo-50 text-indigo-700 ring-indigo-200",
      clinicadmin: "bg-sky-50 text-sky-700 ring-sky-200",
      staff: "bg-slate-50 text-slate-700 ring-slate-200",
      doctor: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      nurse: "bg-teal-50 text-teal-700 ring-teal-200",
      receptionist: "bg-amber-50 text-amber-800 ring-amber-200"
    };
    const cls = styles[r] || "bg-slate-50 text-slate-700 ring-slate-200";
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ring-1 ${cls}`}>
        {role || "Unknown"}
      </span>
    );
  };

  // Search handlers
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    console.log("🔍 Search initiated with filters:", searchFilters);

    if (!searchFilters.rolesAssigned) {
      setError("Please select a role to search");
      return;
    }

    if (!searchFilters.enterpriseId) {
      setError("Please select an enterprise");
      return;
    }

    // All search criteria (Profile ID, First Name, Last Name) are optional
    const hasProfileID = (searchFilters.profileID || "").trim() !== "";
    const hasFirstName = (searchFilters.firstName || "").trim() !== "";
    const hasLastName = (searchFilters.lastName || "").trim() !== "";
    
    console.log("✅ Filter validation:");
    console.log("  - profileID value:", `'${searchFilters.profileID}'`, "| hasProfileID:", hasProfileID);
    console.log("  - firstName value:", `'${searchFilters.firstName}'`, "| hasFirstName:", hasFirstName);
    console.log("  - lastName value:", `'${searchFilters.lastName}'`, "| hasLastName:", hasLastName);
    
    console.log("✅ Validation passed (all search criteria are optional), proceeding with search...");

    try {
      setIsSearching(true);
      const params = new URLSearchParams();
      params.append("rolesAssigned", searchFilters.rolesAssigned);
      params.append("enterpriseId", searchFilters.enterpriseId);
      if (searchFilters.clinicId) params.append("clinicId", searchFilters.clinicId);
      if (hasProfileID) params.append("Id", searchFilters.profileID.trim());
      if (hasFirstName) params.append("firstName", searchFilters.firstName.trim());
      if (hasLastName) params.append("lastName", searchFilters.lastName.trim());

      const url = `https://localhost:7104/api/StaffDetail/RoleBasedProfiles?${params.toString()}`;
      console.log("🔍 Search Filters State:", searchFilters);
      console.log("✅ hasProfileID:", hasProfileID, "| hasFirstName:", hasFirstName, "| hasLastName:", hasLastName);
      console.log("🌐 Full API URL:", url);
      console.log("📋 Query Params:", params.toString());
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (response.status === 404) {
        setStaffList([]);
        setShowSearchResult(true);
        setSuccessMessage("");
        setError("Currently not working in the hospital");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch staff profiles");
      }

      const data = await response.json();
      const rawList = Array.isArray(data) ? data : (data?.profiles || []);
      
      // Log the first staff object to see all available fields
      if (rawList.length > 0) {
        console.log("🔍 First Staff Object from API:", rawList[0]);
        console.log("   Available fields:", Object.keys(rawList[0]));
      }
      
      // Map staffId to profileId for consistent data model
      const list = rawList.map(staff => ({
        ...staff,
        profileId: staff.staffId  // Map staffId as profileId
      }));
      
      console.log("📋 Mapped staff list with profileId:", list);
      setStaffList(list);
      setShowSearchResult(true);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "Something went wrong while searching");
    } finally {
      setIsSearching(false);
    }
  };

  // Edit modal handlers
  const openEditModal = staff => {
    console.log("🔍 Full Staff Object for Edit:", staff);
    console.log("  - Profile ID:", staff.profileId);
    setSelectedStaff(staff);
    // Store profileId from mapped data
    setEditFormData({ ...staff });
    setShowEditModal(true);
  };

  const handleEditFormChange = e => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateStaff = async e => {
    e.preventDefault();
    
    if (!editFormData.firstName || !editFormData.lastName || !editFormData.email) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setIsSubmittingEdit(true);
      setError("");

      // Use profileId from selected staff; fallback to the Profile ID used in search
      const profileId = (editFormData?.profileId
        || selectedStaff?.profileId
        || (searchFilters.profileID || "").trim());
      console.log("📝 Resolved Profile ID:", profileId);
      console.log("🧾 Edit form data:", editFormData);
      console.log("👤 Selected staff:", selectedStaff);
      console.log("🔎 Search filters:", searchFilters);

      if (!profileId) {
        throw new Error("Missing Profile ID. Ensure the staff card has a Profile ID or search by Profile ID first.");
      }

      // Role comes from search filter since API returns null for rolesAssigned
      const roleValue = searchFilters.rolesAssigned || editFormData.rolesAssigned || "";
      if (!roleValue) {
        throw new Error("Missing role for update");
      }

      // Only include license fields for Doctor and Nurse roles
      const rolesToExcludeLicenseFields = ["entityadmin", "staff", "clinicadmin", "receptionist"];
      const shouldIncludeLicenseFields = !rolesToExcludeLicenseFields.includes(roleValue.toLowerCase());

      // Build PascalCase payload expected by .NET backend (exclude ProfileId from body)
      const payload = {
        RolesAssigned: roleValue,
        // Send profileId as StaffId in the data model
        StaffId: profileId,
        EnterpriseID: editFormData.enterpriseID || 0,
        ClinicID: editFormData.clinicID || 0,
        FirstName: editFormData.firstName || null,
        LastName: editFormData.lastName || null,
        Email: editFormData.email || null,
        Phone: editFormData.phone || null,
        Gender: editFormData.gender || null,
        DateOfBirth: editFormData.dateOfBirth || null,
        Address: editFormData.address || null,
        Education: editFormData.education || null,
        YearsExperience: editFormData.yearsExperience ?? null,
        EmploymentStatus: editFormData.employmentStatus || null,
        JoiningDate: editFormData.joiningDate || null,
        Certifications: editFormData.certifications || null,
        Languages: editFormData.languages || null,
        Availability: editFormData.availability || null,
        InsuranceDetails: editFormData.insuranceDetails || null,
        EmergencyContact: editFormData.emergencyContact || null,
        Bio: editFormData.bio || null,
        ProfilePhotoUrl: editFormData.profilePhotoUrl || null,
        Achievements: editFormData.achievements || null,
        Publications: editFormData.publications || null,
        SocialLinks: editFormData.socialLinks || null
      };

      // Only add license fields for Doctor/Nurse - completely exclude for other roles
      if (shouldIncludeLicenseFields) {
        payload.LicenseNumber = editFormData.licenseNumber || null;
        payload.LicenseExpiry = editFormData.licenseExpiry || null;
        payload.SpecialtyId = editFormData.specialtyId ?? null;
      }

      const url = `https://localhost:7104/api/StaffDetail/EditRoleBasedProfile/${encodeURIComponent(profileId)}?rolesAssigned=${encodeURIComponent(roleValue)}`;
      console.log("✏️ Edit API URL:", url);
      console.log("� Sending to API:");
      console.log("   - Method: POST");
      console.log("   - Path Parameter - Profile ID:", profileId);
      console.log("   - Query Parameter - Role:", roleValue);
      console.log("   - Body Payload:", JSON.stringify(payload, null, 2));
      console.log("🔍 License Fields Included:", shouldIncludeLicenseFields);
      
      const doEdit = async (method) => {
        return fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
          },
          body: JSON.stringify(payload)
        });
      };

      let response = await doEdit("POST");
      console.log("📡 Edit API Response Status (POST):", response.status, response.statusText);

      // Fallback to PUT if POST not allowed
      if (response.status === 405) {
        console.warn("⚠️ POST returned 405 (Method Not Allowed). Retrying with PUT...");
        response = await doEdit("PUT");
        console.log("📡 Edit API Response Status (PUT):", response.status, response.statusText);
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ Edit API Error:", errText);
        throw new Error(`API Error ${response.status}: ${errText || "Failed to update staff profile"}`);
      }

      const responseData = await response.json().catch(() => null);
      console.log("✅ Edit API Success Response:", responseData);

      setSuccessMessage(`Profile for ${editFormData.firstName} ${editFormData.lastName} has been updated successfully`);
      setShowEditModal(false);

      // Refresh list: re-run search if filters exist
      if (searchFilters.rolesAssigned && searchFilters.enterpriseId) {
        setIsSearching(true);
        try {
          const searchParams = new URLSearchParams();
          searchParams.append("rolesAssigned", searchFilters.rolesAssigned);
          searchParams.append("enterpriseId", searchFilters.enterpriseId);
          if (searchFilters.clinicId) searchParams.append("clinicId", searchFilters.clinicId);
          if ((searchFilters.profileID || "").trim() !== "") searchParams.append("Id", searchFilters.profileID.trim());
          if ((searchFilters.firstName || "").trim() !== "") searchParams.append("firstName", searchFilters.firstName.trim());
          if ((searchFilters.lastName || "").trim() !== "") searchParams.append("lastName", searchFilters.lastName.trim());
          
          const searchUrl = `https://localhost:7104/api/StaffDetail/RoleBasedProfiles?${searchParams.toString()}`;
          const searchResponse = await fetch(searchUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
            }
          });
          
          if (searchResponse.ok) {
            const data = await searchResponse.json();
            const list = Array.isArray(data) ? data : (data?.profiles || []);
            // Ensure profileId is available in the refreshed list
            const mappedList = list.map(staff => ({
              ...staff,
              profileId: staff.profileId || staff.staffId || null
            }));
            setStaffList(mappedList);
          }
        } finally {
          setIsSearching(false);
        }
      }
      
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("❌ Update error:", err);
      setError(err.message || "Something went wrong while updating");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete handlers
  const openDeleteConfirm = staff => {
    setSelectedStaff(staff);
    setShowDeleteConfirm(true);
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    try {
      setIsDeletingStaff(true);
      setError("");
      
      console.log("🗑️ Delete operation initiated for Profile ID:", selectedStaff.profileId);
      console.log("  - Staff Name:", selectedStaff.firstName, selectedStaff.lastName);

      const params = new URLSearchParams();
      // Get all required parameters from the selected staff object
      const profileIdForDelete = selectedStaff.profileId || "";
      const firstNameForDelete = selectedStaff.firstName || "";
      const lastNameForDelete = selectedStaff.lastName || "";
      const roleForDelete = searchFilters.rolesAssigned || "";
      
      if (!profileIdForDelete || !firstNameForDelete || !lastNameForDelete || !roleForDelete) {
        throw new Error(`Missing required parameters. Profile ID: ${profileIdForDelete}, First Name: ${firstNameForDelete}, Last Name: ${lastNameForDelete}, Role: ${roleForDelete}`);
      }
      
      params.append("profileId", profileIdForDelete);
      params.append("firstName", firstNameForDelete);
      params.append("lastName", lastNameForDelete);
      params.append("rolesAssigned", roleForDelete);

      const url = `https://localhost:7104/api/StaffDetail/DeleteRoleBasedProfile?${params.toString()}`;
      console.log("🗑️ Delete API URL:", url);
      console.log("🔍 Delete params - Profile ID:", profileIdForDelete, "| First Name:", firstNameForDelete, "| Last Name:", lastNameForDelete, "| Role:", roleForDelete);

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (response.ok) {
        const message = `Staff "${selectedStaff.firstName} ${selectedStaff.lastName}" deleted successfully!`;
        setSuccessMessage(message);
        setShowDeleteConfirm(false);
        // Remove from list
        setStaffList(prev => prev.filter(s => s.profileId !== selectedStaff.profileId));
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        const errorText = await response.text();
        console.error("❌ Delete API error response:", errorText);
        throw new Error(errorText || "Failed to delete staff");
      }
    } catch (err) {
      console.error("Delete error:", err);
      const errorMessage = `Failed to delete staff: ${err.message}`;
      setError(errorMessage);
      // Auto-clear error after a short delay
      setTimeout(() => setError(""), 4000);
    } finally {
      setIsDeletingStaff(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Success Flyer (Centered) */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <motion.div
                className="bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl text-center font-semibold pointer-events-auto"
                transition={{ type: "spring", damping: 15 }}
              >
                {successMessage}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Error Toast (Centered) */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <motion.div
                className="bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl text-center font-semibold pointer-events-auto"
                transition={{ type: "spring", damping: 15 }}
              >
                {error}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700">View Staff Details</h1>
            <p className="text-sm text-gray-600 mt-1">Search and manage staff profiles</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border"
          >
            Back
          </button>
        </div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Staff</h2>
          
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Required Filters Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-50/50 rounded-xl p-5 border border-indigo-100">
              <h3 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs">*</span>
                Required Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    name="rolesAssigned"
                    value={searchFilters.rolesAssigned}
                    onChange={handleSearchChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    required
                  >
                    <option value="">Select role</option>
                    {availableRoles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Select the staff role to search for</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enterprise
                  </label>
                  <select
                    name="enterpriseId"
                    value={searchFilters.enterpriseId}
                    onChange={handleSearchChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-100 disabled:text-gray-500"
                    disabled={isLoadingEnterprises}
                    required
                  >
                    <option value="">Select enterprise</option>
                    {enterprises.map(enterprise => {
                      const enterpriseId = enterprise.enterpriseID || enterprise.enterpriseId || enterprise.id;
                      return (
                        <option key={enterpriseId} value={enterpriseId}>
                          {enterprise.enterpriseName || enterprise.name}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose the organization to search within</p>
                </div>
              </div>
            </div>

            {/* Optional Filters Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Optional Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Clinic
                  </label>
                  <select
                    name="clinicId"
                    value={searchFilters.clinicId}
                    onChange={handleSearchChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-100 disabled:text-gray-500"
                    disabled={isLoadingClinics || !searchFilters.enterpriseId}
                  >
                    <option value="">All Clinics</option>
                    {clinics.map(clinic => {
                      const clinicId = clinic.clinicID || clinic.clinicId || clinic.id;
                      return (
                        <option key={clinicId} value={clinicId}>
                          {clinic.clinicName || clinic.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Profile ID</label>
                  <input
                    type="text"
                    name="profileID"
                    value={searchFilters.profileID}
                    onChange={handleSearchChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="e.g., S001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={searchFilters.firstName}
                    onChange={handleSearchChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="e.g., John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={searchFilters.lastName}
                    onChange={handleSearchChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="e.g., Doe"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-600">Filters marked with <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-xs mr-1">*</span> are required</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSearchFilters({ rolesAssigned: "", profileID: "", firstName: "", lastName: "", enterpriseId: "", clinicId: "" });
                    setStaffList([]);
                    setShowSearchResult(false);
                    setError("");
                  }}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
                >
                  {isSearching ? "Searching..." : "Search Staff"}
                </button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Staff Results */}
        <AnimatePresence>
          {showSearchResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Results summary */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Results: <span className="font-semibold text-gray-800">{staffList.length}</span></p>
                {isSearching && <p className="text-xs text-gray-500">Loading...</p>}
              </div>

              {/* Skeletons while searching */}
              {isSearching && (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => (
                    <div key={`sk-${i}`} className="bg-white rounded-2xl shadow-lg p-6">
                      <div className="animate-pulse">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200" />
                            <div>
                              <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                              <div className="h-3 w-32 bg-gray-100 rounded" />
                            </div>
                          </div>
                          <div className="h-6 w-24 bg-gray-200 rounded-full" />
                        </div>
                        <div className="mt-4 flex gap-2">
                          <div className="h-6 w-24 bg-gray-100 rounded-full" />
                          <div className="h-6 w-28 bg-gray-100 rounded-full" />
                          <div className="h-6 w-24 bg-gray-100 rounded-full" />
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="h-4 w-full bg-gray-100 rounded" />
                          <div className="h-4 w-full bg-gray-100 rounded" />
                          <div className="h-4 w-full bg-gray-100 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {staffList.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <p className="text-gray-600 text-lg">No {searchFilters.rolesAssigned || "staff"} is working right now</p>
                </div>
              ) : (
                staffList.map((staff, index) => (
                  <motion.div
                    key={`staff-${staff.profileId}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          {getInitials(staff.firstName, staff.lastName)}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{staff.firstName} {staff.lastName}</p>
                          <p className="text-sm text-gray-500">{staff.email || "No email"}</p>
                        </div>
                      </div>
                      <RoleBadge role={staff.rolesAssigned || searchFilters.rolesAssigned} />
                    </div>

                    {/* ID chips */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-slate-50 text-slate-700 ring-1 ring-slate-200">Profile: {staff.profileId || "N/A"}</span>
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-200">Enterprise: {staff.enterpriseID || "N/A"}</span>
                      <span className="px-2 py-1 text-xs rounded-full bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200">Clinic: {staff.clinicID || "N/A"}</span>
                    </div>

                    {/* Details */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Phone</p>
                        <p className="text-sm text-gray-700">{staff.phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Gender</p>
                        <p className="text-sm text-gray-700">{staff.gender || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Date of Birth</p>
                        <p className="text-sm text-gray-700">{staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Education</p>
                        <p className="text-sm text-gray-700">{staff.education || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Experience</p>
                        <p className="text-sm text-gray-700">{staff.yearsExperience || 0} years</p>
                      </div>
                    </div>

                    {(staff.licenseNumber || staff.licenseExpiry || staff.specialtyId) && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-3 rounded ring-1 ring-blue-100">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">License Number</p>
                          <p className="text-sm text-gray-700">{staff.licenseNumber || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">License Expiry</p>
                          <p className="text-sm text-gray-700">{staff.licenseExpiry || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">Specialty ID</p>
                          <p className="text-sm text-gray-700">{staff.specialtyId || "N/A"}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-5 flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEditModal(staff)}
                        className="px-4 py-2 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(staff)}
                        className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-semibold text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {showEditModal && editFormData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto max-w-2xl w-full"
              >
                <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Edit Staff Details</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleUpdateStaff} className="p-6 space-y-4">
                  {/* Enterprise and Clinic - Mandatory */}
                  <div className="bg-purple-50 p-4 rounded-lg space-y-3 border border-purple-200">
                    <p className="text-sm font-semibold text-purple-900">Enterprise & Clinic Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Enterprise ID *
                        </label>
                        <select
                          name="enterpriseID"
                          value={editFormData.enterpriseID || ""}
                          onChange={handleEditFormChange}
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="">Select enterprise</option>
                          {enterprises.map(enterprise => {
                            const enterpriseId = enterprise.enterpriseID || enterprise.enterpriseId || enterprise.id;
                            return (
                              <option key={enterpriseId} value={enterpriseId}>
                                {enterprise.enterpriseName || enterprise.name} ({enterpriseId})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Clinic ID
                        </label>
                        <select
                          name="clinicID"
                          value={editFormData.clinicID || ""}
                          onChange={handleEditFormChange}
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          disabled={!editFormData.enterpriseID}
                        >
                          <option value="">Select clinic</option>
                          {clinics.map(clinic => {
                            const clinicId = clinic.clinicID || clinic.clinicId || clinic.id;
                            return (
                              <option key={clinicId} value={clinicId}>
                                {clinic.clinicName || clinic.name} ({clinicId})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Basic Information - Show for all roles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={editFormData.firstName}
                        onChange={handleEditFormChange}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={editFormData.lastName}
                        onChange={handleEditFormChange}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={editFormData.email}
                        onChange={handleEditFormChange}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={editFormData.phone}
                        onChange={handleEditFormChange}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={editFormData.gender}
                        onChange={handleEditFormChange}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Other">Other</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={editFormData.dateOfBirth?.split('T')[0] || ""}
                        onChange={handleEditFormChange}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={editFormData.address}
                      onChange={handleEditFormChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Professional Information - Show for Doctor/Receptionist */}
                  {!["entityadmin", "staff", "clinicadmin"].includes(
                    (editFormData.rolesAssigned || "").toLowerCase()
                  ) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Education
                        </label>
                        <input
                          type="text"
                          name="education"
                          value={editFormData.education}
                          onChange={handleEditFormChange}
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          name="yearsExperience"
                          value={editFormData.yearsExperience}
                          onChange={handleEditFormChange}
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* License fields - show only for Doctor/Nurse */}
                  {["doctor", "nurse"].includes(
                    (editFormData.rolesAssigned || "").toLowerCase()
                  ) && (
                    <div className="bg-blue-50 p-4 rounded-lg space-y-3 border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900">License & Specialty Information</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            License Number
                          </label>
                          <input
                            type="text"
                            name="licenseNumber"
                            value={editFormData.licenseNumber || ""}
                            onChange={handleEditFormChange}
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            License Expiry
                          </label>
                          <input
                            type="date"
                            name="licenseExpiry"
                            value={editFormData.licenseExpiry?.split('T')[0] || ""}
                            onChange={handleEditFormChange}
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Specialty ID
                        </label>
                        <input
                          type="number"
                          name="specialtyId"
                          value={editFormData.specialtyId || ""}
                          onChange={handleEditFormChange}
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Employment Information - Show for all roles */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Employment Status
                      </label>
                      <select
                        name="employmentStatus"
                        value={editFormData.employmentStatus}
                        onChange={handleEditFormChange}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Joining Date
                      </label>
                      <input
                        type="date"
                        name="joiningDate"
                        value={editFormData.joiningDate?.split('T')[0] || ""}
                        onChange={handleEditFormChange}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Additional Professional Information */}
                  <div className="bg-green-50 p-4 rounded-lg space-y-3 border border-green-200">
                    <p className="text-sm font-semibold text-green-900">Additional Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Certifications
                        </label>
                        <input
                          type="text"
                          name="certifications"
                          value={editFormData.certifications || ""}
                          onChange={handleEditFormChange}
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Languages
                        </label>
                        <input
                          type="text"
                          name="languages"
                          value={editFormData.languages || ""}
                          onChange={handleEditFormChange}
                          placeholder="e.g., English, Hindi, Marathi"
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Availability
                        </label>
                        <input
                          type="text"
                          name="availability"
                          value={editFormData.availability || ""}
                          onChange={handleEditFormChange}
                          placeholder="e.g., Monday-Friday 9AM-5PM"
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Emergency Contact
                        </label>
                        <input
                          type="tel"
                          name="emergencyContact"
                          value={editFormData.emergencyContact || ""}
                          onChange={handleEditFormChange}
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Insurance Details
                        </label>
                        <input
                          type="text"
                          name="insuranceDetails"
                          value={editFormData.insuranceDetails || ""}
                          onChange={handleEditFormChange}
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Profile Photo URL
                        </label>
                        <input
                          type="url"
                          name="profilePhotoUrl"
                          value={editFormData.profilePhotoUrl || ""}
                          onChange={handleEditFormChange}
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio and Other Details */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={editFormData.bio || ""}
                      onChange={handleEditFormChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Achievements
                      </label>
                      <input
                        type="text"
                        name="achievements"
                        value={editFormData.achievements || ""}
                        onChange={handleEditFormChange}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Publications
                      </label>
                      <input
                        type="text"
                        name="publications"
                        value={editFormData.publications || ""}
                        onChange={handleEditFormChange}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Social Links
                    </label>
                    <input
                      type="text"
                      name="socialLinks"
                      value={editFormData.socialLinks || ""}
                      onChange={handleEditFormChange}
                      placeholder="e.g., LinkedIn, Twitter profiles"
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmittingEdit}
                      className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-semibold"
                    >
                      {isSubmittingEdit ? "Updating..." : "Update Staff"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && selectedStaff && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
              >
                <h3 className="text-xl font-bold text-red-600 mb-4">Delete Staff Member</h3>
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete <strong>{selectedStaff.firstName} {selectedStaff.lastName}</strong>?
                </p>
                <p className="text-sm text-gray-600 mb-6">This action cannot be undone.</p>

                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteStaff}
                    disabled={isDeletingStaff}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 font-semibold"
                  >
                    {isDeletingStaff ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
