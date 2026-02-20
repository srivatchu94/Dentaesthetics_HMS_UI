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

const normalizeClinicInventoryFromApi = (item: any): ClinicInventory => ({
  ...item,
  expiry: item?.expiry ?? item?.expiryDate,
  expiryDate: item?.expiryDate ?? item?.expiry
});

const normalizeClinicInventoryForApi = (item: ClinicInventory): ClinicInventory => ({
  ...item,
  expiry: item?.expiry ?? item?.expiryDate,
  expiryDate: item?.expiryDate ?? item?.expiry
});

const unwrapCollection = <T>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  return [];
};

const unwrapItem = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data as T;
  }
  return payload as T;
};

// ============= INVENTORY MASTER OPERATIONS =============

export function listInventoryMasters(): Promise<InventoryMaster[]> {
  return request<any>("/Inventory/GetAllMasterItems").then(data => unwrapCollection<InventoryMaster>(data));
}

export function getInventoryMaster(itemId: number): Promise<InventoryMaster> {
  return request<any>(`/Inventory/GetMasterItem/${itemId}`).then(data => unwrapItem<InventoryMaster>(data));
}

export function createInventoryMaster(payload: CreateInventoryMasterDto): Promise<InventoryMaster> {
  return request<any>("/Inventory/AddMasterItem", {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(data => unwrapItem<InventoryMaster>(data));
}

export function updateInventoryMaster(itemId: number, payload: UpdateInventoryMasterDto): Promise<InventoryMaster> {
  return request<any>(`/Inventory/UpdateMasterItem`, {
    method: "PUT",
    body: JSON.stringify({ itemId, ...payload })
  }).then(data => unwrapItem<InventoryMaster>(data));
}

export function deleteInventoryMaster(itemId: number): Promise<void> {
  return request<void>(`/InventoryMaster/Delete?id=${itemId}`, {
    method: "DELETE"
  });
}

export function addInventoryMasterItemsBulk(items: InventoryMaster[]): Promise<InventoryMaster[]> {
  const normalizedItems = (items || []).map((item) => ({
    ...item,
    unit: String(item?.unit ?? '').trim()
  }));

  return request<any>("/Inventory/AddMasterItemsBulk", {
    method: "POST",
    body: JSON.stringify(normalizedItems)
  }).then(data => unwrapCollection<InventoryMaster>(data));
}

export function getAllInventoryMasterItems(): Promise<InventoryMaster[]> {
  return request<any>("/Inventory/GetAllMasterItems").then(data => unwrapCollection<InventoryMaster>(data));
}

// ============= CLINIC INVENTORY OPERATIONS =============

export function listClinicInventories(enterpriseId?: number, clinicId?: number): Promise<ClinicInventory[]> {
  let url = "";
  if (clinicId) {
    url = `/Inventory/GetByClinic/${clinicId}`;
  } else if (enterpriseId) {
    url = `/Inventory/GetByEnterprise/${enterpriseId}`;
  } else {
    return Promise.resolve([]);
  }

  return request<any>(url)
    .then(data => unwrapCollection<ClinicInventory>(data))
    .then(items => (items || []).map(normalizeClinicInventoryFromApi));
}

export function getClinicInventory(inventoryId: number): Promise<ClinicInventory> {
  return request<any>(`/Inventory/GetClinicInventory/${inventoryId}`)
    .then(data => unwrapItem<ClinicInventory>(data))
    .then(normalizeClinicInventoryFromApi);
}

export function getClinicInventoriesByClinic(clinicId: number, enterpriseId: number): Promise<ClinicInventory[]> {
  return request<any>(`/Inventory/GetByClinic/${clinicId}`)
    .then(data => unwrapCollection<ClinicInventory>(data))
    .then(items => (items || []).map(normalizeClinicInventoryFromApi));
}

export function createClinicInventory(payload: CreateClinicInventoryDto): Promise<ClinicInventory> {
  console.log('📞 API CALL: AddClinicInventory', payload);
  const normalizedPayload = {
    ...payload,
    expiry: payload.expiry ?? payload.expiryDate,
    expiryDate: payload.expiryDate ?? payload.expiry
  };

  return request<ClinicInventory>("/Inventory/AddClinicInventory", {
    method: "POST",
    body: JSON.stringify(normalizedPayload)
  }).then(data => {
    const normalized = normalizeClinicInventoryFromApi(data);
    console.log('✅ Inventory item created:', normalized);
    return normalized;
  }).catch(error => {
    console.error('❌ Failed to create inventory:', error);
    throw error;
  });
}

export function updateClinicInventory(inventoryId: number, payload: UpdateClinicInventoryDto): Promise<ClinicInventory> {
  console.log('📝 API CALL: UpdateClinicInventory', { inventoryId, payload });
  const normalizedPayload = {
    ...payload,
    expiry: payload.expiry ?? payload.expiryDate,
    expiryDate: payload.expiryDate ?? payload.expiry
  };

  return request<ClinicInventory>("/Inventory/UpdateClinicInventory", {
    method: "PUT",
    body: JSON.stringify(normalizedPayload)
  }).then(data => {
    const normalized = normalizeClinicInventoryFromApi(data);
    console.log('✅ Inventory item updated:', normalized);
    return normalized;
  }).catch(error => {
    console.error('❌ Failed to update inventory:', error);
    throw error;
  });
}

export function deleteClinicInventory(enterpriseId: number, clinicId: number, inventoryId: number): Promise<void> {
  console.log('🗑️ API CALL: DeleteClinicInventory', { enterpriseId, clinicId, inventoryId });
  return request<void>(`/Inventory/DeleteClinicInventory?enterpriseId=${enterpriseId}&clinicId=${clinicId}&inventoryId=${inventoryId}`, {
    method: "DELETE"
  }).then(() => {
    console.log('✅ Inventory item deleted successfully');
  }).catch(error => {
    console.error('❌ Failed to delete inventory:', error);
    throw error;
  });
}

export function saveClinicInventoryBatch(enterpriseId: number, clinicId: number, items: ClinicInventory[]): Promise<ClinicInventory[]> {
  const normalizedItems = (items || []).map(normalizeClinicInventoryForApi);
  return request<any>(`/Inventory/SaveBatch?enterpriseId=${enterpriseId}&clinicId=${clinicId}`, {
    method: "POST",
    body: JSON.stringify(normalizedItems)
  }).then(data => {
    const savedItems = unwrapCollection<ClinicInventory>(data);
    return (savedItems || []).map(normalizeClinicInventoryFromApi);
  });
}

export function getClinicInventoryByClinicId(clinicId: number): Promise<ClinicInventory[]> {
  console.log('📞 API CALL: GetClinicInventoryByClinicId', { clinicId });
  return request<any>(`/Inventory/GetByClinic/${clinicId}`)
    .then(data => {
      const normalized = unwrapCollection<ClinicInventory>(data).map(normalizeClinicInventoryFromApi);
      console.log('✅ Clinic inventory fetched:', normalized);
      return normalized;
    })
    .catch(error => {
      console.error('❌ Failed to fetch clinic inventory:', error);
      throw error;
    });
}

export function updateClinicInventoryIndividual(item: ClinicInventory): Promise<ClinicInventory> {
  const normalizedItem = normalizeClinicInventoryForApi(item);
  return request<any>("/Inventory/UpdateClinicInventory", {
    method: "PUT",
    body: JSON.stringify(normalizedItem)
  }).then(data => unwrapItem<ClinicInventory>(data)).then(normalizeClinicInventoryFromApi);
}


export function bulkUpdateClinicInventories(updates: UpdateClinicInventoryDto[]): Promise<ClinicInventory[]> {
  const normalizedUpdates = (updates || []).map((update) => ({
    ...update,
    expiry: update.expiry ?? update.expiryDate,
    expiryDate: update.expiryDate ?? update.expiry
  }));

  return request<ClinicInventory[]>("/Inventory/BulkUpdate", {
    method: "POST",
    body: JSON.stringify(normalizedUpdates)
  }).then(items => (items || []).map(normalizeClinicInventoryFromApi));
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
  return request<ClinicInventory[]>(url).then(items => (items || []).map(normalizeClinicInventoryFromApi));
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
