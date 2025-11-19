import {
    DocumentExtractionResult,
    ExtractedField,
    ExtractedTable,
    ExtractedSelectionMark
} from './azureDocumentIntelligence.js';
import { parse, format, isValid, parseISO } from 'date-fns';
import { parsePhoneNumber, CountryCode } from 'libphonenumber-js';

// Configuration for country-specific logic
const COUNTRY_CONFIG: Record<string, {
    dateFormat: string;
    phoneFormat: 'local' | 'international' | 'spaced';
    currency: string;
}> = {
    'UAE': { dateFormat: 'dd/MM/yyyy', phoneFormat: 'local', currency: 'AED' },
    'US': { dateFormat: 'MM/dd/yyyy', phoneFormat: 'international', currency: 'USD' },
    'UK': { dateFormat: 'dd/MM/yyyy', phoneFormat: 'spaced', currency: 'GBP' },
    'SG': { dateFormat: 'dd/MM/yyyy', phoneFormat: 'international', currency: 'SGD' },
    'TH': { dateFormat: 'dd/MM/yyyy', phoneFormat: 'local', currency: 'THB' },
    'FR': { dateFormat: 'dd/MM/yyyy', phoneFormat: 'spaced', currency: 'EUR' },
    // Default fallback
    'DEFAULT': { dateFormat: 'yyyy-MM-dd', phoneFormat: 'international', currency: 'USD' }
};

const CRITICAL_CHECKBOX_KEYWORDS = [
    'criminal', 'denied', 'deported', 'refused', 'overstayed', 'arrested', 'prohibited', 'convicted'
];

export interface SmartProcessingResult {
    originalResult: DocumentExtractionResult;
    enhancedFields: Record<string, any>;
    warnings: string[];
    insights: string[];
    inferredCountry: string;
}

export class SmartDocumentProcessor {

    /**
     * Main entry point to enhance raw Azure extraction results
     */
    public process(result: DocumentExtractionResult): SmartProcessingResult {
        const warnings: string[] = [];
        const insights: string[] = [];

        // 1. Infer Country
        const inferredCountry = this.inferCountryFromLanguages(result.metadata.languages) || 'DEFAULT';
        const config = COUNTRY_CONFIG[inferredCountry] || COUNTRY_CONFIG['DEFAULT'];

        if (inferredCountry !== 'DEFAULT') {
            insights.push(`Detected document country: ${inferredCountry}`);
        }

        // 2. Enhance Fields (Date & Phone Formatting)
        const enhancedFields: Record<string, any> = {};

        for (const field of result.fields) {
            // Smart Date Formatting
            if (field.type === 'date' || field.label.toLowerCase().includes('date') || field.label.toLowerCase().includes('dob')) {
                const formattedDate = this.formatDateForCountry(field.value, config.dateFormat);
                if (formattedDate) {
                    enhancedFields[field.label] = formattedDate;
                    if (formattedDate !== field.value) {
                        insights.push(`Formatted date '${field.label}' to ${formattedDate} (${inferredCountry} format)`);
                    }
                }
            }

            // Smart Phone Formatting
            if (field.label.toLowerCase().includes('phone') || field.label.toLowerCase().includes('mobile')) {
                const formattedPhone = this.formatPhoneForCountry(field.value, inferredCountry, config.phoneFormat);
                if (formattedPhone) {
                    enhancedFields[field.label] = formattedPhone;
                    if (formattedPhone !== field.value) {
                        insights.push(`Formatted phone '${field.label}' to ${formattedPhone}`);
                    }
                }
            }
        }

        // 3. Critical Checkbox Analysis
        const criticalCheckboxes = this.analyzeCriticalCheckboxes(result.selectionMarks, result.fields);
        for (const cb of criticalCheckboxes) {
            if (cb.state === 'selected') {
                warnings.push(`CRITICAL: '${cb.label}' is CHECKED. Please review legal implications.`);
            }
        }

        // 4. Table Parsing (Family & Travel)
        const familyMembers = this.extractFamilyMembers(result.tables);
        if (familyMembers.length > 0) {
            enhancedFields['familyMembers'] = familyMembers;
            insights.push(`Extracted ${familyMembers.length} family members from tables`);
        }

        const travelHistory = this.extractTravelHistory(result.tables);
        if (travelHistory.length > 0) {
            enhancedFields['travelHistory'] = travelHistory;
            insights.push(`Extracted ${travelHistory.length} travel history entries`);
        }

        return {
            originalResult: result,
            enhancedFields,
            warnings,
            insights,
            inferredCountry
        };
    }

    /**
     * Infer country from detected languages
     */
    public inferCountryFromLanguages(languages: { locale: string; confidence: number }[]): string | null {
        if (!languages || languages.length === 0) return null;

        // Sort by confidence
        const sortedLangs = [...languages].sort((a, b) => b.confidence - a.confidence);
        const primaryLang = sortedLangs[0].locale;

        // Simple mapping logic - can be expanded
        if (primaryLang.startsWith('ar')) return 'UAE'; // Assuming UAE for Arabic for now (or could be SA, etc.)
        if (primaryLang === 'th') return 'TH';
        if (primaryLang === 'fr') return 'FR';
        if (primaryLang === 'en-GB') return 'UK';
        if (primaryLang === 'en-US') return 'US';
        if (primaryLang === 'en-SG') return 'SG';

        // Heuristic: Check for secondary languages
        const hasArabic = languages.some(l => l.locale.startsWith('ar'));
        const hasEnglish = languages.some(l => l.locale.startsWith('en'));

        if (hasArabic && hasEnglish) return 'UAE'; // Common combination

        return null;
    }

    /**
     * Format date string to target country format
     */
    public formatDateForCountry(dateStr: string, targetFormat: string): string | null {
        try {
            // Try parsing as ISO first
            let date = parseISO(dateStr);

            if (!isValid(date)) {
                // Try common formats
                const formatsToTry = ['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'd MMM yyyy'];
                for (const fmt of formatsToTry) {
                    date = parse(dateStr, fmt, new Date());
                    if (isValid(date)) break;
                }
            }

            if (isValid(date)) {
                return format(date, targetFormat);
            }
        } catch (e) {
            // Ignore parsing errors
        }
        return null; // Return null if cannot parse, keeping original value
    }

    /**
     * Format phone number based on country rules
     */
    public formatPhoneForCountry(phoneStr: string, countryCode: string, formatType: 'local' | 'international' | 'spaced'): string | null {
        try {
            // Default to US if country not supported by libphonenumber directly or mapping needed
            // libphonenumber expects ISO 2 letter codes usually
            const isoCountry = this.mapToIsoCode(countryCode);
            if (!isoCountry) return null;

            const phoneNumber = parsePhoneNumber(phoneStr, isoCountry as CountryCode);

            if (!phoneNumber || !phoneNumber.isValid()) return null;

            switch (formatType) {
                case 'local':
                    return phoneNumber.formatNational().replace(/\s/g, ''); // Remove spaces for pure local digits usually
                case 'international':
                    return phoneNumber.formatInternational().replace(/\s/g, '');
                case 'spaced':
                    return phoneNumber.formatInternational();
                default:
                    return phoneNumber.formatInternational();
            }
        } catch (e) {
            return null;
        }
    }

    private mapToIsoCode(country: string): string | null {
        const map: Record<string, string> = {
            'UAE': 'AE', 'US': 'US', 'UK': 'GB', 'SG': 'SG', 'TH': 'TH', 'FR': 'FR'
        };
        return map[country] || null;
    }

    /**
     * Analyze checkboxes for critical legal/safety implications
     */
    public analyzeCriticalCheckboxes(
        _selectionMarks: ExtractedSelectionMark[],
        fields: ExtractedField[]
    ): Array<{ label: string; state: 'selected' | 'unselected' }> {

        // This is tricky because selection marks often don't have labels directly attached in the raw array
        // We need to associate them. In a real Azure response, we'd use bounding boxes to find the nearest text.
        // For this implementation, we'll assume we can look up associated text or it's already linked in a more advanced implementation.
        // OR, we check 'checkbox' type fields from the extracted fields list which DOES have labels.

        const criticalResults: Array<{ label: string; state: 'selected' | 'unselected' }> = [];

        // Check explicit checkbox fields
        for (const field of fields) {
            if (field.type === 'checkbox') {
                const isCritical = CRITICAL_CHECKBOX_KEYWORDS.some(keyword =>
                    field.label.toLowerCase().includes(keyword)
                );

                if (isCritical) {
                    // Normalize state
                    const state = (field.value.toLowerCase() === 'yes' || field.value.toLowerCase() === 'true' || field.value === 'selected')
                        ? 'selected'
                        : 'unselected';

                    criticalResults.push({ label: field.label, state });
                }
            }
        }

        return criticalResults;
    }

    /**
     * Extract family members from tables
     * Heuristic: Look for tables with headers like "Name", "Relationship", "Date of Birth"
     */
    public extractFamilyMembers(tables: ExtractedTable[]): Array<any> {
        const familyMembers: Array<any> = [];

        for (const table of tables) {
            // Check headers
            const headers = table.cells.filter(c => c.rowIndex === 0).map(c => c.content.toLowerCase());
            const hasName = headers.some(h => h.includes('name'));
            const hasRelation = headers.some(h => h.includes('relation'));

            if (hasName && hasRelation) {
                // Iterate rows
                for (let i = 1; i < table.rowCount; i++) {
                    const rowCells = table.cells.filter(c => c.rowIndex === i);
                    if (rowCells.length === 0) continue;

                    const member: any = {};

                    // Map columns to fields (naive mapping)
                    rowCells.forEach(cell => {
                        const header = headers[cell.columnIndex] || '';
                        if (header.includes('name')) member.name = cell.content;
                        if (header.includes('relation')) member.relationship = cell.content;
                        if (header.includes('birth') || header.includes('dob')) member.dob = cell.content;
                        if (header.includes('passport')) member.passportNumber = cell.content;
                    });

                    if (member.name && member.relationship) {
                        familyMembers.push(member);
                    }
                }
            }
        }

        return familyMembers;
    }

    /**
     * Extract travel history from tables
     */
    public extractTravelHistory(tables: ExtractedTable[]): Array<any> {
        const history: Array<any> = [];

        for (const table of tables) {
            const headers = table.cells.filter(c => c.rowIndex === 0).map(c => c.content.toLowerCase());
            const hasCountry = headers.some(h => h.includes('country') || h.includes('destination'));
            const hasDate = headers.some(h => h.includes('date') || h.includes('entry') || h.includes('arrival'));

            if (hasCountry && hasDate) {
                for (let i = 1; i < table.rowCount; i++) {
                    const rowCells = table.cells.filter(c => c.rowIndex === i);
                    if (rowCells.length === 0) continue;

                    const trip: any = {};
                    rowCells.forEach(cell => {
                        const header = headers[cell.columnIndex] || '';
                        if (header.includes('country') || header.includes('destination')) trip.country = cell.content;
                        if (header.includes('entry') || header.includes('arrival') || header.includes('from')) trip.entryDate = cell.content;
                        if (header.includes('exit') || header.includes('departure') || header.includes('to')) trip.exitDate = cell.content;
                        if (header.includes('purpose')) trip.purpose = cell.content;
                    });

                    if (trip.country) {
                        history.push(trip);
                    }
                }
            }
        }

        return history;
    }
}

export const smartDocumentProcessor = new SmartDocumentProcessor();
