import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCampReports, getAllCamps } from "../services/campService";
import { getSelectedAccess } from "../services/authService";
import CampStatisticsModal from "../components/CampStatisticsModal";

export default function CampReports() {
  const [camps, setCamps] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCamps, setLoadingCamps] = useState(false);
  const [selectedCampId, setSelectedCampId] = useState();
  const [registrationDate, setRegistrationDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isStatisticsModalOpen, setIsStatisticsModalOpen] = useState(false);

  // Fetch camps on component mount
  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    setLoadingCamps(true);
    try {
      const selectedAccess = getSelectedAccess();
      let campsData = [];
      
      if (selectedAccess?.clinicId) {
        // Try to fetch camps by clinic ID
        try {
          const { getCampsByClinicId } = await import("../services/campService");
          campsData = await getCampsByClinicId(selectedAccess.clinicId);
        } catch (error) {
          console.log("Falling back to all camps");
          campsData = await getAllCamps();
        }
      } else {
        campsData = await getAllCamps();
      }
      
      setCamps(campsData || []);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(`Error fetching camps: ${error.message}`);
      console.error(error);
    } finally {
      setLoadingCamps(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedCampId && !registrationDate) {
      setErrorMessage("Please select at least a Camp or Registration Date");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      const data = await getCampReports(selectedCampId, registrationDate);
      setReports(data || []);
      setReportGenerated(true);
      
      if (data && data.length > 0) {
        setSuccessMessage(`✅ Report generated successfully! Found ${data.length} services.`);
      } else {
        setErrorMessage("No reports found for the selected criteria.");
        setReportGenerated(false);
      }
    } catch (error) {
      setErrorMessage(`Error generating report: ${error.message}`);
      setReportGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedCampId(undefined);
    setRegistrationDate("");
    setReports([]);
    setReportGenerated(false);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // PDF Export
  const handleDownloadPDF = () => {
    if (!reports || reports.length === 0) return;

    // Create a simple PDF using HTML to Canvas approach
    const htmlContent = generatePDFHTML();
    
    // Use window.print() for simplicity, but with styled HTML
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  // Excel Export
  const handleDownloadExcel = () => {
    if (!reports || reports.length === 0) return;

    const headers = ["Enterprise ID", "Clinic ID", "Service Name", "No. of Participants"];
    const rows = reports.map((report) => [
      report.enterpriseId,
      report.clinicId,
      report.serviceName,
      report.noOfParticipants,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `camp-report-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDFHTML = () => {
    const selectedCamp = camps.find((c) => c.campId === selectedCampId);
    const totalParticipants = reports.reduce((sum, r) => sum + r.noOfParticipants, 0);
    const totalServices = reports.length;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Camp Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .header p {
            margin: 5px 0;
            font-size: 14px;
          }
          .stats-container {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            flex-wrap: wrap;
          }
          .stat-box {
            flex: 1;
            min-width: 200px;
            background: #f8f9fa;
            padding: 20px;
            border-left: 4px solid #667eea;
            border-radius: 8px;
          }
          .stat-box h3 {
            margin: 0 0 10px 0;
            color: #667eea;
            font-size: 14px;
            text-transform: uppercase;
          }
          .stat-box .value {
            font-size: 32px;
            font-weight: bold;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
          }
          thead {
            background-color: #667eea;
            color: white;
          }
          th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #ddd;
          }
          td {
            padding: 12px 15px;
            border: 1px solid #ddd;
          }
          tbody tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          tbody tr:hover {
            background-color: #e9ecef;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Camp Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          ${selectedCamp ? `<p><strong>Camp:</strong> ${selectedCamp.campName}</p>` : ""}
          ${registrationDate ? `<p><strong>Registration Date:</strong> ${registrationDate}</p>` : ""}
        </div>

        <div class="stats-container">
          <div class="stat-box">
            <h3>Total Services</h3>
            <div class="value">${totalServices}</div>
          </div>
          <div class="stat-box">
            <h3>Total Participants</h3>
            <div class="value">${totalParticipants}</div>
          </div>
          <div class="stat-box">
            <h3>Avg Participants/Service</h3>
            <div class="value">${(totalParticipants / totalServices).toFixed(1)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Enterprise ID</th>
              <th>Clinic ID</th>
              <th>Service Name</th>
              <th>No. of Participants</th>
            </tr>
          </thead>
          <tbody>
            ${reports
              .map(
                (report) => `
              <tr>
                <td>${report.enterpriseId}</td>
                <td>${report.clinicId}</td>
                <td>${report.serviceName}</td>
                <td><strong>${report.noOfParticipants}</strong></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>This is an automatically generated report. For more details, contact your system administrator.</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 mb-8"
      >
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 rounded-2xl shadow-2xl p-8 text-white overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full -ml-40 -mb-40"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                  <span className="text-5xl">📊</span>
                  Camp Reports
                </h1>
                <p className="text-purple-100 text-lg">Generate, analyze, and export camp participation reports</p>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="text-7xl opacity-20"
              >
                📈
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Camp Statistics Tile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileHover={{ translateY: -8 }}
          onClick={() => setIsStatisticsModalOpen(true)}
          className="cursor-pointer mb-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white overflow-hidden relative group"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48 blur-xl"></div>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <span className="text-4xl animate-bounce">📊</span>
                Camp Statistics
              </h3>
              <p className="text-indigo-100 text-lg">
                Create beautiful statistics and reports for camp participation data with download & email options
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-lg text-sm font-semibold">
                  📈 Analytics
                </span>
                <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-lg text-sm font-semibold">
                  📧 Email Report
                </span>
                <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-lg text-sm font-semibold">
                  🖨️ Printable
                </span>
              </div>
            </div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-7xl opacity-30 group-hover:opacity-50 transition-opacity"
            >
              ⭐
            </motion.div>
          </div>

          {/* Click Indicator */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-4 right-4 text-sm font-semibold flex items-center gap-1"
          >
            Click to open <span className="text-lg">→</span>
          </motion.div>
        </motion.div>

        {/* Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-3xl">🔍</span>
            Search & Filter
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Camp Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                🏕️ Select Camp (Optional)
              </label>
              <select
                value={selectedCampId || ""}
                onChange={(e) => setSelectedCampId(e.target.value ? parseInt(e.target.value) : undefined)}
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
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                📅 Registration Date (Optional)
              </label>
              <input
                type="date"
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
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
                className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg"
              >
                <p className="text-red-700 font-medium">{errorMessage}</p>
              </motion.div>
            )}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-lg"
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
              onClick={handleGenerateReport}
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
                  Generate Report
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
              Reset Filters
            </motion.button>
          </div>
        </motion.div>

        {/* Reports Section */}
        <AnimatePresence>
          {reportGenerated && reports.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Panel */}
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
                      <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide mb-1">Total Services</p>
                      <h3 className="text-4xl font-bold">{reports.length}</h3>
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
                      <p className="text-green-100 text-sm font-semibold uppercase tracking-wide mb-1">Total Participants</p>
                      <h3 className="text-4xl font-bold">
                        {reports.reduce((sum, r) => sum + r.noOfParticipants, 0)}
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
                        {(
                          reports.reduce((sum, r) => sum + r.noOfParticipants, 0) / reports.length
                        ).toFixed(1)}
                      </h3>
                    </div>
                    <div className="text-5xl opacity-30">📈</div>
                  </div>
                </motion.div>
              </div>

              {/* Export Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-xl p-6"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">💾</span>
                  Export Options
                </h3>
                <div className="flex flex-wrap gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, translateY: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadPDF}
                    className="flex-1 min-w-[160px] px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">📄</span>
                    Print/PDF
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05, translateY: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadExcel}
                    className="flex-1 min-w-[160px] px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">📊</span>
                    Excel CSV
                  </motion.button>
                </div>
              </motion.div>

              {/* Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide">Enterprise ID</th>
                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide">Clinic ID</th>
                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide">Service Name</th>
                        <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wide">Participants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 + idx * 0.05 }}
                          className={`border-b transition-colors hover:bg-purple-50 ${
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="px-6 py-4 text-gray-800 font-medium">{report.enterpriseId}</td>
                          <td className="px-6 py-4 text-gray-800 font-medium">{report.clinicId}</td>
                          <td className="px-6 py-4 text-gray-800 font-medium">{report.serviceName}</td>
                          <td className="px-6 py-4 text-right">
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.5 + idx * 0.05 + 0.2 }}
                              className="inline-block bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-4 py-2 rounded-xl font-bold"
                            >
                              {report.noOfParticipants}
                            </motion.span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        <AnimatePresence>
          {!reportGenerated && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-xl p-16 text-center"
            >
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No Report Generated</h3>
              <p className="text-gray-600 text-lg mb-6">
                Select a camp or registration date and click "Generate Report" to view camp statistics
              </p>
              <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-6 py-3 rounded-xl font-medium">
                <span>💡</span>
                At least one filter is required to generate a report
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Camp Statistics Modal */}
      <CampStatisticsModal
        isOpen={isStatisticsModalOpen}
        onClose={() => setIsStatisticsModalOpen(false)}
      />
    </div>
  );
}
