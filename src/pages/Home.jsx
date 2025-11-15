import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  const features = [
    { icon: "🏥", title: "Clinics Management", description: "Manage multiple dental clinics efficiently", path: "/clinics" },
    { icon: "👥", title: "Patient Records", description: "Keep comprehensive patient information", path: "/patients" },
    { icon: "🛠️", title: "Services", description: "Organize dental services and treatments", path: "/services" },
    { icon: "👔", title: "Staff Management", description: "Manage your dental team", path: "/staff" },
  ];

  const quickLinks = [
    { label: "Clinics", icon: "🏥", path: "/clinics" },
    { label: "Patients", icon: "👥", path: "/patients" },
    { label: "Services", icon: "🛠️", path: "/services" },
    { label: "Staff", icon: "👔", path: "/staff" },
  ];

  const socialMedia = [
    { platform: "Facebook", handle: "@DentaestheticsHMS", icon: "f", link: "https://facebook.com/DentaestheticsHMS" },
    { platform: "Twitter", handle: "@DentaHMS", icon: "𝕏", link: "https://twitter.com/DentaHMS" },
    { platform: "Instagram", handle: "@dentaesthetics_hms", icon: "📸", link: "https://instagram.com/dentaesthetics_hms" },
    { platform: "LinkedIn", handle: "Dentaesthetics HMS", icon: "in", link: "https://linkedin.com/company/dentaesthetics-hms" },
    { platform: "WhatsApp", handle: "+1 (555) 123-4567", icon: "💬", link: "https://wa.me/15551234567" },
    { platform: "Email", handle: "support@dentaesthetics.com", icon: "✉️", link: "mailto:support@dentaesthetics.com" },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 rounded-xl shadow-lg p-12 text-center"
      >
        <h1 className="text-5xl font-extrabold text-indigo-900 mb-4">Welcome to Dentaesthetics HMS</h1>
        <p className="text-xl text-indigo-800 mb-8">Your comprehensive Hospital Management System for dental clinics</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/clinics"
            className="px-8 py-3 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition-all font-bold shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
          <a
            href="#quicklinks"
            className="px-8 py-3 bg-white text-indigo-700 rounded-lg hover:bg-gray-100 transition-all font-bold shadow-lg hover:shadow-xl border-2 border-indigo-700"
          >
            Learn More
          </a>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-6"
      >
        <h2 className="text-4xl font-bold text-slate-900 text-center mb-10">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600 mb-6">{feature.description}</p>
              <Link
                to={feature.path}
                className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold"
              >
                Explore →
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Links Section */}
      <motion.div
        id="quicklinks"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl shadow-lg p-12"
      >
        <h2 className="text-4xl font-bold text-slate-900 text-center mb-10">Quick Navigation</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {quickLinks.map((link, idx) => (
            <Link
              key={idx}
              to={link.path}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all"
            >
              <span className="text-4xl mb-3">{link.icon}</span>
              <span className="text-center font-semibold text-slate-900">{link.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Social Media Support Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="space-y-6"
      >
        <h2 className="text-4xl font-bold text-slate-900 text-center mb-10">Get in Touch & Follow Us</h2>
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 rounded-xl shadow-lg p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {socialMedia.map((social, idx) => (
              <motion.a
                key={idx}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all hover:bg-slate-50"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{social.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{social.platform}</h3>
                    <p className="text-slate-600 text-sm break-all">{social.handle}</p>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
          <div className="mt-10 p-6 bg-white rounded-lg border-2 border-slate-200 text-center">
            <p className="text-slate-700 font-semibold mb-2">📞 Customer Support Hotline</p>
            <p className="text-2xl font-bold text-indigo-700">+1 (800) DENT-HMS</p>
            <p className="text-slate-600 mt-2">Available 24/7 for your inquiries</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          { label: "Active Clinics", value: "150+" },
          { label: "Patients Managed", value: "25K+" },
          { label: "Successful Cases", value: "10K+" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8 text-white text-center">
            <p className="text-4xl font-bold mb-2">{stat.value}</p>
            <p className="text-lg opacity-90">{stat.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
