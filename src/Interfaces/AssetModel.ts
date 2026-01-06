export interface AssetModel {
  assetID: number;
  enterpriseID: number;
  clinicID: number;
  equipment: string;
  serialNumber: string;
  purchaseDate: string | Date;
  lastMaintenance: string | Date | null;
  nextMaintenance: string | Date | null;
  status: string;
}

export interface CreateAssetDto {
  enterpriseID: number;
  clinicID: number;
  equipment: string;
  serialNumber: string;
  purchaseDate: string | Date;
  lastMaintenance?: string | Date | null;
  nextMaintenance?: string | Date | null;
  status: string;
}

export interface UpdateAssetDto extends Partial<CreateAssetDto> {
  assetID: number;
}
