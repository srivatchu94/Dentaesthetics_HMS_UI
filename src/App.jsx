import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import ErrorPage from "./components/ErrorPage";
import ErrorBoundary from "./components/ErrorBoundary";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import Home from "./pages/Home";
import Clinics from "./pages/Clinics";
import CreateClinic from "./pages/CreateClinic";
import ViewClinics from "./pages/ViewClinics";
import Patients from "./pages/Patients";
import ViewPatients from "./pages/ViewPatients";
import EditPatients from "./pages/EditPatients";
import Services from "./pages/Services";
import Staff from "./pages/Staff";
import TeamHub from "./pages/TeamHub";
import Doctors from "./pages/Doctors";
import ViewDoctors from "./pages/ViewDoctors";
import DoctorClinicMapping from "./pages/DoctorClinicMapping";
import DeletePatients from "./pages/DeletePatients";
import CrudPage from "./pages/CrudPage";
import Calendar from "./pages/Calendar";
import VisitInformation from "./pages/VisitInformation";
import ClinicAnalytics from "./pages/ClinicAnalytics";
import ReportsAnalytics from "./pages/ReportsAnalytics";
import SalaryManagement from "./pages/SalaryManagement";
import DoctorSalaryDetails from "./pages/DoctorSalaryDetails";
import Footer from "./components/Footer";
import WhatsAppChatbot from "./components/WhatsAppChatbot";

export default function App(){
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-warmGray-50 to-teal-50/30">
        <Header />
        <main>
          <Routes>
          <Route path="/" element={<div className="max-w-6xl mx-auto"><Home /></div>} />
          <Route path="/clinics" element={<div className="max-w-6xl mx-auto"><Clinics /></div>} />
          <Route path="/clinics/create" element={<div className="max-w-6xl mx-auto"><CreateClinic /></div>} />
          <Route path="/clinics/view" element={<div className="max-w-6xl mx-auto"><ViewClinics /></div>} />
          <Route path="/clinics/:operation" element={<div className="max-w-6xl mx-auto"><CrudPage resource="Clinics" /></div>} />
          <Route path="/patients" element={<div className="max-w-6xl mx-auto"><Patients /></div>} />
          <Route path="/patients/view" element={<div className="max-w-6xl mx-auto"><ViewPatients /></div>} />
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
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/visits" element={<VisitInformation />} />
          <Route path="/clinics/analytics" element={<ClinicAnalytics />} />
          <Route path="/reports" element={<ReportsAnalytics />} />
          <Route path="/salary" element={<SalaryManagement />} />
          <Route path="/salary/doctor/:doctorId" element={<DoctorSalaryDetails />} />
          <Route path="/error-preview" element={<ErrorPage error={{ message: "This is a preview of the error page for testing purposes!" }} />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppChatbot />
      </div>
    </ErrorBoundary>
  );
}
