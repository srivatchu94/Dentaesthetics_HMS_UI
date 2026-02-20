// Inventory Management Models

export interface InventoryMaster {
  itemId: number;
  itemName: string;
  itemCode: string; // SKU / internal code
  category: string;
  subCategory: string;
  unit: string; // e.g., "Box", "Tablet", "Piece"
  cgst?: number;
  sgst?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicInventory {
  inventoryId: number;
  itemId: number; // FK → InventoryMaster
  itemName?: string;
  enterpriseId: number; // FK → Enterprise
  clinicId: number; // FK → Clinic
  quantityAvailable: number;
  reorderLevel: number; // Threshold
  minimumStock: number;
  batchNo?: string;
  expiry?: string;
  expiryDate?: string;
  amount?: number;
  storageLocation: string;
  status: string; // Available, LowStock, OutOfStock
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  supplierId: number;
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string; // For India compliance
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierItemMapping {
  supplierItemId: number;
  supplierId: number; // FK → Supplier
  itemId: number; // FK → InventoryMaster
  unitPrice: number;
  leadTimeDays: number; // Delivery SLA
  isPreferred: boolean; // Preferred supplier flag
}

// DTO Interfaces for API operations
export interface CreateInventoryMasterDto {
  itemName: string;
  itemCode: string;
  category: string;
  subCategory: string;
  unit: string;
  cgst?: number;
  sgst?: number;
  isActive: boolean;
}

export interface UpdateInventoryMasterDto extends Partial<CreateInventoryMasterDto> {}

export interface CreateClinicInventoryDto {
  itemId: number;
  enterpriseId: number;
  clinicId: number;
  quantityAvailable: number;
  reorderLevel: number;
  minimumStock: number;
  batchNo?: string;
  expiry?: string;
  expiryDate?: string;
  amount?: number;
  storageLocation: string;
  status: string;
}

export interface UpdateClinicInventoryDto extends Partial<CreateClinicInventoryDto> {}

export interface CreateSupplierDto {
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  isActive: boolean;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}

// Bulk inventory addition models
export interface InventoryAddRow {
  itemId: number;
  itemName: string;
  quantityAvailable: number;
  reorderLevel: number;
  minimumStock: number;
  batchNo?: string;
  expiryDate?: string;
  amount?: number;
  storageLocation: string;
  unit?: string;
  description?: string;
  status: string;
}

export interface MasterInventoryAddRow {
  itemName: string;
  itemCode: string;
  category: string;
  subCategory: string;
  unit: string;
  cgst?: number;
  sgst?: number;
  isActive: boolean;
}

