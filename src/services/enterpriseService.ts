import { request, BASE_URL } from './apiClient';
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
  const endpoint = "/Enterprise/GetAllEnterprises";
  const fullUrl = `${BASE_URL}${endpoint}`;
  console.log(`📞 Fetching enterprises from ${fullUrl}`);
  return request<EnterpriseModel[]>(endpoint)
    .then((data) => {
      console.log(`✅ Enterprises API response (${fullUrl}):`, data);
      return data;
    })
    .catch((err) => {
      console.error(`❌ Enterprises API error (${fullUrl}):`, err);
      throw err;
    });
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

