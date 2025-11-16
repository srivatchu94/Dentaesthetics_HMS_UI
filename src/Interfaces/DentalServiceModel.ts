// DentalServiceModel interface mapped from C# DentalService
// TimeSpan -> string (e.g. "HH:MM:SS") pending backend format confirmation.
// decimal -> number in TypeScript.
export interface DentalServiceModel {
  serviceId: number;
  serviceName: string;
  description: string;
  price: number;
  estimatedDuration: string; // TimeSpan represented as "HH:MM:SS" or ISO 8601 duration
  isCoveredByInsurance: boolean;
  category: string;
  riskLevel: string;
  recommendedFor: string;
  aftercareInstructions: string;
  isActive: boolean;
}
