import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCampReports, getCampsByClinicId } from "../services/campService";
import { getSelectedAccess } from "../services/authService";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const CampStatisticsModal = ({ isOpen, onClose }) => {
  const [camps, setCamps] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [userServiceMapping, setUserServiceMapping] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCamps, setLoadingCamps] = useState(false);
  const [selectedCampId, setSelectedCampId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statsGenerated, setStatsGenerated] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Fetch camps on component mount
  useEffect(() => {
    if (isOpen) {
      fetchCamps();
    }
  }, [isOpen]);

  const fetchCamps = async () => {
    setLoadingCamps(true);
    try {
      const selectedAccess = getSelectedAccess();

      if (!selectedAccess?.clinicId) {
        setErrorMessage("Unable to load camps. Please refresh the page and try again.");
        setLoadingCamps(false);
        return;
      }

      const campsData = await getCampsByClinicId(selectedAccess.clinicId);
      setCamps(campsData || []);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Unable to load camps at this moment. Please try again later.");
      console.error(error);
    } finally {
      setLoadingCamps(false);
    }
  };

  const handleGenerateStatistics = async () => {
    // Validate that at least one filter is selected
    if (!selectedCampId && !selectedDate) {
      setErrorMessage("Please select at least a Camp or Registration Date");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const campIdParam = selectedCampId ? parseInt(selectedCampId) : undefined;
      const dateParam = selectedDate || undefined;
      
      const data = await getCampReports(campIdParam, dateParam);

      if (data && data.length > 0) {
        // Process data with format: {ServiceName, NoOfParticipants}
        const statsArray = data.map(item => ({
          serviceName: item.serviceName || item.ServiceName,
          noOfParticipants: item.noOfParticipants || item.NoOfParticipants,
        }));
        
        setStatistics(statsArray);
        setUserServiceMapping([]);
        setStatsGenerated(true);
        
        const totalUsers = statsArray.reduce((sum, stat) => sum + stat.noOfParticipants, 0);
        setSuccessMessage(`✅ Statistics generated successfully! ${totalUsers} participants across ${statsArray.length} services.`);
      } else {
        setErrorMessage("No camp registrations found for the selected criteria. Please try different filters or create new registrations.");
        setStatsGenerated(false);
      }
    } catch (error) {
      // User-friendly error messages based on error type
      let userMessage = "Unable to generate statistics. Please try again.";
      
      if (error.message && error.message.includes("404")) {
        userMessage = "The statistics service is temporarily unavailable. Please try again later.";
      } else if (error.message && error.message.includes("500")) {
        userMessage = "An issue occurred while processing your request. Please try again.";
      } else if (error.message && error.message.includes("Network")) {
        userMessage = "Connection issue detected. Please check your internet and try again.";
      }
      
      setErrorMessage(userMessage);
      setStatsGenerated(false);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedCampId("");
    setSelectedDate("");
    setStatistics([]);
    setStatsGenerated(false);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const getColorByIndex = (index) => {
    const colors = [
      { bg: "from-blue-500 to-blue-600", text: "text-blue-600", light: "bg-blue-50" },
      { bg: "from-purple-500 to-purple-600", text: "text-purple-600", light: "bg-purple-50" },
      { bg: "from-pink-500 to-rose-600", text: "text-pink-600", light: "bg-pink-50" },
      { bg: "from-green-500 to-emerald-600", text: "text-green-600", light: "bg-green-50" },
      { bg: "from-orange-500 to-red-600", text: "text-orange-600", light: "bg-orange-50" },
      { bg: "from-cyan-500 to-blue-600", text: "text-cyan-600", light: "bg-cyan-50" },
    ];
    return colors[index % colors.length];
  };

  const generatePDFReport = async () => {
    const element = document.getElementById("statistics-report");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210 - 20; // A4 width minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(img, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`camp-statistics-${new Date().toISOString().split("T")[0]}.pdf`);
      setSuccessMessage("✅ PDF downloaded successfully!");
    } catch (error) {
      setErrorMessage("Unable to generate PDF. Please try again.");
      console.error(error);
    }
  };

  const generateCSVReport = () => {
    if (!statistics || statistics.length === 0) return;

    try {
      const totalUsers = statistics.reduce((sum, stat) => sum + stat.noOfParticipants, 0);

      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summaryData = [
        ['Camp Statistics Report'],
        ['Generated on', new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()],
        [''],
        ['Service Name', 'Total Participants', 'Percentage'],
        ...statistics.map(stat => [
          stat.serviceName,
          stat.noOfParticipants,
          ((stat.noOfParticipants / totalUsers) * 100).toFixed(2) + '%'
        ])
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Sheet 2: Detailed Stats
      const detailsData = [
        ['Service Name', 'Participants', 'Percentage', 'Total Users'],
        ...statistics.map(stat => [
          stat.serviceName,
          stat.noOfParticipants,
          ((stat.noOfParticipants / totalUsers) * 100).toFixed(2) + '%',
          totalUsers
        ])
      ];
      const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);
      XLSX.utils.book_append_sheet(wb, detailsSheet, 'Details');

      // Generate file
      XLSX.writeFile(wb, `camp-statistics-${new Date().toISOString().split('T')[0]}.xlsx`);
      setSuccessMessage("✅ Excel file downloaded successfully!");
    } catch (error) {
      setErrorMessage("Unable to generate Excel file. Please try again.");
      console.error(error);
    }
  };

  const generateEmailContent = () => {
    const selectedCamp = camps.find((c) => c.campId === parseInt(selectedCampId));
    const totalUsers = statistics.reduce((sum, s) => sum + s.noOfParticipants, 0);

    return `
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
            .container { max-width: 900px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 28px; }
            .stats { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
            .stat-box { flex: 1; min-width: 200px; background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; border-radius: 8px; }
            .stat-box h3 { margin: 0 0 10px 0; color: #667eea; font-size: 14px; text-transform: uppercase; }
            .stat-box .value { font-size: 32px; font-weight: bold; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            thead { background-color: #667eea; color: white; }
            th { padding: 15px; text-align: left; font-weight: 600; border: 1px solid #ddd; }
            td { padding: 12px 15px; border: 1px solid #ddd; }
            tbody tr:nth-child(even) { background-color: #f8f9fa; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Camp Statistics Report</h1>
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              ${selectedCamp ? `<p><strong>Camp:</strong> ${selectedCamp.campName}</p>` : ""}
              ${selectedDate ? `<p><strong>Registration Date:</strong> ${selectedDate}</p>` : ""}
            </div>

            <div class="stats">
              <div class="stat-box">
                <h3>Total Services</h3>
                <div class="value">${statistics.length}</div>
              </div>
              <div class="stat-box">
                <h3>Total Participants</h3>
                <div class="value">${totalUsers}</div>
              </div>
              <div class="stat-box">
                <h3>Avg Participants/Service</h3>
                <div class="value">${(totalUsers / statistics.length).toFixed(1)}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Total Participants</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${statistics.map(stat => `
                  <tr>
                    <td><strong>${stat.serviceName}</strong></td>
                    <td>${stat.noOfParticipants}</td>
                    <td>${((stat.noOfParticipants / totalUsers) * 100).toFixed(2)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              <p>This is an automatically generated report. For more details, contact your system administrator.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleSendEmail = async () => {
    if (!emailAddress) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setSendingEmail(true);
    try {
      const emailContent = generateEmailContent();

      // Call email service
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailAddress,
          subject: `Camp Statistics Report - ${new Date().toLocaleDateString()}`,
          htmlContent: emailContent,
        }),
      });

      if (response.ok) {
        setSuccessMessage(`✅ Report sent successfully to ${emailAddress}`);
        setShowEmailInput(false);
        setEmailAddress("");
      } else {
        setErrorMessage("Unable to send email at this moment. Please try again later.");
      }
    } catch (error) {
      setErrorMessage("Unable to send email. Please check your internet connection and try again.");
      console.error(error);
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePrint = () => {
    const element = document.getElementById("statistics-report");
    if (!element) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Camp Statistics Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 20px; }
            .container { max-width: 900px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
            .header h1 { margin: 0 0 10px 0; font-size: 28px; }
            .header p { margin: 5px 0; font-size: 14px; }
            .stats { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
            .stat-box { flex: 1; min-width: 180px; background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; border-radius: 8px; }
            .stat-box h3 { margin: 0 0 10px 0; color: #667eea; font-size: 14px; text-transform: uppercase; }
            .stat-box .value { font-size: 32px; font-weight: bold; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            thead { background-color: #667eea; color: white; }
            th { padding: 15px; text-align: left; font-weight: 600; border: 1px solid #ddd; }
            td { padding: 12px 15px; border: 1px solid #ddd; }
            tbody tr:nth-child(even) { background-color: #f8f9fa; }
            tbody tr:hover { background-color: #e9ecef; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="container">
            ${element.innerHTML}
          </div>
        </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 text-white p-8 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                      <span className="text-4xl">📊</span>
                      Camp Statistics
                    </h2>
                    <p className="text-purple-100">Generate beautiful camp participation statistics</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="text-2xl hover:bg-purple-700 rounded-full p-2 transition"
                  >
                    ✕
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Filter Section */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-2xl">🔍</span>
                    Select Filters (Choose at least one)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Camp Selection */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                        🏕️ Select Camp
                      </label>
                      <select
                        value={selectedCampId}
                        onChange={(e) => setSelectedCampId(e.target.value)}
                        disabled={loadingCamps}
                        className="w-full px-4 py-3 bg-white border-2 border-purple-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {loadingCamps ? "Loading camps..." : "Select a Camp"}
                        </option>
                        {camps.map((camp) => (
                          <option key={camp.campId} value={camp.campId || ""}>
                            {camp.campName} ({new Date(camp.campDate).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </motion.div>

                    {/* Date Selection */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                        📅 Registration Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-indigo-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                      />
                    </motion.div>
                  </div>

                  {/* Alert Messages */}
                  <AnimatePresence>
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"
                      >
                        <p className="text-red-700 font-medium">{errorMessage}</p>
                      </motion.div>
                    )}
                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg"
                      >
                        <p className="text-green-700 font-medium">{successMessage}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05, translateY: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGenerateStatistics}
                      disabled={loading || loadingCamps}
                      className="flex-1 min-w-[200px] px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <span>📊</span>
                          Generate Statistics
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05, translateY: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleResetFilters}
                      className="flex-1 min-w-[200px] px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl shadow-lg hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
                    >
                      <span>🔄</span>
                      Reset
                    </motion.button>
                  </div>
                </div>

                {/* Statistics Display */}
                <AnimatePresence>
                  {statsGenerated && statistics.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      id="statistics-report"
                      className="space-y-6"
                    >
                      {/* Top Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          whileHover={{ translateY: -8 }}
                          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide mb-1">
                                Total Services
                              </p>
                              <h3 className="text-4xl font-bold">{statistics.length}</h3>
                            </div>
                            <div className="text-5xl opacity-30">🏥</div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          whileHover={{ translateY: -8 }}
                          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-100 text-sm font-semibold uppercase tracking-wide mb-1">
                                Total Participants
                              </p>
                              <h3 className="text-4xl font-bold">
                                {statistics.reduce((sum, s) => sum + s.noOfParticipants, 0)}
                              </h3>
                            </div>
                            <div className="text-5xl opacity-30">👥</div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          whileHover={{ translateY: -8 }}
                          className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl p-6 text-white"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-orange-100 text-sm font-semibold uppercase tracking-wide mb-1">
                                Avg Participants/Service
                              </p>
                              <h3 className="text-4xl font-bold">
                                {statistics.length > 0
                                  ? (statistics.reduce((sum, s) => sum + s.noOfParticipants, 0) / statistics.length).toFixed(1)
                                  : 0}
                              </h3>
                            </div>
                            <div className="text-5xl opacity-30">📈</div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Service Details Grid */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                          <span className="text-2xl">💊</span>
                          Services & Participants Breakdown
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {statistics.map((stat, index) => {
                            const colors = getColorByIndex(index);
                            const totalParticipants = statistics.reduce((sum, s) => sum + s.noOfParticipants, 0);
                            const percentage = (
                              (stat.noOfParticipants / totalParticipants) * 100
                            ).toFixed(1);

                            return (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 + index * 0.05 }}
                                whileHover={{ translateY: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                                className={`bg-gradient-to-br ${colors.bg} rounded-2xl shadow-lg p-6 text-white cursor-pointer`}
                              >
                                <h4 className="font-bold text-lg mb-4 line-clamp-2">{stat.serviceName}</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold opacity-90">Participants</span>
                                    <span className="text-2xl font-bold">{stat.noOfParticipants}</span>
                                  </div>
                                  <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      transition={{ duration: 1, delay: 0.3 + index * 0.05 }}
                                      className="h-full bg-white/80 rounded-full"
                                    />
                                  </div>
                                  <div className="text-xs opacity-75">{percentage}% of total</div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Data Table */}
                      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
                                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide">
                                  Service Name
                                </th>
                                <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wide">
                                  Participants
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wide">
                                  Percentage
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {statistics.map((stat, idx) => {
                                const totalParticipants = statistics.reduce((sum, s) => sum + s.noOfParticipants, 0);
                                const percentage = ((stat.noOfParticipants / totalParticipants) * 100).toFixed(1);

                                return (
                                  <motion.tr
                                    key={idx}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 + idx * 0.05 }}
                                    className={`border-b transition-colors hover:bg-purple-50 ${
                                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                    }`}
                                  >
                                    <td className="px-6 py-4 text-gray-800 font-semibold">{stat.serviceName}</td>
                                    <td className="px-6 py-4 text-right">
                                      <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.5 + idx * 0.05 + 0.2 }}
                                        className="inline-block bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-4 py-2 rounded-xl font-bold"
                                      >
                                        {stat.noOfParticipants}
                                      </motion.span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-semibold text-gray-700">
                                      {percentage}%
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Export Options */}
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                          <span className="text-2xl">💾</span>
                          Export & Share Options
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <motion.button
                            whileHover={{ scale: 1.05, translateY: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={generatePDFReport}
                            className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/50 transition-all flex flex-col items-center gap-2"
                          >
                            <span className="text-2xl">📄</span>
                            <span className="text-xs">PDF</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05, translateY: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={generateCSVReport}
                            className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/50 transition-all flex flex-col items-center gap-2"
                          >
                            <span className="text-2xl">📊</span>
                            <span className="text-xs">Excel</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05, translateY: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePrint}
                            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/50 transition-all flex flex-col items-center gap-2"
                          >
                            <span className="text-2xl">🖨️</span>
                            <span className="text-xs">Print</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05, translateY: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowEmailInput(!showEmailInput)}
                            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all flex flex-col items-center gap-2"
                          >
                            <span className="text-2xl">📧</span>
                            <span className="text-xs">Email</span>
                          </motion.button>
                        </div>

                        {/* Email Input */}
                        <AnimatePresence>
                          {showEmailInput && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="mt-4 flex gap-2"
                            >
                              <input
                                type="email"
                                placeholder="Enter email address"
                                value={emailAddress}
                                onChange={(e) => setEmailAddress(e.target.value)}
                                className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                              />
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSendEmail}
                                disabled={sendingEmail}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {sendingEmail ? "Sending..." : "Send"}
                              </motion.button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty State */}
                <AnimatePresence>
                  {!statsGenerated && !loading && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-12 text-center"
                    >
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">No Statistics Generated</h3>
                      <p className="text-gray-600 text-lg mb-6">
                        Select a camp or registration date and click "Generate Statistics" to view beautiful camp statistics
                      </p>
                      <div className="inline-flex items-center gap-2 bg-white text-purple-700 px-6 py-3 rounded-xl font-medium shadow-lg">
                        <span>💡</span>
                        At least one filter is required to generate statistics
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CampStatisticsModal;
