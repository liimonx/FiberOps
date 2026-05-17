import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validateData, safeValidateData } from './validation';

describe('Validation Utilities', () => {
  const TestSchema = z.object({
    id: z.number(),
    name: z.string().min(3),
  });

  describe('validateData', () => {
    it('should return parsed data when valid', () => {
      const validData = { id: 1, name: 'Test' };
      const result = validateData(TestSchema, validData);
      expect(result).toEqual(validData);
    });

    it('should throw an error when schema is undefined', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => validateData(undefined as any, {})).toThrow('Validation failed: Schema is undefined');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[Validation Error] Schema is undefined'));
      consoleErrorSpy.mockRestore();
    });

    it('should throw a formatted error string when data is invalid', () => {
      const invalidData = { id: 'string', name: 'Te' };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => validateData(TestSchema, invalidData)).toThrow('Data validation failed: id: Invalid input: expected number, received string, name: Too small: expected string to have >=3 characters');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('safeValidateData', () => {
    it('should return success and parsed data when valid', () => {
      const validData = { id: 1, name: 'Test' };
      const result = safeValidateData(TestSchema, validData);
      expect(result).toEqual({ success: true, data: validData });
    });

    it('should return error object when schema is undefined', () => {
      const result = safeValidateData(undefined as any, {});
      expect(result).toEqual({ success: false, error: 'Validation failed: Schema is undefined' });
    });

    it('should return error details when data is invalid', () => {
      const invalidData = { id: 'string', name: 'Te' };
      const result = safeValidateData(TestSchema, invalidData);
      expect(result).toEqual({
        success: false,
        error: 'id: Invalid input: expected number, received string, name: Too small: expected string to have >=3 characters'
      });
    });
  });
});
