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
    lastName: ""
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

  // Available roles
  const availableRoles = [
    { id: "entityadmin", name: "Entity Admin" },
    { id: "staff", name: "Staff" },
    { id: "clinicadmin", name: "Clinic Admin" },
    { id: "Doctor", name: "Doctor" },
    { id: "Nurse", name: "Nurse" }
  ];

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

    // Require at least one optional filter (trim to check for non-empty values)
    const hasProfileID = (searchFilters.profileID || "").trim() !== "";
    const hasFirstName = (searchFilters.firstName || "").trim() !== "";
    const hasLastName = (searchFilters.lastName || "").trim() !== "";
    
    console.log("✅ Filter validation:");
    console.log("  - profileID value:", `'${searchFilters.profileID}'`, "| hasProfileID:", hasProfileID);
    console.log("  - firstName value:", `'${searchFilters.firstName}'`, "| hasFirstName:", hasFirstName);
    console.log("  - lastName value:", `'${searchFilters.lastName}'`, "| hasLastName:", hasLastName);
    
    if (!hasProfileID && !hasFirstName && !hasLastName) {
      setError("Please provide at least one filter: Profile ID, First Name, or Last Name");
      console.log("❌ Validation failed: No filters provided");
      return;
    }

    console.log("✅ Validation passed, proceeding with search...");

    try {
      setIsSearching(true);
      const params = new URLSearchParams();
      params.append("rolesAssigned", searchFilters.rolesAssigned);
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

      setSuccessMessage(`✅ Profile for ${editFormData.firstName} ${editFormData.lastName} has been updated successfully`);
      alert(`Profile for ${editFormData.firstName} ${editFormData.lastName} has been updated successfully`);
      setShowEditModal(false);

      // Refresh list: re-run search if filters exist
      if (searchFilters.rolesAssigned) {
        setIsSearching(true);
        try {
          const searchParams = new URLSearchParams();
          searchParams.append("rolesAssigned", searchFilters.rolesAssigned);
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
            setStaffList(list);
          }
        } finally {
          setIsSearching(false);
        }
      }
      
      setTimeout(() => setSuccessMessage(""), 3000);
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
        const message = `✅ Staff "${selectedStaff.firstName} ${selectedStaff.lastName}" deleted successfully!`;
        setSuccessMessage(message);
        // Toast/alert in addition to inline success message
        alert(message);
        setShowDeleteConfirm(false);
        // Remove from list and refresh
        setStaffList(prev => prev.filter(s => s.profileId !== selectedStaff.profileId));
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorText = await response.text();
        console.error("❌ Delete API error response:", errorText);
        throw new Error(errorText || "Failed to delete staff");
      }
    } catch (err) {
      console.error("Delete error:", err);
      const errorMessage = `Failed to delete staff: ${err.message}`;
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsDeletingStaff(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
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
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Search Criteria</h2>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="rolesAssigned"
                  value={searchFilters.rolesAssigned}
                  onChange={handleSearchChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select role</option>
                  {availableRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Profile ID</label>
                <input
                  type="text"
                  name="profileID"
                  value={searchFilters.profileID}
                  onChange={handleSearchChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Profile ID like S001 or 123"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={searchFilters.firstName}
                  onChange={handleSearchChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Doe"
                />
              </div>
              <div className="md:col-span-3">
                <p className="text-xs text-orange-600 font-semibold">Provide at least one: Profile ID, First Name, or Last Name.</p>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
              >
                {error}
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
              >
                {successMessage}
              </motion.div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-semibold"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchFilters({ rolesAssigned: "", profileID: "", firstName: "", lastName: "" });
                  setStaffList([]);
                  setShowSearchResult(false);
                  setError("");
                }}
                className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border"
              >
                Clear
              </button>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Profile ID</p>
                        <p className="text-lg font-bold text-indigo-700">{staff.profileId || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Name</p>
                        <p className="text-lg font-bold text-gray-800">
                          {staff.firstName} {staff.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Email</p>
                        <p className="text-sm text-gray-700">{staff.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Phone</p>
                        <p className="text-sm text-gray-700">{staff.phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Role</p>
                        <p className="text-sm font-semibold text-indigo-600">{staff.rolesAssigned || searchFilters.rolesAssigned || "N/A"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pb-4 border-b">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Date of Birth</p>
                        <p className="text-sm text-gray-700">{staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Gender</p>
                        <p className="text-sm text-gray-700">{staff.gender || "N/A"}</p>
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

                    {/* Show license info only if available */}
                    {(staff.licenseNumber || staff.licenseExpiry || staff.specialtyId) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b bg-blue-50 p-3 rounded">
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

                    <div className="flex gap-3">
                      <button
                        onClick={() => openEditModal(staff)}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(staff)}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold text-sm"
                      >
                        🗑️ Delete
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
                      <p className="text-sm font-semibold text-blue-900">🏥 License & Specialty Information</p>
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
