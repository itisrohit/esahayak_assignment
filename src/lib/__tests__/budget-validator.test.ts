import { validateBudget } from '../buyer-service';

describe('Budget Validator', () => {
  test('should validate valid budget range', () => {
    expect(() => validateBudget(100000, 500000)).not.toThrow();
  });

  test('should throw error when budgetMin is greater than budgetMax', () => {
    expect(() => validateBudget(500000, 100000)).toThrow('budgetMin must be less than or equal to budgetMax');
  });

  test('should allow equal budgetMin and budgetMax values', () => {
    expect(() => validateBudget(300000, 300000)).not.toThrow();
  });

  test('should allow null values for budgetMin or budgetMax', () => {
    expect(() => validateBudget(null, 500000)).not.toThrow();
    expect(() => validateBudget(100000, null)).not.toThrow();
    expect(() => validateBudget(null, null)).not.toThrow();
  });
});