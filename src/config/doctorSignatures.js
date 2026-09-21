// Doctor signature images shown in the "Electronically signed by" block on
// printed/emailed prescriptions and invoices.
//
// Each doctor gets ONLY their own signature. A doctor with no entry here prints
// no signature image (never someone else's).
//
// Signatures are base64 data URIs (not bundled asset URLs) so they work
// everywhere the document travels: on-screen print, the PDF export
// (html2canvas), and emailed HTML (an emailed <img> can't point at a bundled
// asset URL).
import signature27909 from "./doctorSignatureData";

// Keyed by the doctor's registration / licence number OR internal doctorId,
// both as strings. To add a doctor:
//   import drKumarSignature from "./drKumarSignatureData";
//   ...and add  "12345": drKumarSignature  below.
const SIGNATURES = {
  "27909": signature27909,
};

// Pass the doctor object the document already has, plus any extra identifiers
// it has on hand (e.g. the registration number it is about to print).
export function getDoctorSignature(doctorInfo, ...extraIds) {
  const candidates = [
    doctorInfo?.registrationNumber,
    doctorInfo?.RegistrationNumber,
    doctorInfo?.licenseNumber,
    doctorInfo?.LicenseNumber,
    doctorInfo?.doctorId,
    doctorInfo?.DoctorId,
    ...extraIds,
  ];
  for (const c of candidates) {
    if (c == null || c === "") continue;
    const sig = SIGNATURES[String(c).trim()];
    if (sig) return sig;
  }
  return null;
}
