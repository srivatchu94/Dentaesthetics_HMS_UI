// Inventory API Service
import { request } from './apiClient';
import type {
  InventoryMaster,
  ClinicInventory,
  Supplier,
  CreateInventoryMasterDto,
  UpdateInventoryMasterDto,
  CreateClinicInventoryDto,
  UpdateClinicInventoryDto,
  CreateSupplierDto,
  UpdateSupplierDto
} from '../Interfaces';

// ============= INVENTORY MASTER OPERATIONS =============

export function listInventoryMasters(): Promise<InventoryMaster[]> {
  return request<InventoryMaster[]>("/Inventory/GetAllInventoryMasterItems");
}

export function getInventoryMaster(itemId: number): Promise<InventoryMaster> {
  return request<InventoryMaster>(`/Inventory/GetInventoryMasterItemByID?id=${itemId}`);
}

export function createInventoryMaster(payload: CreateInventoryMasterDto): Promise<InventoryMaster> {
  return request<InventoryMaster>("/Inventory/AddInventoryMasterItem", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateInventoryMaster(itemId: number, payload: UpdateInventoryMasterDto): Promise<InventoryMaster> {
  return request<InventoryMaster>(`/InventoryMaster/Update?id=${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteInventoryMaster(itemId: number): Promise<void> {
  return request<void>(`/InventoryMaster/Delete?id=${itemId}`, {
    method: "DELETE"
  });
}

export function addInventoryMasterItemsBulk(items: InventoryMaster[]): Promise<InventoryMaster[]> {
  return request<InventoryMaster[]>("/inventory/AddInventoryMasterItemsBulk", {
    method: "POST",
    body: JSON.stringify(items)
  });
}

export function getAllInventoryMasterItems(): Promise<InventoryMaster[]> {
  return request<InventoryMaster[]>("/inventory/GetAllInventoryMasterItems");
}

// ============= CLINIC INVENTORY OPERATIONS =============

export function listClinicInventories(enterpriseId?: number, clinicId?: number): Promise<ClinicInventory[]> {
  let url = "/Inventory/GetAll";
  const params = [];
  
  if (enterpriseId) params.push(`enterpriseId=${enterpriseId}`);
  if (clinicId) params.push(`clinicId=${clinicId}`);
  
  if (params.length > 0) {
    url += "?" + params.join("&");
  }
  
  return request<ClinicInventory[]>(url);
}

export function getClinicInventory(inventoryId: number): Promise<ClinicInventory> {
  return request<ClinicInventory>(`/Inventory/GetByID?id=${inventoryId}`);
}

export function getClinicInventoriesByClinic(clinicId: number, enterpriseId: number): Promise<ClinicInventory[]> {
  return request<ClinicInventory[]>(`/Inventory/GetByClinic?enterpriseId=${enterpriseId}&clinicId=${clinicId}`);
}

export function createClinicInventory(payload: CreateClinicInventoryDto): Promise<ClinicInventory> {
  console.log('📞 API CALL: AddClinicInventory', payload);
  return request<ClinicInventory>("/Inventory/AddClinicInventory", {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(data => {
    console.log('✅ Inventory item created:', data);
    return data;
  }).catch(error => {
    console.error('❌ Failed to create inventory:', error);
    throw error;
  });
}

export function updateClinicInventory(inventoryId: number, payload: UpdateClinicInventoryDto): Promise<ClinicInventory> {
  console.log('📝 API CALL: UpdateClinicInventory', { inventoryId, payload });
  return request<ClinicInventory>("/Inventory/UpdateClinicInventory", {
    method: "PUT",
    body: JSON.stringify(payload)
  }).then(data => {
    console.log('✅ Inventory item updated:', data);
    return data;
  }).catch(error => {
    console.error('❌ Failed to update inventory:', error);
    throw error;
  });
}

export function deleteClinicInventory(enterpriseId: number, clinicId: number, inventoryId: number): Promise<void> {
  console.log('🗑️ API CALL: DeleteClinicInventory', { enterpriseId, clinicId, inventoryId });
  return request<void>(`/Inventory/DeleteClinicInventory?EnterpriseID=${enterpriseId}&ClinicID=${clinicId}&InventoryID=${inventoryId}`, {
    method: "DELETE"
  }).then(() => {
    console.log('✅ Inventory item deleted successfully');
  }).catch(error => {
    console.error('❌ Failed to delete inventory:', error);
    throw error;
  });
}

export function saveClinicInventoryBatch(enterpriseId: number, clinicId: number, items: ClinicInventory[]): Promise<ClinicInventory[]> {
  return request<ClinicInventory[]>(`/inventory/SaveClinicInventoryBatch?enterpriseId=${enterpriseId}&clinicId=${clinicId}`, {
    method: "POST",
    body: JSON.stringify(items)
  });
}

export function getClinicInventoryByClinicId(clinicId: number): Promise<ClinicInventory[]> {
  console.log('📞 API CALL: GetClinicInventoryByClinicId', { clinicId });
  return request<ClinicInventory[]>(`/Inventory/GetClinicInventoryByClinicId?clinicId=${clinicId}`)
    .then(data => {
      console.log('✅ Clinic inventory fetched:', data);
      return data;
    })
    .catch(error => {
      console.error('❌ Failed to fetch clinic inventory:', error);
      throw error;
    });
}

export function updateClinicInventoryIndividual(item: ClinicInventory): Promise<ClinicInventory> {
  return request<ClinicInventory>("/inventory/UpdateClinicInventory", {
    method: "PUT",
    body: JSON.stringify(item)
  });
}


export function bulkUpdateClinicInventories(updates: UpdateClinicInventoryDto[]): Promise<ClinicInventory[]> {
  return request<ClinicInventory[]>("/Inventory/BulkUpdate", {
    method: "POST",
    body: JSON.stringify(updates)
  });
}

// ============= SUPPLIER OPERATIONS =============

export function listSuppliers(): Promise<Supplier[]> {
  return request<Supplier[]>("/Supplier/GetAll");
}

export function getSupplier(supplierId: number): Promise<Supplier> {
  return request<Supplier>(`/Supplier/GetByID?id=${supplierId}`);
}

export function createSupplier(payload: CreateSupplierDto): Promise<Supplier> {
  return request<Supplier>("/Supplier/Create", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateSupplier(supplierId: number, payload: UpdateSupplierDto): Promise<Supplier> {
  return request<Supplier>(`/Supplier/Update?id=${supplierId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteSupplier(supplierId: number): Promise<void> {
  return request<void>(`/Supplier/Delete?id=${supplierId}`, {
    method: "DELETE"
  });
}

// ============= SEARCH & FILTER OPERATIONS =============

export interface SearchInventoryParams {
  itemName?: string;
  category?: string;
  subCategory?: string;
  isActive?: boolean;
}

export function searchInventoryMasters(params: SearchInventoryParams): Promise<InventoryMaster[]> {
  const queryParams = new URLSearchParams();
  
  if (params.itemName) queryParams.append('itemName', params.itemName);
  if (params.category) queryParams.append('category', params.category);
  if (params.subCategory) queryParams.append('subCategory', params.subCategory);
  if (params.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
  
  const url = `/InventoryMaster/Search?${queryParams.toString()}`;
  return request<InventoryMaster[]>(url);
}

export interface SearchClinicInventoryParams {
  enterpriseId?: number;
  clinicId?: number;
  itemName?: string;
  status?: string;
}

export function searchClinicInventories(params: SearchClinicInventoryParams): Promise<ClinicInventory[]> {
  const queryParams = new URLSearchParams();
  
  if (params.enterpriseId) queryParams.append('enterpriseId', String(params.enterpriseId));
  if (params.clinicId) queryParams.append('clinicId', String(params.clinicId));
  if (params.itemName) queryParams.append('itemName', params.itemName);
  if (params.status) queryParams.append('status', params.status);
  
  const url = `/Inventory/Search?${queryParams.toString()}`;
  return request<ClinicInventory[]>(url);
}

// ============= DASHBOARD STATISTICS =============

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

export function getInventoryStats(enterpriseId: number, clinicId?: number): Promise<InventoryStats> {
  let url = `/Inventory/Stats?enterpriseId=${enterpriseId}`;
  if (clinicId) url += `&clinicId=${clinicId}`;
  
  return request<InventoryStats>(url);
}
