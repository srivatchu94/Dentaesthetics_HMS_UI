// Service/Dental Services API Service
import { request } from './apiClient';
import type { ServiceModel } from '../Interfaces';

export interface CreateServiceDto {
  clinicId: number;
  serviceName: string;
  description: string;
  price: number;
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> {}

export function listServices(clinicId?: number): Promise<ServiceModel[]> {
  const suffix = clinicId ? `?clinicId=${clinicId}` : "";
  return request<ServiceModel[]>(`/services${suffix}`);
}

export function getService(serviceId: number): Promise<ServiceModel> {
  return request<ServiceModel>(`/services/${serviceId}`);
}

export function createService(payload: CreateServiceDto): Promise<ServiceModel> {
  return request<ServiceModel>("/services", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateService(serviceId: number, payload: UpdateServiceDto): Promise<ServiceModel> {
  return request<ServiceModel>(`/services/${serviceId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteService(serviceId: number): Promise<void> {
  return request<void>(`/services/${serviceId}`, { method: "DELETE" });
}
