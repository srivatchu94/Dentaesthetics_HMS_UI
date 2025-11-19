import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WhatsAppChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [appointmentData, setAppointmentData] = useState({
    name: "",
    phone: "",
    email: "",
    preferredDate: "",
    preferredTime: "",
    reason: "",
    clinicId: ""
  });

  const clinics = [
    { id: 1, name: "Downtown Dental Clinic" },
    { id: 2, name: "Westside Dental Care" },
    { id: 3, name: "Eastwood Dental Center" }
  ];

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
  ];

  const steps = [
    {
      question: "👋 Hello! I'm your dental appointment assistant. What's your name?",
      field: "name",
      type: "text",
      placeholder: "Enter your full name"
    },
    {
      question: "📞 Great! What's your phone number?",
      field: "phone",
      type: "tel",
      placeholder: "+1 (555) 123-4567"
    },
    {
      question: "📧 Please provide your email address",
      field: "email",
      type: "email",
      placeholder: "your.email@example.com"
    },
    {
      question: "🏥 Which clinic would you like to visit?",
      field: "clinicId",
      type: "select",
      options: clinics
    },
    {
      question: "📅 When would you like to schedule your appointment?",
      field: "preferredDate",
      type: "date",
      placeholder: ""
    },
    {
      question: "🕐 What time works best for you?",
      field: "preferredTime",
      type: "select-time",
      options: timeSlots
    },
    {
      question: "🦷 What's the reason for your visit?",
      field: "reason",
      type: "textarea",
      placeholder: "e.g., Routine checkup, Tooth pain, Cleaning..."
    }
  ];

  const handleInputChange = (field, value) => {
    setAppointmentData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    const currentField = steps[step].field;
    if (!appointmentData[currentField]) {
      alert("Please fill in this field before continuing");
      return;
    }
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    const selectedClinic = clinics.find(c => c.id === parseInt(appointmentData.clinicId));
    const message = `*New Appointment Request*%0A%0A` +
      `👤 *Name:* ${appointmentData.name}%0A` +
      `📞 *Phone:* ${appointmentData.phone}%0A` +
      `📧 *Email:* ${appointmentData.email}%0A` +
      `🏥 *Clinic:* ${selectedClinic?.name}%0A` +
      `📅 *Date:* ${appointmentData.preferredDate}%0A` +
      `🕐 *Time:* ${appointmentData.preferredTime}%0A` +
      `🦷 *Reason:* ${appointmentData.reason}`;

    const whatsappUrl = `https://wa.me/15551234567?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    // Reset form
    setAppointmentData({
      name: "",
      phone: "",
      email: "",
      preferredDate: "",
      preferredTime: "",
      reason: "",
      clinicId: ""
    });
    setStep(0);
    setIsOpen(false);
  };

  const handleReset = () => {
    setAppointmentData({
      name: "",
      phone: "",
      email: "",
      preferredDate: "",
      preferredTime: "",
      reason: "",
      clinicId: ""
    });
    setStep(0);
  };

  return (
    <>
      {/* WhatsApp Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-teal-500 to-sage-500 rounded-full shadow-teal flex items-center justify-center text-white text-3xl hover:scale-110 transition-all z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Book Appointment via WhatsApp"
      >
        {isOpen ? "✕" : "💬"}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-slate-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-sage-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
                  🦷
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Dentaesthetics Bot</h3>
                  <p className="text-xs text-green-100">Book your appointment</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-100 h-2">
              <motion.div
                className="bg-gradient-to-r from-teal-500 to-sage-500 h-full"
                initial={{ width: "0%" }}
                animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Chat Content */}
            <div className="p-6 max-h-96 overflow-y-auto bg-slate-50">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Bot Message */}
                  <div className="mb-4">
                    <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-slate-200 inline-block max-w-[85%]">
                      <p className="text-sm text-slate-700">{steps[step].question}</p>
                    </div>
                  </div>

                  {/* Input Field */}
                  <div className="space-y-3">
                    {steps[step].type === "text" || steps[step].type === "tel" || steps[step].type === "email" ? (
                      <input
                        type={steps[step].type}
                        value={appointmentData[steps[step].field]}
                        onChange={(e) => handleInputChange(steps[step].field, e.target.value)}
                        placeholder={steps[step].placeholder}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition text-sm"
                        autoFocus
                      />
                    ) : steps[step].type === "date" ? (
                      <input
                        type="date"
                        value={appointmentData[steps[step].field]}
                        onChange={(e) => handleInputChange(steps[step].field, e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition text-sm"
                        autoFocus
                      />
                    ) : steps[step].type === "textarea" ? (
                      <textarea
                        value={appointmentData[steps[step].field]}
                        onChange={(e) => handleInputChange(steps[step].field, e.target.value)}
                        placeholder={steps[step].placeholder}
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition text-sm resize-none"
                        autoFocus
                      />
                    ) : steps[step].type === "select" ? (
                      <div className="space-y-2">
                        {steps[step].options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleInputChange(steps[step].field, option.id.toString())}
                            className={`w-full px-4 py-3 rounded-xl text-left text-sm font-medium transition ${
                              appointmentData[steps[step].field] === option.id.toString()
                                ? "bg-green-500 text-white shadow-md"
                                : "bg-white border border-slate-300 text-slate-700 hover:border-green-400"
                            }`}
                          >
                            {option.name}
                          </button>
                        ))}
                      </div>
                    ) : steps[step].type === "select-time" ? (
                      <div className="grid grid-cols-2 gap-2">
                        {steps[step].options.map((time) => (
                          <button
                            key={time}
                            onClick={() => handleInputChange(steps[step].field, time)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                              appointmentData[steps[step].field] === time
                                ? "bg-green-500 text-white shadow-md"
                                : "bg-white border border-slate-300 text-slate-700 hover:border-green-400"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
              {step > 0 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition text-sm"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-sage-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-sage-600 transition text-sm shadow-teal"
              >
                {step < steps.length - 1 ? "Next →" : "Send via WhatsApp 💬"}
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 text-slate-500 hover:text-slate-700 transition text-sm"
                title="Reset"
              >
                🔄
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
