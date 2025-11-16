import { useEffect, useState, useCallback } from "react";
import {
  listClinics,
  getClinic,
  listStaff,
  getStaff,
  listServices,
  getService,
  getEnterpriseData,
  getEnterprise,
  createClinic,
  updateClinic,
  deleteClinic,
  createStaff,
  updateStaff,
  deleteStaff,
  createService,
  updateService,
  deleteService
} from "./hmsApi";
import type { ClinicModel, StaffModel, ServiceModel, EnterpriseDataModel, ClinicalSpecialtyModel, RoleModel } from "../Interfaces";
import type {
  CreateClinicDto,
  UpdateClinicDto,
  CreateStaffDto,
  UpdateStaffDto,
  CreateServiceDto,
  UpdateServiceDto
} from "./hmsApi";
import type { DoctorProfileModel } from "../Interfaces/DoctorProfileModel";
import type { StaffDetailsModel } from "../Interfaces/StaffDetailsModel";
import { listDoctorProfiles, getDoctorProfile, listStaffDetails, getStaffDetail, listClinicalSpecialties, getClinicalSpecialty, createClinicalSpecialty, updateClinicalSpecialty, deleteClinicalSpecialty, listRoles, getRole, createRole, updateRole, deleteRole } from "./hmsApi";
import type { EnterpriseModel } from "../Interfaces";

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

function useAsync<T>(fn: () => Promise<T>, deps: any[] = [], initial: T): AsyncState<T> & { refresh: () => void } {
  const [data, setData] = useState(initial as T);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n: number) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fn()
      .then(result => { if (alive) setData(result); })
      .catch(e => { if (alive) setError(e.message || String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, refresh };
}

// Enterprise aggregated data
export function useEnterpriseData(): AsyncState<EnterpriseDataModel | null> & { refresh: () => void } {
  return useAsync<EnterpriseDataModel | null>(() => getEnterpriseData(), [], null);
}

// Single enterprise by id
export function useEnterprise(id: number | null): AsyncState<EnterpriseModel | null> & { refresh: () => void } {
  return useAsync<EnterpriseModel | null>(() => (id == null ? Promise.resolve(null) : getEnterprise(id)), [id], null);
}

// Clinics list
export function useClinics(): AsyncState<ClinicModel[]> & { refresh: () => void } {
  return useAsync<ClinicModel[]>(() => listClinics(), [], []);
}

// Single clinic
export function useClinic(clinicId: number | null): AsyncState<ClinicModel | null> & { refresh: () => void } {
  return useAsync<ClinicModel | null>(
    () => (clinicId == null ? Promise.resolve(null) : getClinic(clinicId)),
    [clinicId],
    null
  );
}

// Staff list (optionally filtered by clinic)
export function useStaff(clinicId?: number): AsyncState<StaffModel[]> & { refresh: () => void } {
  return useAsync<StaffModel[]>(() => listStaff(clinicId), [clinicId], []);
}

// Single staff member
export function useStaffMember(staffId: number | null): AsyncState<StaffModel | null> & { refresh: () => void } {
  return useAsync<StaffModel | null>(
    () => (staffId == null ? Promise.resolve(null) : getStaff(staffId)),
    [staffId],
    null
  );
}

// Services list (optionally filtered by clinic)
export function useServices(clinicId?: number): AsyncState<ServiceModel[]> & { refresh: () => void } {
  return useAsync<ServiceModel[]>(() => listServices(clinicId), [clinicId], []);
}

// Single service
export function useService(serviceId: number | null): AsyncState<ServiceModel | null> & { refresh: () => void } {
  return useAsync<ServiceModel | null>(
    () => (serviceId == null ? Promise.resolve(null) : getService(serviceId)),
    [serviceId],
    null
  );
}

// Staff details list
export function useStaffDetails(): AsyncState<StaffDetailsModel[]> & { refresh: () => void } {
  return useAsync<StaffDetailsModel[]>(() => listStaffDetails(), [], []);
}

// Single staff detail
export function useStaffDetail(staffId: number | null): AsyncState<StaffDetailsModel | null> & { refresh: () => void } {
  return useAsync<StaffDetailsModel | null>(
    () => (staffId == null ? Promise.resolve(null) : getStaffDetail(staffId)),
    [staffId],
    null
  );
}

// Doctor profiles list
export function useDoctorProfiles(): AsyncState<DoctorProfileModel[]> & { refresh: () => void } {
  return useAsync<DoctorProfileModel[]>(() => listDoctorProfiles(), [], []);
}

// Single doctor profile
export function useDoctorProfile(doctorId: number | null): AsyncState<DoctorProfileModel | null> & { refresh: () => void } {
  return useAsync<DoctorProfileModel | null>(
    () => (doctorId == null ? Promise.resolve(null) : getDoctorProfile(doctorId)),
    [doctorId],
    null
  );
}

// Clinical specialties list
export function useClinicalSpecialties(): AsyncState<ClinicalSpecialtyModel[]> & { refresh: () => void } {
  return useAsync<ClinicalSpecialtyModel[]>(() => listClinicalSpecialties(), [], []);
}

// Single clinical specialty
export function useClinicalSpecialty(specialtyId: number | null): AsyncState<ClinicalSpecialtyModel | null> & { refresh: () => void } {
  return useAsync<ClinicalSpecialtyModel | null>(
    () => (specialtyId == null ? Promise.resolve(null) : getClinicalSpecialty(specialtyId)),
    [specialtyId],
    null
  );
}

// --- Mutation helpers (returning status + handler) ---
interface MutationState<TInput, TResult> {
  loading: boolean;
  error: string | null;
  mutate: (input: TInput) => Promise<TResult | undefined>;
}

function useMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>): MutationState<TInput, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null as string | null);

  const mutate = useCallback(async (input: TInput) => {
    setLoading(true);
    setError(null);
    try {
      return await fn(input);
    } catch (e: any) {
      setError(e.message || String(e));
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [fn]);

  return { loading, error, mutate };
}

// Clinic mutations
export function useCreateClinic() { return useMutation<CreateClinicDto, ClinicModel>(createClinic); }
export function useUpdateClinic(clinicId: number) {
  return useMutation<UpdateClinicDto, ClinicModel>((payload) => updateClinic(clinicId, payload));
}
export function useDeleteClinic(clinicId: number) {
  return useMutation<void, void>(() => deleteClinic(clinicId));
}

// Staff mutations
export function useCreateStaff() { return useMutation<CreateStaffDto, StaffModel>(createStaff); }
export function useUpdateStaff(staffId: number) {
  return useMutation<UpdateStaffDto, StaffModel>((payload) => updateStaff(staffId, payload));
}
export function useDeleteStaff(staffId: number) {
  return useMutation<void, void>(() => deleteStaff(staffId));
}

// Service mutations
export function useCreateService() { return useMutation<CreateServiceDto, ServiceModel>(createService); }
export function useUpdateService(serviceId: number) {
  return useMutation<UpdateServiceDto, ServiceModel>((payload) => updateService(serviceId, payload));
}
export function useDeleteService(serviceId: number) {
  return useMutation<void, void>(() => deleteService(serviceId));
}

// Clinical specialty mutations
export interface UseCreateClinicalSpecialtyInput { department: string; clinicalArea: string; }
export function useCreateClinicalSpecialty() { return useMutation<UseCreateClinicalSpecialtyInput, ClinicalSpecialtyModel>((payload) => createClinicalSpecialty(payload)); }
export function useUpdateClinicalSpecialty(specialtyId: number) {
  return useMutation<Partial<UseCreateClinicalSpecialtyInput>, ClinicalSpecialtyModel>((payload) => updateClinicalSpecialty(specialtyId, payload));
}
export function useDeleteClinicalSpecialty(specialtyId: number) {
  return useMutation<void, void>(() => deleteClinicalSpecialty(specialtyId));
}

// Roles list
export function useRoles(): AsyncState<RoleModel[]> & { refresh: () => void } {
  return useAsync<RoleModel[]>(() => listRoles(), [], []);
}

// Single role
export function useRole(roleId: number | null): AsyncState<RoleModel | null> & { refresh: () => void } {
  return useAsync<RoleModel | null>(
    () => (roleId == null ? Promise.resolve(null) : getRole(roleId)),
    [roleId],
    null
  );
}

// Role mutations
export interface UseCreateRoleInput { roleName: string; description: string; isClinical: boolean; }
export function useCreateRole() { return useMutation<UseCreateRoleInput, RoleModel>((payload) => createRole(payload)); }
export function useUpdateRole(roleId: number) {
  return useMutation<Partial<UseCreateRoleInput>, RoleModel>((payload) => updateRole(roleId, payload));
}
export function useDeleteRole(roleId: number) {
  return useMutation<void, void>(() => deleteRole(roleId));
}

// Example usage in a component:
// const { data: clinics, loading, error, refresh } = useClinics();
// const createClinic = useCreateClinic();
// const onSubmit = async () => { const result = await createClinic.mutate(formValues); if (result) refresh(); };
