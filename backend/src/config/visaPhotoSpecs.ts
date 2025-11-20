/**
 * This file is a placeholder/compatibility layer.
 * The actual photo requirements come from the user's travelProfile.visaRequirements.photoRequirements
 * which is populated by Jeffrey AI during onboarding based on their destination country.
 */

export interface VisaPhotoSpec {
  dimensions: string;
  background: string;
  specifications: string[];
}

// This is just a fallback - real specs come from user's travel profile
export const VISA_PHOTO_SPECS: Record<string, VisaPhotoSpec> = {};
