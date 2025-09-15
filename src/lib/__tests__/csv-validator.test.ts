// Mock a simple CSV row validator
export function validateCSVRow(row: string[]): boolean {
  // Check if row has the required number of columns (13 for our buyer schema)
  if (row.length !== 13) {
    return false;
  }
  
  // Check if required fields are not empty
  const [fullName, , phone, city, propertyType, , purpose, budgetMin, budgetMax, timeline, source] = row;
  
  if (!fullName || !phone || !city || !propertyType || !purpose || !timeline || !source) {
    return false;
  }
  
  // Validate budget if provided
  if (budgetMin && isNaN(Number(budgetMin))) {
    return false;
  }
  
  if (budgetMax && isNaN(Number(budgetMax))) {
    return false;
  }
  
  // Validate budget relationship
  const min = Number(budgetMin);
  const max = Number(budgetMax);
  
  if (min && max && min > max) {
    return false;
  }
  
  return true;
}

// Test the validator
describe('CSV Row Validator', () => {
  test('should validate a correct CSV row', () => {
    const validRow = [
      'John Doe',
      'john@example.com',
      '1234567890',
      'Chandigarh',
      'Apartment',
      '2',
      'Buy',
      '1000000',
      '2000000',
      'ZERO_TO_THREE_M',
      'Website',
      'Looking for 2BHK apartment',
      'Hot Lead,Qualified'
    ];
    
    expect(validateCSVRow(validRow)).toBe(true);
  });
  
  test('should reject row with missing required fields', () => {
    const invalidRow = [
      '', // Missing fullName
      'john@example.com',
      '1234567890',
      'Chandigarh',
      'Apartment',
      '2',
      'Buy',
      '1000000',
      '2000000',
      'ZERO_TO_THREE_M',
      'Website',
      'Looking for 2BHK apartment',
      'Hot Lead'
    ];
    
    expect(validateCSVRow(invalidRow)).toBe(false);
  });
  
  test('should reject row with invalid budget range', () => {
    const invalidRow = [
      'John Doe',
      'john@example.com',
      '1234567890',
      'Chandigarh',
      'Apartment',
      '2',
      'Buy',
      '2000000', // min > max
      '1000000',
      'ZERO_TO_THREE_M',
      'Website',
      'Looking for 2BHK apartment',
      'Hot Lead'
    ];
    
    expect(validateCSVRow(invalidRow)).toBe(false);
  });
  
  test('should reject row with invalid budget values', () => {
    const invalidRow = [
      'John Doe',
      'john@example.com',
      '1234567890',
      'Chandigarh',
      'Apartment',
      '2',
      'Buy',
      'invalid', // Not a number
      '2000000',
      'ZERO_TO_THREE_M',
      'Website',
      'Looking for 2BHK apartment',
      'Hot Lead'
    ];
    
    expect(validateCSVRow(invalidRow)).toBe(false);
  });
});