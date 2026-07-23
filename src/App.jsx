import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import ErrorPage from "./components/ErrorPage";
import useKeepAlive from "./pages/hooks/useKeepAlive";
import ErrorBoundary from "./components/ErrorBoundary";
import TokenExpiryModal from "./components/TokenExpiryModal";
import ProtectedRoute from "./components/ProtectedRoute";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import Clinics from "./pages/Clinics";
import CreateClinic from "./pages/CreateClinic";
import ViewClinics from "./pages/ViewClinics";
import Patients from "./pages/Patients";
import Payments from "./pages/Payments";
import ServiceBilling from "./pages/ServiceBilling";
import ViewPatients from "./pages/ViewPatients";
import RegisterPatient from "./pages/RegisterPatient";
import EditPatients from "./pages/EditPatients";
import Services from "./pages/Services";
import Staff from "./pages/Staff";
import TeamHub from "./pages/TeamHub";
import Doctors from "./pages/Doctors";
import ViewDoctors from "./pages/ViewDoctors";
import DoctorClinicMappingTeamHub from "./pages/DoctorClinicMappingTeamHub";
import DoctorClinicMappingSuperAdmin from "./pages/DoctorClinicMappingSuperAdmin";
import ReceptionistOnboarding from "./pages/ReceptionistOnboarding";
import ViewStaffDetails from "./pages/ViewStaffDetails";
import SuperAdmin from "./pages/SuperAdmin";
import DeletePatients from "./pages/DeletePatients";
import CrudPage from "./pages/CrudPage";
import Calendar from "./pages/Calendar";
import VisitInformation from "./pages/VisitInformation";
import ClinicAnalytics from "./pages/ClinicAnalytics";
import ReportsAnalytics from "./pages/ReportsAnalytics";
import SalaryManagement from "./pages/SalaryManagement";
import ManageSalaries from "./pages/ManageSalaries";
import DoctorSalaryDetails from "./pages/DoctorSalaryDetails";
import Inventory from "./pages/Inventory.jsx";
import AddMasterInventory from "./pages/AddMasterInventory.jsx";
import ViewMasterInventory from "./pages/ViewMasterInventory.jsx";
import ClinicInventory from "./pages/ClinicInventory.tsx";
import Analytics from "./pages/Analytics.jsx";
import Camps from "./pages/Camps.tsx";
import CampReports from "./pages/CampReports.jsx";
import Footer from "./components/Footer";
import WhatsAppChatbot from "./components/WhatsAppChatbot";
import { useTokenExpiry } from "./context/TokenExpiryContext";
import { ModalProvider } from "./context/ModalContext";
import { tokenExpiryEmitter, refreshTokenInterceptor } from "./services/apiClient";
import GlobalOnboardStaffModal from "./components/GlobalOnboardStaffModal";
import { initializeTabFocusListener, startTokenRefreshHeartbeat, getAuthToken, initActivityListeners, updateLastActivity, startProactiveRefreshTimer } from "./services/authService";

export default function App(){
  const navigate = useNavigate();
  const { showTokenExpiryModal, setShowTokenExpiryModal } = useTokenExpiry();

  useKeepAlive();

  useEffect(() => {
    // 🔄 STEP 1: PAGE RELOAD REHYDRATION
    // If sessionStorage was cleared but refresh token cookie exists, rebuild session
    const rehydrateSession = async () => {
      const accessToken = sessionStorage.getItem('accessToken_session');
      const refreshToken = sessionStorage.getItem('refreshToken_session');
      
      console.log('\n🔄 PAGE LOAD REHYDRATION CHECK');
      console.log('═══════════════════════════════════════════');
      console.log(`   Access Token in sessionStorage: ${accessToken ? '✅ FOUND' : '❌ MISSING'}`);
      console.log(`   Refresh Token in sessionStorage: ${refreshToken ? '✅ FOUND' : '❌ MISSING'}`);
      
      // If access token is missing but refresh token exists, try to restore session
      if (!accessToken && refreshToken) {
        console.log('   ⚡ Access token cleared but refresh token available');
        console.log('   → Attempting to restore session via auto-refresh...');
        
        const refreshSuccess = await refreshTokenInterceptor();
        
        if (refreshSuccess) {
          console.log('✅ ✅ ✅ SESSION RESTORED! User is logged back in.');
          console.log('   New access token saved to sessionStorage');
          console.log('   Starting session monitoring timers...');
          
          // ✅ NEW: Start timers NOW that we have a valid token
          startTokenRefreshHeartbeat();
          startProactiveRefreshTimer();
          initActivityListeners();
          
          console.log('═══════════════════════════════════════════\n');
        } else {
          console.error('❌ ❌ ❌ Could not restore session. Refresh failed.');
          console.error('   User will be redirected to login.');
          console.log('═══════════════════════════════════════════\n');
          sessionStorage.removeItem('refreshToken_session');
          navigate('/login');
        }
      } else if (accessToken && !refreshToken) {
        console.warn('⚠️ Access token exists but refresh token missing!');
        console.warn('   This is unusual. Token refresh will fail if access token expires.');
        console.log('═══════════════════════════════════════════\n');
      } else if (accessToken && refreshToken) {
        console.log('✅ Both tokens present - session intact');
        console.log('═══════════════════════════════════════════\n');
      } else {
        console.log('ℹ️ No tokens found - user not logged in');
        console.log('═══════════════════════════════════════════\n');
      }
    };
    
    // ✅ FIXED: Properly await rehydration with async IIFE
    (async () => {
      await rehydrateSession();
    })();
    
    // Subscribe to token expiry events
    const unsubscribe = tokenExpiryEmitter.subscribe((location) => {
      console.log('🔐 Token expiry detected, showing modal');
      setShowTokenExpiryModal(true);
    });

    // Initialize tab focus listener to ensure token refresh continues
    const removeFocusListener = initializeTabFocusListener();

    // Cleanup
    return () => {
      unsubscribe();
      removeFocusListener();
    };
  }, [setShowTokenExpiryModal]);

  // Global activity tracking for React components
  // This ensures activity is tracked even when document event listeners fail
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    // Track activity on major interactions
    const trackClickActivity = () => updateLastActivity();
    const trackKeyActivity = () => updateLastActivity();
    
    // Use React's event delegation by adding listeners to the main container
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('click', trackClickActivity);
      mainElement.addEventListener('keydown', trackKeyActivity);
      
      return () => {
        mainElement.removeEventListener('click', trackClickActivity);
        mainElement.removeEventListener('keydown', trackKeyActivity);
      };
    }
  }, []);

  const handleLoginRedirect = () => {
    setShowTokenExpiryModal(false);
    navigate('/login', { state: { returnTo: sessionStorage.getItem('tokenExpiryLocation') || '/' } });
  };

  return (
    <ErrorBoundary>
      <ModalProvider>
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
          <Route path="/patients" element={<ProtectedRoute><div className="max-w-6xl mx-auto"><Patients /></div></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><div className="max-w-6xl mx-auto"><Payments /></div></ProtectedRoute>} />
          <Route path="/service-billing" element={<ProtectedRoute><div className="max-w-6xl mx-auto"><ServiceBilling /></div></ProtectedRoute>} />
          <Route path="/patients/view" element={<ProtectedRoute><ViewPatients /></ProtectedRoute>} />
          <Route path="/patients/register" element={<ProtectedRoute><RegisterPatient /></ProtectedRoute>} />
          <Route path="/patients/edit" element={<ProtectedRoute><div className="max-w-6xl mx-auto"><EditPatients /></div></ProtectedRoute>} />
          <Route path="/patients/delete" element={<ProtectedRoute><div className="max-w-6xl mx-auto"><DeletePatients /></div></ProtectedRoute>} />
          <Route path="/patients/:operation" element={<ProtectedRoute><div className="max-w-6xl mx-auto"><CrudPage resourceType="patients" /></div></ProtectedRoute>} />
          <Route path="/services" element={<div className="max-w-6xl mx-auto"><Services /></div>} />
          <Route path="/services/:operation" element={<div className="max-w-6xl mx-auto"><CrudPage resource="Services" /></div>} />
          <Route path="/team-hub" element={<TeamHub />} />
          <Route path="/staff" element={<div className="max-w-6xl mx-auto"><Staff /></div>} />
          <Route path="/staff/:operation" element={<div className="max-w-6xl mx-auto"><CrudPage resource="Staff" /></div>} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/view" element={<ViewDoctors />} />
          <Route path="/doctors/clinic-mapping" element={<DoctorClinicMappingTeamHub />} />
          <Route path="/superadmin/clinic-mapping" element={<DoctorClinicMappingSuperAdmin />} />
          <Route path="/receptionists/onboard" element={<ReceptionistOnboarding />} />
          <Route path="/staff/onboard" element={<ReceptionistOnboarding />} />
          <Route path="/staff/details" element={<ViewStaffDetails />} />
          <Route path="/superadmin" element={<div className="max-w-6xl mx-auto"><SuperAdmin /></div>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/visits" element={<ProtectedRoute><VisitInformation /></ProtectedRoute>} />
          <Route path="/clinics/analytics" element={<ClinicAnalytics />} />
          <Route path="/reports" element={<ReportsAnalytics />} />
          <Route path="/salary" element={<SalaryManagement />} />
          <Route path="/salary/manage" element={<ManageSalaries />} />
          <Route path="/salary/doctor/:doctorId" element={<DoctorSalaryDetails />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/add-master" element={<AddMasterInventory />} />
          <Route path="/inventory/view-master" element={<ViewMasterInventory />} />
          <Route path="/inventory/clinic" element={<ClinicInventory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/camps" element={<Camps />} />
          <Route path="/camps/reports" element={<CampReports />} />
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
        <GlobalOnboardStaffModal />
        </div>
      </ModalProvider>
    </ErrorBoundary>
  );
}
