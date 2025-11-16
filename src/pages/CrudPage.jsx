import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const OPERATION_DETAILS = {
  create: {
    title: "Create",
    icon: "➕",
    color: "from-green-400 to-green-600",
    description: "Add a new entry"
  },
  view: {
    title: "View",
    icon: "📋",
    color: "from-blue-400 to-blue-600",
    description: "View all entries"
  },
  update: {
    title: "Edit",
    icon: "✏️",
    color: "from-yellow-400 to-yellow-600",
    description: "Update an entry"
  },
  delete: {
    title: "Delete",
    icon: "🗑️",
    color: "from-red-400 to-red-600",
    description: "Remove an entry"
  }
};

export default function CrudPage({ resource }) {
  const { operation } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  
  const opDetails = OPERATION_DETAILS[operation] || {};

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`${opDetails.title} operation for ${resource}: ${JSON.stringify(formData)}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className={`w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gradient-to-r ${opDetails.color} shadow-lg px-6 md:px-12 py-8 text-white mb-6`}>
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <span className="text-5xl">{opDetails.icon}</span>
          <div>
            <h1 className="text-4xl font-bold">{opDetails.title} {resource}</h1>
            <p className="text-lg opacity-90">{opDetails.description}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {operation === "view" && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-slate-900">All {resource}</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-4 py-2 text-left font-semibold">ID</th>
                    <th className="border border-slate-300 px-4 py-2 text-left font-semibold">Name</th>
                    <th className="border border-slate-300 px-4 py-2 text-left font-semibold">Details</th>
                    <th className="border border-slate-300 px-4 py-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-slate-50">
                    <td className="border border-slate-300 px-4 py-2">1</td>
                    <td className="border border-slate-300 px-4 py-2">Sample {resource}</td>
                    <td className="border border-slate-300 px-4 py-2">Demo data</td>
                    <td className="border border-slate-300 px-4 py-2"><span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            </div>
          )}

          {operation === "create" && (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
            <h2 className="text-2xl font-bold text-slate-900">New {resource}</h2>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleInputChange}
                placeholder={`Enter ${resource} name`}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                placeholder="Enter description"
                rows="4"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
            >
              Create {resource}
            </button>
          </form>
        )}

        {operation === "update" && (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
            <h2 className="text-2xl font-bold text-slate-900">Edit {resource}</h2>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select ID</label>
              <input
                type="number"
                name="id"
                value={formData.id || ""}
                onChange={handleInputChange}
                placeholder="Enter ID to edit"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleInputChange}
                placeholder={`Update ${resource} name`}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                placeholder="Update description"
                rows="4"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
            >
              Update {resource}
            </button>
          </form>
        )}

        {operation === "delete" && (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
            <h2 className="text-2xl font-bold text-slate-900">Delete {resource}</h2>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700 font-semibold">⚠️ Warning: This action cannot be undone</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select ID to Delete</label>
              <input
                type="number"
                name="id"
                value={formData.id || ""}
                onChange={handleInputChange}
                placeholder="Enter ID to delete"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmation</label>
              <input
                type="text"
                name="confirmation"
                value={formData.confirmation || ""}
                onChange={handleInputChange}
                placeholder="Type 'CONFIRM' to proceed"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              type="submit"
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
            >
              Delete {resource}
            </button>
          </form>
        )}
        </div>
      </div>

      <button
        onClick={() => navigate(-1)}
        className="max-w-4xl mx-auto px-6 py-2 bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold rounded-lg transition-all"
      >
        ← Back
      </button>
    </div>
  );
}
