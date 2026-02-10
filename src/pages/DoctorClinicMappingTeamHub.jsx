import React, { useEffect, useRef } from "react";
import DoctorClinicMappingSuperAdmin from "./DoctorClinicMappingSuperAdmin";
import { getSelectedAccess } from "../services/authService";

export default function DoctorClinicMappingTeamHub() {
  const containerRef = useRef(null);
  const appliedRef = useRef(false);

  useEffect(() => {
    const access = getSelectedAccess();
    const enterpriseId = access?.enterpriseId ? access.enterpriseId.toString() : "";
    if (!enterpriseId) return;

    const tryApplyEnterprise = () => {
      if (!containerRef.current || appliedRef.current) return;

      const selects = Array.from(containerRef.current.querySelectorAll("select"));
      const enterpriseSelect = selects.find((sel) => {
        const firstOptionText = sel?.options?.[0]?.textContent || "";
        return /select enterprise|loading enterprises/i.test(firstOptionText);
      });

      if (enterpriseSelect) {
        // Inject enterprise option if not present
        const hasOption = Array.from(enterpriseSelect.options).some(
          (opt) => opt.value === enterpriseId
        );
        if (!hasOption) {
          const opt = document.createElement("option");
          opt.value = enterpriseId;
          opt.textContent = `Enterprise ${enterpriseId}`;
          enterpriseSelect.appendChild(opt);
        }
        enterpriseSelect.value = enterpriseId;
        enterpriseSelect.dispatchEvent(new Event("change", { bubbles: true }));
        enterpriseSelect.disabled = true;
        appliedRef.current = true;
      }
    };

    tryApplyEnterprise();
    const observer = new MutationObserver(() => tryApplyEnterprise());
    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      <DoctorClinicMappingSuperAdmin />
    </div>
  );
}
