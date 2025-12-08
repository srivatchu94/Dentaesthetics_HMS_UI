import React, { useState, useEffect } from 'react';
import { getUserAccess, getSelectedAccess, setSelectedAccess } from '../services/authService';

/**
 * AccessSelector Component
 * Allows users to switch between different enterprise/clinic combinations
 * Shows current selection and provides dropdown to change
 */
export default function AccessSelector() {
  const [userAccess, setUserAccess] = useState([]);
  const [selectedAccess, setSelected] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Load user access rights
    const access = getUserAccess();
    setUserAccess(access);

    // Load currently selected access
    const current = getSelectedAccess();
    setSelected(current);
  }, []);

  const handleAccessChange = (enterpriseId, clinicId) => {
    setSelectedAccess(enterpriseId, clinicId);
    setSelected({ enterpriseId, clinicId });
    setShowDropdown(false);
    
    // Optionally refresh page to reload data with new context
    // window.location.reload();
  };

  // Don't show if user has no access or only one access
  if (!userAccess || userAccess.length <= 1) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
      >
        <span className="text-sm font-semibold">
          🏢 Enterprise {selectedAccess?.enterpriseId} | 🏥 Clinic {selectedAccess?.clinicId}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border-2 border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-t-lg">
            <h3 className="font-bold text-sm">Switch Access Context</h3>
            <p className="text-xs opacity-90">Select Enterprise & Clinic</p>
          </div>
          
          <div className="p-2">
            {userAccess.map((access, index) => {
              const isSelected = 
                selectedAccess?.enterpriseId === access.enterpriseId && 
                selectedAccess?.clinicId === access.clinicId;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAccessChange(access.enterpriseId, access.clinicId)}
                  className={`w-full p-3 mb-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-teal-100 to-cyan-100 border-2 border-teal-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-800">
                          🏢 Enterprise {access.enterpriseId}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-sm font-bold text-gray-800">
                          🏥 Clinic {access.clinicId}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs text-gray-600">Roles:</span>
                        {access.roleIds.map((roleId) => (
                          <span
                            key={roleId}
                            className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold"
                          >
                            {roleId}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center justify-center w-8 h-8 bg-teal-500 text-white rounded-full">
                        <span className="text-lg">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              ℹ️ API requests will use selected Enterprise & Clinic context
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
