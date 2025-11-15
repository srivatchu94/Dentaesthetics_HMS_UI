import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Clinics from "./pages/Clinics";
import Patients from "./pages/Patients";
import Services from "./pages/Services";
import Staff from "./pages/Staff";
import CrudPage from "./pages/CrudPage";
import Footer from "./components/Footer";

export default function App(){
  return (
    <div className="app-container">
      <Header />
      <main className="max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clinics" element={<Clinics />} />
          <Route path="/clinics/:operation" element={<CrudPage resource="Clinics" />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:operation" element={<CrudPage resource="Patients" />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:operation" element={<CrudPage resource="Services" />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/staff/:operation" element={<CrudPage resource="Staff" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
