// Enterprise API Service
import { request } from './apiClient';
import type { EnterpriseDataModel, EnterpriseModel } from '../Interfaces';

export function getEnterpriseData(): Promise<EnterpriseDataModel> {
  return request<EnterpriseDataModel>("/enterprise");
}

export function getEnterprise(id: number): Promise<EnterpriseModel> {
  return request<EnterpriseModel>(`/enterprise/${id}`);
}
