import React, { useEffect, useRef, useState } from "react";
import DoctorClinicMappingSuperAdmin from "./DoctorClinicMappingSuperAdmin";
import { getSelectedAccess } from "../services/authService";
import { listEnterprises } from "../services/enterpriseService";
import { getDoctorsForMapping } from "../services/doctorService";

export default function DoctorClinicMappingTeamHub() {
  const containerRef = useRef(null);
  const appliedRef = useRef(false);
  const [enterpriseLabel, setEnterpriseLabel] = useState("");
  const doctorIdLookupRef = useRef(new Map());

  useEffect(() => {
    const access = getSelectedAccess(); 
    const isSuperAdmin = Array.isArray(access?.roleIds) && access.roleIds.includes(1);
    const enterpriseId = access?.enterpriseId ? access.enterpriseId.toString() : "";
    if (isSuperAdmin) return;
    if (!enterpriseId) return;

    let mounted = true;
    listEnterprises()
      .then((data) => {
        if (!mounted) return;
        const enterprises = Array.isArray(data) ? data : [];
        const match = enterprises.find((enterprise) => {
          const id = enterprise.enterpriseId ?? enterprise.enterpriseID ?? enterprise.id;
          return parseInt(id, 10) === parseInt(enterpriseId, 10);
        });
        const name = match?.enterpriseName || match?.name || "";
        setEnterpriseLabel(name ? `${name} (${enterpriseId})` : `Enterprise ${enterpriseId}`);
      })
      .catch((error) => {
        console.error("Failed to load enterprises for label:", error);
        if (mounted) setEnterpriseLabel(`Enterprise ${enterpriseId}`);
      });

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
          opt.textContent = enterpriseLabel || `Enterprise ${enterpriseId}`;
          enterpriseSelect.appendChild(opt);
        }
        enterpriseSelect.value = enterpriseId;
        enterpriseSelect.dispatchEvent(new Event("change", { bubbles: true }));
        const container = enterpriseSelect.parentElement;
        if (container) {
          container.style.display = "none";
          container.setAttribute("aria-hidden", "true");
        } else {
          enterpriseSelect.style.display = "none";
          enterpriseSelect.setAttribute("aria-hidden", "true");
        }
        appliedRef.current = true;
      }
    };

    tryApplyEnterprise();
    const observer = new MutationObserver(() => tryApplyEnterprise());
    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }
    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const access = getSelectedAccess();
    const isSuperAdmin = Array.isArray(access?.roleIds) && access.roleIds.includes(1);
    const enterpriseId = access?.enterpriseId ? access.enterpriseId.toString() : "";
    if (isSuperAdmin || !enterpriseId) return;

    let mounted = true;
    getDoctorsForMapping({ enterpriseId })
      .then((data) => {
        if (!mounted) return;
        const docs = Array.isArray(data) ? data : [];
        const nextMap = new Map();
        docs.forEach((doc) => {
          const firstName = doc?.firstName || "";
          const lastName = doc?.lastName || "";
          const nameKey = `${firstName} ${lastName}`.trim().toLowerCase();
          if (!nameKey) return;
          const doctorId = doc?.doctorId ?? doc?.DoctorId ?? doc?.id ?? doc?.profileId ?? doc?.profileID ?? doc?.staffId ?? doc?.staffID;
          nextMap.set(nameKey, doctorId ? doctorId.toString() : "—");
        });
        doctorIdLookupRef.current = nextMap;
      })
      .catch((error) => {
        console.error("Failed to load doctor IDs for TeamHub:", error);
        if (mounted) doctorIdLookupRef.current = new Map();
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const updateDoctorIds = () => {
      if (!containerRef.current) return;
      if (doctorIdLookupRef.current.size === 0) return;

      const containers = Array.from(containerRef.current.querySelectorAll("button, div"));
      containers.forEach((container) => {
        const nameEl = container.querySelector("p.font-bold");
        const staffEl = Array.from(container.querySelectorAll("p")).find((p) => /Staff ID:/i.test(p.textContent || ""));
        if (!nameEl || !staffEl) return;

        const rawName = (nameEl.textContent || "").replace(/^Dr\.\s*/i, "").trim();
        if (!rawName) return;
        const lookupKey = rawName.toLowerCase();
        const doctorId = doctorIdLookupRef.current.get(lookupKey);
        if (!doctorId) return;

        staffEl.textContent = `Doctor ID: ${doctorId}`;
      });
    };

    updateDoctorIds();
    const observer = new MutationObserver(() => updateDoctorIds());
    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!enterpriseLabel) return;
    const access = getSelectedAccess();
    const enterpriseId = access?.enterpriseId ? access.enterpriseId.toString() : "";
    if (!enterpriseId || appliedRef.current) return;

    const tryApplyEnterprise = () => {
      if (!containerRef.current || appliedRef.current) return;

      const selects = Array.from(containerRef.current.querySelectorAll("select"));
      const enterpriseSelect = selects.find((sel) => {
        const firstOptionText = sel?.options?.[0]?.textContent || "";
        return /select enterprise|loading enterprises/i.test(firstOptionText);
      });

      if (enterpriseSelect) {
        const existingOption = Array.from(enterpriseSelect.options).find(
          (opt) => opt.value === enterpriseId
        );
        if (existingOption) {
          existingOption.textContent = enterpriseLabel;
        } else {
          const opt = document.createElement("option");
          opt.value = enterpriseId;
          opt.textContent = enterpriseLabel;
          enterpriseSelect.appendChild(opt);
        }
        enterpriseSelect.value = enterpriseId;
        enterpriseSelect.dispatchEvent(new Event("change", { bubbles: true }));
        const container = enterpriseSelect.parentElement;
        if (container) {
          container.style.display = "none";
          container.setAttribute("aria-hidden", "true");
        } else {
          enterpriseSelect.style.display = "none";
          enterpriseSelect.setAttribute("aria-hidden", "true");
        }
        appliedRef.current = true;
      }
    };

    tryApplyEnterprise();
  }, [enterpriseLabel]);

  return (
    <div ref={containerRef}>
      <DoctorClinicMappingSuperAdmin />
    </div>
  );
}
