// User types
export interface User {
  id: string;
  email: string;
  name: string;
  uploads_used: number;
  batches_created: number;
  totalHeadshots?: number;
  createdAt: Date;
}

// Platform specifications for each template
export interface PlatformSpecs {
  aspectRatio: string; // "1:1", "4:5", "16:9", etc.
  dimensions: string; // "1024x1024", "1080x1350", etc.
  optimizedFor: string; // "LinkedIn profile photo", "Resume", etc.
  fileFormat: string; // "JPG", "PNG"
  colorProfile: string; // "sRGB", "Adobe RGB"
}

// Style template definition
export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  popular?: boolean;
  icon: string; // Lucide icon name

  // Generation parameters
  background: string;
  outfit: string;
  lighting: string;
  expression: string;
  pose: string;

  // Platform specifications
  platformSpecs: PlatformSpecs;

  // Gemini prompt
  geminiPrompt: string;
}

// Headshot types
export interface GeneratedHeadshot {
  url: string;
  template: string; // Template ID
  background: string;
  outfit: string;
  thumbnail: string;
  platformSpecs: PlatformSpecs;
}

// Batch status
export type BatchStatus = 'processing' | 'completed' | 'failed';

// Headshot batch
export interface HeadshotBatch {
  id: number;
  userId: string;
  status: BatchStatus;

  // Input photos
  uploadedPhotos: string[]; // R2 URLs
  photoCount: number;

  // Generation settings
  plan: 'basic' | 'professional' | 'executive';
  styleTemplates: string[]; // Template IDs
  backgrounds?: string[];
  outfits?: string[];

  // Results
  generatedHeadshots: GeneratedHeadshot[];
  headshotCount: number;
  headshotsByTemplate: { [templateId: string]: number };

  // Metadata
  createdAt: Date;
  completedAt?: Date;
  processingTimeMinutes?: number;

  // Pricing
  amountPaid: number; // In cents
  stripePaymentId?: string;
}

// Plan configuration
export interface PlanConfig {
  id: 'basic' | 'professional' | 'executive';
  name: string;
  price: number; // In cents
  headshots: number;
  backgrounds: number;
  outfits: number;
  editCredits: number;
  turnaroundHours: number;
  stripePriceId: string;
  popular?: boolean;
  features: string[];
}

// Edit request
export interface EditRequest {
  id: number;
  batchId: number;
  userId: string;
  headshotId: string;
  editType: 'background_change' | 'outfit_change' | 'regenerate';
  status: 'pending' | 'completed' | 'failed';
  resultUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Upload progress
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
