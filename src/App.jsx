import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import ErrorPage from "./components/ErrorPage";
import ErrorBoundary from "./components/ErrorBoundary";
import TokenExpiryModal from "./components/TokenExpiryModal";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import Clinics from "./pages/Clinics";
import CreateClinic from "./pages/CreateClinic";
import ViewClinics from "./pages/ViewClinics";
import Patients from "./pages/Patients";
import ViewPatients from "./pages/ViewPatients";
import RegisterPatient from "./pages/RegisterPatient";
import EditPatients from "./pages/EditPatients";
import Services from "./pages/Services";
import Staff from "./pages/Staff";
import TeamHub from "./pages/TeamHub";
import Doctors from "./pages/Doctors";
import ViewDoctors from "./pages/ViewDoctors";
import DoctorClinicMapping from "./pages/DoctorClinicMapping";
import ReceptionistOnboarding from "./pages/ReceptionistOnboarding";
import ViewStaffDetails from "./pages/ViewStaffDetails";
import DeletePatients from "./pages/DeletePatients";
import CrudPage from "./pages/CrudPage";
import Calendar from "./pages/Calendar";
import VisitInformation from "./pages/VisitInformation";
import ClinicAnalytics from "./pages/ClinicAnalytics";
import ReportsAnalytics from "./pages/ReportsAnalytics";
import SalaryManagement from "./pages/SalaryManagement";
import DoctorSalaryDetails from "./pages/DoctorSalaryDetails";
import Inventory from "./pages/Inventory.jsx";
import AddMasterInventory from "./pages/AddMasterInventory.jsx";
import ViewMasterInventory from "./pages/ViewMasterInventory.jsx";
import ClinicInventory from "./pages/ClinicInventory.tsx";
import Analytics from "./pages/Analytics.jsx";
import Footer from "./components/Footer";
import WhatsAppChatbot from "./components/WhatsAppChatbot";
import { useTokenExpiry } from "./context/TokenExpiryContext";
import { tokenExpiryEmitter } from "./services/apiClient";
import { initializeTabFocusListener, startTokenRefreshHeartbeat, getAuthToken } from "./services/authService";

export default function App(){
  const navigate = useNavigate();
  const { showTokenExpiryModal, setShowTokenExpiryModal } = useTokenExpiry();

  useEffect(() => {
    // Subscribe to token expiry events
    const unsubscribe = tokenExpiryEmitter.subscribe((location) => {
      console.log('🔐 Token expiry detected, showing modal');
      setShowTokenExpiryModal(true);
    });

    // Initialize tab focus listener to ensure token refresh continues
    const removeFocusListener = initializeTabFocusListener();

    // Start heartbeat if user is already logged in (e.g., after page reload)
    const token = getAuthToken();
    if (token) {
      console.log('✅ User is logged in. Starting token refresh heartbeat...');
      startTokenRefreshHeartbeat();
    }

    // Cleanup
    return () => {
      unsubscribe();
      removeFocusListener();
    };
  }, [setShowTokenExpiryModal]);

  const handleLoginRedirect = () => {
    setShowTokenExpiryModal(false);
    navigate('/login', { state: { returnTo: sessionStorage.getItem('tokenExpiryLocation') || '/' } });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-warmGray-50 to-teal-50/30">
        <Header />
        <main>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<div className="max-w-6xl mx-auto"><Home /></div>} />
          <Route path="/clinics" element={<div className="max-w-6xl mx-auto"><Clinics /></div>} />
          <Route path="/clinics/create" element={<div className="max-w-6xl mx-auto"><CreateClinic /></div>} />
          <Route path="/clinics/view" element={<div className="max-w-6xl mx-auto"><ViewClinics /></div>} />
          <Route path="/clinics/:operation" element={<div className="max-w-6xl mx-auto"><CrudPage resource="Clinics" /></div>} />
          <Route path="/patients" element={<div className="max-w-6xl mx-auto"><Patients /></div>} />
          <Route path="/patients/view" element={<ViewPatients />} />
          <Route path="/patients/register" element={<RegisterPatient />} />
          <Route path="/patients/edit" element={<div className="max-w-6xl mx-auto"><EditPatients /></div>} />
          <Route path="/patients/delete" element={<div className="max-w-6xl mx-auto"><DeletePatients /></div>} />
          <Route path="/patients/:operation" element={<div className="max-w-6xl mx-auto"><CrudPage resourceType="patients" /></div>} />
          <Route path="/services" element={<div className="max-w-6xl mx-auto"><Services /></div>} />
          <Route path="/services/:operation" element={<div className="max-w-6xl mx-auto"><CrudPage resource="Services" /></div>} />
          <Route path="/team-hub" element={<TeamHub />} />
          <Route path="/staff" element={<div className="max-w-6xl mx-auto"><Staff /></div>} />
          <Route path="/staff/:operation" element={<div className="max-w-6xl mx-auto"><CrudPage resource="Staff" /></div>} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/view" element={<ViewDoctors />} />
          <Route path="/doctors/clinic-mapping" element={<DoctorClinicMapping />} />
          <Route path="/receptionists/onboard" element={<ReceptionistOnboarding />} />
          <Route path="/staff/onboard" element={<ReceptionistOnboarding />} />
          <Route path="/staff/details" element={<ViewStaffDetails />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/visits" element={<VisitInformation />} />
          <Route path="/clinics/analytics" element={<ClinicAnalytics />} />
          <Route path="/reports" element={<ReportsAnalytics />} />
          <Route path="/salary" element={<SalaryManagement />} />
          <Route path="/salary/doctor/:doctorId" element={<DoctorSalaryDetails />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/add-master" element={<AddMasterInventory />} />
          <Route path="/inventory/view-master" element={<ViewMasterInventory />} />
          <Route path="/inventory/clinic" element={<ClinicInventory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/error-preview" element={<ErrorPage error={{ message: "This is a preview of the error page for testing purposes!" }} />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppChatbot />
        <TokenExpiryModal 
          isOpen={showTokenExpiryModal} 
          onLogin={handleLoginRedirect}
          onClose={() => setShowTokenExpiryModal(false)}
        />
      </div>
    </ErrorBoundary>
  );
}
