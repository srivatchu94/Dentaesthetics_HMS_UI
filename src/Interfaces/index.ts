export type { ClinicModel } from "./ClinicModel";
export type { StaffModel } from "./StaffModel";
export type { ServiceModel } from "./ServiceModel";
export type { EnterpriseModel } from "./EnterpriseModel";
export type { EnterpriseDataModel } from "./EnterpriseDataModel";
export type { StaffDetailsModel } from "./StaffDetailsModel";
export type { DoctorProfileModel } from "./DoctorProfileModel";
export type { DoctorClinicMapping } from "./DoctorClinicMappingModel";
export type { DentalServiceModel } from "./DentalServiceModel";
export type { ClinicalSpecialtyModel } from "./ClinicalSpecialtyModel";
export type { RoleModel } from "./RoleModel";
export type { AccessControlModel, CreateAccessControlDto, BulkAssignRolesDto, UpdateAccessControlDto, AccessControlWithDetails } from "./AccessControlModel";

// Authentication models
export type { RegisterRequest, LoginRequest, AuthResponse, UserCredentialModel } from "./AuthModels";

// Patient-related interfaces matching API models
export type { Patient, PatientDataModel } from "./PatientModel";
export type { PatientContact } from "./PatientContactModel";
export type { PatientMedicalInfo } from "./PatientMedicalInfoModel";
export type { PatientInsurance } from "./PatientInsuranceModel";
export type { PatientVisitInformation } from "./PatientVisitInformationModel";
export type { Prescription } from "./PrescriptionModel";
export type { DoctorSalaryInfo, PatientTreatmentRecord, SalaryCalculation, SalaryPaymentRecord, SalaryHistoryRecord } from "./SalaryModel";
export type { AppointmentsModel } from "./AppointmentsModel";

// Inventory models
export type { 
  InventoryMaster, 
  ClinicInventory, 
  Supplier, 
  SupplierItemMapping,
  CreateInventoryMasterDto,
  UpdateInventoryMasterDto,
  CreateClinicInventoryDto,
  UpdateClinicInventoryDto,
  CreateSupplierDto,
  UpdateSupplierDto
} from "./InventoryModel";
