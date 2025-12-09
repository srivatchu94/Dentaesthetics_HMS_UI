// Enterprise API Service
import { request } from './apiClient';
import type { EnterpriseDataModel, EnterpriseModel } from '../Interfaces';

export function getEnterpriseData(): Promise<EnterpriseDataModel> {
  return request<EnterpriseDataModel>("/enterprise");
}

export function getEnterprise(id: number): Promise<EnterpriseModel> {
  return request<EnterpriseModel>(`/enterprise/${id}`);
}

export function createEnterprise(enterprise: EnterpriseModel): Promise<EnterpriseModel> {
  return request<EnterpriseModel>("/Enterprise/CreateEnterprise", {
    method: "POST",
    body: JSON.stringify(enterprise)
  });
}

export function listEnterprises(): Promise<EnterpriseModel[]> {
  return request<EnterpriseModel[]>("/Enterprise/GetAllEnterprises");
}

export function updateEnterprise(enterprise: EnterpriseModel): Promise<EnterpriseModel> {
  return request<EnterpriseModel>("/Enterprise/UpdateEnterprise", {
    method: "PUT",
    body: JSON.stringify(enterprise)
  });
}

export function deleteEnterprise(enterpriseId: number): Promise<void> {
  return request<void>(`/Enterprise/DeleteEnterprise?id=${enterpriseId}`, {
    method: "DELETE"
  });
}

