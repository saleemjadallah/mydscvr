/**
 * Confidence-Based Review Router
 *
 * Intelligently routes forms based on overall confidence and validation results:
 * - > 90% confidence + no errors → Auto-approve
 * - 70-89% confidence → Spot check (highlight specific fields)
 * - < 70% confidence → Full manual review required
 */

import type { ExtractedField } from './documentRouter';
import type { ValidationIssue } from './rulesEngine';
import type { AIValidationResult } from './aiValidator';

export interface FieldResult {
  fieldId: string;
  label: string;
  value: string;
  confidence: number;
  source: 'auto_populated' | 'extracted' | 'user_input';
  issues?: ValidationIssue[];
  needsReview: boolean;
  reviewReason?: string;
}

export interface ReviewDecision {
  action: 'auto_approve' | 'spot_check' | 'full_review';
  message: string;
  overallConfidence: number;
  reviewRequired: boolean;
  highlightFields?: string[]; // Field IDs that need review
  criticalIssues: ValidationIssue[];
  warnings: ValidationIssue[];
  estimatedReviewTime?: string; // "< 2 minutes", "5-10 minutes", etc.
}

export interface ProcessingResult {
  formId: string;
  status: 'auto_approved' | 'needs_review' | 'needs_full_review';
  overallConfidence: number;
  fieldResults: FieldResult[];
  reviewItems?: Array<{
    fieldId: string;
    reason: string;
    suggestion?: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  validationSummary: {
    totalFields: number;
    populatedFields: number;
    highConfidenceFields: number;
    lowConfidenceFields: number;
    fieldsWithIssues: number;
  };
}

/**
 * Route form for review based on confidence and validation results
 */
export function routeForReview(
  fieldResults: FieldResult[],
  validationIssues: ValidationIssue[],
  aiValidation?: AIValidationResult
): ReviewDecision {
  // Calculate overall confidence
  const overallConfidence = calculateOverallConfidence(fieldResults);

  // Categorize validation issues
  const errors = validationIssues.filter((i) => i.severity === 'error');
  const warnings = validationIssues.filter((i) => i.severity === 'warning');

  // Add AI validation issues if present
  if (aiValidation) {
    errors.push(...aiValidation.issues.filter((i) => i.severity === 'error'));
    warnings.push(...aiValidation.issues.filter((i) => i.severity === 'warning'));
  }

  // Decision logic
  if (errors.length === 0 && overallConfidence >= 90) {
    // AUTO-APPROVE: High confidence, no errors
    return {
      action: 'auto_approve',
      message: 'Application ready for submission',
      overallConfidence,
      reviewRequired: false,
      criticalIssues: [],
      warnings,
      estimatedReviewTime: '< 1 minute',
    };
  }

  if (errors.length === 0 && overallConfidence >= 70) {
    // SPOT CHECK: Good confidence but not perfect
    const fieldsToReview = fieldResults
      .filter((f) => f.confidence < 85 || (f.issues && f.issues.length > 0))
      .map((f) => f.fieldId);

    return {
      action: 'spot_check',
      message: `Please review ${fieldsToReview.length} highlighted field(s)`,
      overallConfidence,
      reviewRequired: true,
      highlightFields: fieldsToReview,
      criticalIssues: errors,
      warnings,
      estimatedReviewTime: fieldsToReview.length < 5 ? '< 2 minutes' : '3-5 minutes',
    };
  }

  // FULL REVIEW: Low confidence or multiple errors
  return {
    action: 'full_review',
    message: 'This form requires manual review',
    overallConfidence,
    reviewRequired: true,
    highlightFields: fieldResults.map((f) => f.fieldId),
    criticalIssues: errors,
    warnings,
    estimatedReviewTime: '5-10 minutes',
  };
}

/**
 * Calculate overall confidence score
 */
export function calculateOverallConfidence(fieldResults: FieldResult[]): number {
  if (fieldResults.length === 0) return 0;

  // Weight critical fields more heavily
  const criticalFields = ['passport', 'name', 'date of birth', 'nationality'];

  let totalWeight = 0;
  let weightedSum = 0;

  for (const field of fieldResults) {
    // Determine field weight
    const isCritical = criticalFields.some((critical) =>
      field.label.toLowerCase().includes(critical)
    );

    const weight = isCritical ? 2 : 1;

    totalWeight += weight;
    weightedSum += field.confidence * weight;
  }

  const overallConfidence = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  return overallConfidence;
}

/**
 * Create processing result from extraction and validation
 */
export function createProcessingResult(
  formId: string,
  extractedFields: ExtractedField[],
  validationIssues: ValidationIssue[],
  aiValidation?: AIValidationResult
): ProcessingResult {
  // Convert extracted fields to field results
  const fieldResults: FieldResult[] = extractedFields.map((field) => {
    // Find issues related to this field
    const fieldIssues = validationIssues.filter(
      (issue) => issue.field === field.label || issue.field.includes(field.label)
    );

    // Determine if field needs review
    const needsReview =
      field.confidence < 70 ||
      fieldIssues.some((i) => i.severity === 'error') ||
      (aiValidation?.reviewRequired && field.confidence < 85);

    const reviewReason = needsReview
      ? field.confidence < 70
        ? 'Low confidence extraction'
        : 'Validation issues detected'
      : undefined;

    return {
      fieldId: field.label.replace(/\s+/g, '_').toLowerCase(),
      label: field.label,
      value: field.value,
      confidence: field.confidence,
      source: 'extracted' as const,
      issues: fieldIssues.length > 0 ? fieldIssues : undefined,
      needsReview: needsReview || false,
      reviewReason: reviewReason || undefined,
    };
  });

  // Create review decision
  const reviewDecision = routeForReview(fieldResults, validationIssues, aiValidation);

  // Create review items
  const reviewItems = fieldResults
    .filter((f) => f.needsReview)
    .map((f) => ({
      fieldId: f.fieldId,
      reason: f.reviewReason || 'Needs verification',
      suggestion: f.issues?.[0]?.suggestion,
      priority: (f.confidence < 50
        ? 'high'
        : f.confidence < 70
        ? 'medium'
        : 'low') as 'high' | 'medium' | 'low',
    }));

  // Calculate validation summary
  const validationSummary = {
    totalFields: fieldResults.length,
    populatedFields: fieldResults.filter((f) => f.value && f.value.trim().length > 0).length,
    highConfidenceFields: fieldResults.filter((f) => f.confidence >= 85).length,
    lowConfidenceFields: fieldResults.filter((f) => f.confidence < 70).length,
    fieldsWithIssues: fieldResults.filter((f) => f.issues && f.issues.length > 0).length,
  };

  // Determine status
  let status: 'auto_approved' | 'needs_review' | 'needs_full_review';
  switch (reviewDecision.action) {
    case 'auto_approve':
      status = 'auto_approved';
      break;
    case 'spot_check':
      status = 'needs_review';
      break;
    case 'full_review':
      status = 'needs_full_review';
      break;
  }

  return {
    formId,
    status,
    overallConfidence: reviewDecision.overallConfidence,
    fieldResults,
    reviewItems: reviewItems.length > 0 ? reviewItems : undefined,
    validationSummary,
  };
}

/**
 * Prioritize review items
 */
export function prioritizeReviewItems(
  reviewItems: ProcessingResult['reviewItems']
): Array<{
  fieldId: string;
  reason: string;
  suggestion?: string;
  priority: 'high' | 'medium' | 'low';
}> {
  if (!reviewItems) return [];

  // Sort by priority: high → medium → low
  const priorityOrder = { high: 1, medium: 2, low: 3 };

  return [...reviewItems].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}

/**
 * Generate user-friendly review message
 */
export function generateReviewMessage(processingResult: ProcessingResult): string {
  const { status, overallConfidence, reviewItems, validationSummary } = processingResult;

  if (status === 'auto_approved') {
    return `✓ Your form is ready! All ${validationSummary.populatedFields} fields were filled with high confidence (${overallConfidence}%).`;
  }

  if (status === 'needs_review') {
    const fieldsToReview = reviewItems?.length || 0;
    const highPriority = reviewItems?.filter((r) => r.priority === 'high').length || 0;

    if (highPriority > 0) {
      return `⚠ Please review ${fieldsToReview} field(s). ${highPriority} require immediate attention.`;
    }

    return `→ Please review ${fieldsToReview} field(s) to ensure accuracy. Most fields look good!`;
  }

  // Full review
  const lowConfidence = validationSummary.lowConfidenceFields;
  const withIssues = validationSummary.fieldsWithIssues;

  return `⚠ This form needs careful review. ${lowConfidence} field(s) have low confidence and ${withIssues} field(s) have validation issues.`;
}

/**
 * Get recommended next actions for user
 */
export function getRecommendedActions(processingResult: ProcessingResult): string[] {
  const actions: string[] = [];

  if (processingResult.status === 'auto_approved') {
    actions.push('Download your filled form');
    actions.push('Review the PDF before submission (recommended)');
    return actions;
  }

  const highPriorityItems = processingResult.reviewItems?.filter((r) => r.priority === 'high') || [];

  if (highPriorityItems.length > 0) {
    actions.push(`Fix ${highPriorityItems.length} high-priority field(s) first`);
  }

  if (processingResult.validationSummary.lowConfidenceFields > 0) {
    actions.push('Verify fields with low confidence scores');
  }

  if (processingResult.validationSummary.fieldsWithIssues > 0) {
    actions.push('Address validation issues highlighted in red');
  }

  actions.push('Double-check all dates and names');
  actions.push('Download and review the completed PDF');

  return actions;
}

/**
 * Calculate processing statistics
 */
export function calculateProcessingStats(processingResult: ProcessingResult): {
  autoFillRate: number;
  reviewRate: number;
  avgConfidence: number;
  completeness: number;
} {
  const { fieldResults, validationSummary } = processingResult;

  const autoFillRate =
    validationSummary.totalFields > 0
      ? Math.round((validationSummary.highConfidenceFields / validationSummary.totalFields) * 100)
      : 0;

  const reviewRate =
    validationSummary.totalFields > 0
      ? Math.round((validationSummary.lowConfidenceFields / validationSummary.totalFields) * 100)
      : 0;

  const avgConfidence =
    fieldResults.length > 0
      ? Math.round(
          fieldResults.reduce((sum, f) => sum + f.confidence, 0) / fieldResults.length
        )
      : 0;

  const completeness =
    validationSummary.totalFields > 0
      ? Math.round((validationSummary.populatedFields / validationSummary.totalFields) * 100)
      : 0;

  return {
    autoFillRate,
    reviewRate,
    avgConfidence,
    completeness,
  };
}
