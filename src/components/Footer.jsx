import React from "react";
import { Link } from "react-router-dom";
import dhanthaLogo from "../assets/dhantha-logo.svg";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: "Home", path: "/" },
    { label: "Clinics", path: "/clinics" },
    { label: "Patients", path: "/patients" },
    { label: "Services", path: "/services" },
    { label: "Staff", path: "/staff" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", path: "#privacy" },
    { label: "Terms & Conditions", path: "#terms" },
    { label: "Contact Us", path: "#contact" },
  ];

  return (
    <footer className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mt-16 bg-gradient-to-r from-warmGray-800 via-warmGray-900 to-warmGray-800 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <img src={dhanthaLogo} alt="Dhantha Logo" className="w-10 h-10 drop-shadow-lg" />
              <div>
                <h3 className="text-xl font-black tracking-tight" style={{
                  background: 'linear-gradient(135deg, #2dd4bf 0%, #00d4ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  DHANTHA
                </h3>
                <p className="text-xs font-bold tracking-wide" style={{
                  background: 'linear-gradient(90deg, #06b6d4, #2dd4bf)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  The Dental Company
                </p>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">Your trusted dental clinic with excellence in care and aesthetics</p>
            <p className="text-xs font-semibold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">✨ Nature of Elegance ✨</p>
            <div className="flex gap-3 pt-2">
              <a
                href="https://facebook.com/Dhantha"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center transition-all hover:scale-110"
                title="Facebook"
              >
                f
              </a>
              <a
                href="https://twitter.com/DhanthaClinic"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-400 hover:bg-blue-500 rounded-full flex items-center justify-center transition-all hover:scale-110"
                title="Twitter"
              >
                𝕏
              </a>
              <a
                href="https://instagram.com/dhantha_clinic"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-pink-600 hover:bg-pink-700 rounded-full flex items-center justify-center transition-all hover:scale-110"
                title="Instagram"
              >
                📸
              </a>
              <a
                href="https://linkedin.com/company/dhantha-dental"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-700 hover:bg-blue-800 rounded-full flex items-center justify-center transition-all hover:scale-110"
                title="LinkedIn"
              >
                in
              </a>
              <a
                href="https://wa.me/15551234567"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-all hover:scale-110"
                title="WhatsApp"
              >
                💬
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold">Quick Links</h4>
            <ul className="space-y-2">
              {footerLinks.map((link, idx) => (
                <li key={idx}>
                  <Link to={link.path} className="text-slate-300 hover:text-white transition-all hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold">Support</h4>
            <ul className="space-y-2 text-slate-300">
              <li className="hover:text-white transition-all cursor-pointer">📞 +1 (800) DHANTHA</li>
              <li className="hover:text-white transition-all cursor-pointer">✉️ support@dhantha.com</li>
              <li className="hover:text-white transition-all cursor-pointer">💬 24/7 Live Chat</li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold">Legal</h4>
            <ul className="space-y-2">
              {legalLinks.map((link, idx) => (
                <li key={idx}>
                  <a href={link.path} className="text-slate-300 hover:text-white transition-all hover:underline">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400">
              © {currentYear} Dhantha - The Dental Company. All rights reserved.
            </p>
            <p className="text-slate-400">
              Made with <span className="text-red-500">❤️</span> for better dental care
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
