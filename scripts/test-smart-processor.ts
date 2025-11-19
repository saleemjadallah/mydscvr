import { smartDocumentProcessor, SmartDocumentProcessor } from '../backend/src/lib/smartDocumentProcessor.js';
import { DocumentExtractionResult, ExtractedField, ExtractedTable } from '../backend/src/lib/azureDocumentIntelligence.js';

// Mock Data
const mockFields: ExtractedField[] = [
    { label: 'Full Name', value: 'John Doe', confidence: 99, type: 'text' },
    { label: 'Date of Birth', value: '1990-01-15', confidence: 98, type: 'date' }, // ISO
    { label: 'Phone Number', value: '+971 50 123 4567', confidence: 95, type: 'text' },
    { label: 'Have you ever been arrested?', value: 'yes', confidence: 90, type: 'checkbox' }, // Critical
    { label: 'Do you smoke?', value: 'no', confidence: 90, type: 'checkbox' }, // Non-critical
];

const mockTables: ExtractedTable[] = [
    {
        rowCount: 3,
        columnCount: 3,
        cells: [
            { rowIndex: 0, columnIndex: 0, content: 'Name', kind: 'columnHeader' },
            { rowIndex: 0, columnIndex: 1, content: 'Relationship', kind: 'columnHeader' },
            { rowIndex: 0, columnIndex: 2, content: 'Date of Birth', kind: 'columnHeader' },
            { rowIndex: 1, columnIndex: 0, content: 'Jane Doe', kind: 'content' },
            { rowIndex: 1, columnIndex: 1, content: 'Spouse', kind: 'content' },
            { rowIndex: 1, columnIndex: 2, content: '1992-05-20', kind: 'content' },
            { rowIndex: 2, columnIndex: 0, content: 'Baby Doe', kind: 'content' },
            { rowIndex: 2, columnIndex: 1, content: 'Child', kind: 'content' },
            { rowIndex: 2, columnIndex: 2, content: '2020-01-01', kind: 'content' },
        ]
    }
];

const mockResult: DocumentExtractionResult = {
    fields: mockFields,
    queryResults: [],
    tables: mockTables,
    selectionMarks: [],
    barcodes: [],
    metadata: {
        pageCount: 1,
        languages: [{ locale: 'ar-AE', confidence: 0.9 }, { locale: 'en-US', confidence: 0.8 }],
        hasHandwriting: false,
        overallConfidence: 95
    },
    markdownOutput: '',
    extractionMethod: 'azure_document',
    processingTime: 100
};

async function runTests() {
    console.log('🧪 Starting SmartDocumentProcessor Tests...\n');
    const processor = new SmartDocumentProcessor();

    // Test 1: Country Inference
    console.log('Test 1: Country Inference');
    const country = processor.inferCountryFromLanguages(mockResult.metadata.languages);
    console.log(`Expected: UAE, Got: ${country}`);
    if (country === 'UAE') console.log('✅ PASS'); else console.log('❌ FAIL');
    console.log('');

    // Test 2: Date Formatting (UAE format is dd/MM/yyyy)
    console.log('Test 2: Date Formatting (UAE -> dd/MM/yyyy)');
    const formattedDate = processor.formatDateForCountry('1990-01-15', 'dd/MM/yyyy');
    console.log(`Input: 1990-01-15, Expected: 15/01/1990, Got: ${formattedDate}`);
    if (formattedDate === '15/01/1990') console.log('✅ PASS'); else console.log('❌ FAIL');
    console.log('');

    // Test 3: Phone Formatting (UAE local -> 050...)
    console.log('Test 3: Phone Formatting (UAE Local)');
    const formattedPhone = processor.formatPhoneForCountry('+971 50 123 4567', 'UAE', 'local');
    // libphonenumber might output 0501234567 or 050 123 4567 depending on formatNational implementation details
    // We stripped spaces in our implementation
    console.log(`Input: +971 50 123 4567, Expected: 0501234567, Got: ${formattedPhone}`);
    if (formattedPhone === '0501234567') console.log('✅ PASS'); else console.log('❌ FAIL');
    console.log('');

    // Test 4: Critical Checkbox
    console.log('Test 4: Critical Checkbox Analysis');
    const critical = processor.analyzeCriticalCheckboxes([], mockFields);
    console.log('Critical Checkboxes found:', critical);
    if (critical.length === 1 && critical[0].label.includes('arrested') && critical[0].state === 'selected') {
        console.log('✅ PASS');
    } else {
        console.log('❌ FAIL');
    }
    console.log('');

    // Test 5: Table Parsing
    console.log('Test 5: Family Table Parsing');
    const family = processor.extractFamilyMembers(mockTables);
    console.log('Extracted Family:', family);
    if (family.length === 2 && family[0].name === 'Jane Doe') {
        console.log('✅ PASS');
    } else {
        console.log('❌ FAIL');
    }
    console.log('');

    // Test 6: Full Integration
    console.log('Test 6: Full Process Integration');
    const result = processor.process(mockResult);
    console.log('Inferred Country:', result.inferredCountry);
    console.log('Enhanced Fields:', result.enhancedFields);
    console.log('Warnings:', result.warnings);
    console.log('Insights:', result.insights);

    if (
        result.inferredCountry === 'UAE' &&
        result.enhancedFields['Date of Birth'] === '15/01/1990' &&
        result.warnings.length > 0
    ) {
        console.log('✅ PASS');
    } else {
        console.log('❌ FAIL');
    }
}

runTests().catch(console.error);
