import { describe, it, expect } from 'vitest';
import { 
    validatePassword, 
    getStrengthLabel, 
    getPasswordRequirements,
    DEFAULT_POLICY 
} from './password-validator';

describe('Password Validator', () => {
    describe('validatePassword', () => {
        it('should reject empty password', () => {
            const result = validatePassword('');
            
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('La contraseña es requerida');
            expect(result.strength).toBe('weak');
        });

        it('should reject short passwords', () => {
            const result = validatePassword('Abc1');
            
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('Mínimo');
        });

        it('should require uppercase letters', () => {
            const result = validatePassword('abcdefgh1');
            
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Incluir al menos una letra mayúscula');
        });

        it('should require lowercase letters', () => {
            const result = validatePassword('ABCDEFGH1');
            
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Incluir al menos una letra minúscula');
        });

        it('should require numbers', () => {
            const result = validatePassword('AbcdefgH');
            
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Incluir al menos un número');
        });

        it('should accept valid password', () => {
            const result = validatePassword('SecurePass123');
            
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.score).toBeGreaterThanOrEqual(60);
        });

        it('should reject common passwords', () => {
            const result = validatePassword('Password123');
            
            // It meets requirements but is common
            expect(result.errors).toContain('Esta contraseña es muy común');
        });

        it('should penalize repeating characters', () => {
            const result = validatePassword('Aaaaa12345');
            
            expect(result.errors).toContain('Evitar caracteres repetidos consecutivos');
        });

        it('should give bonus for special characters', () => {
            const withSpecial = validatePassword('SecurePass123!');
            const withoutSpecial = validatePassword('SecurePass123');
            
            expect(withSpecial.score).toBeGreaterThan(withoutSpecial.score);
        });

        it('should give higher score for longer passwords', () => {
            const short = validatePassword('SecurP1');
            const medium = validatePassword('SecurePass123');
            const long = validatePassword('VerySecurePassword123!');
            
            expect(medium.score).toBeGreaterThan(short.score);
            expect(long.score).toBeGreaterThan(medium.score);
        });
    });

    describe('strength levels', () => {
        it('should classify weak passwords', () => {
            const result = validatePassword('abc');
            expect(result.strength).toBe('weak');
        });

        it('should classify strong passwords', () => {
            const result = validatePassword('V3ryStr0ngP@ssw0rd!');
            expect(result.strength).toBe('strong');
        });
    });

    describe('getStrengthLabel', () => {
        it('should return correct labels', () => {
            expect(getStrengthLabel('weak')).toEqual({ label: 'Débil', color: 'red' });
            expect(getStrengthLabel('fair')).toEqual({ label: 'Regular', color: 'orange' });
            expect(getStrengthLabel('good')).toEqual({ label: 'Buena', color: 'yellow' });
            expect(getStrengthLabel('strong')).toEqual({ label: 'Fuerte', color: 'green' });
        });
    });

    describe('getPasswordRequirements', () => {
        it('should return requirements list', () => {
            const requirements = getPasswordRequirements();
            
            expect(requirements).toContain(`Mínimo ${DEFAULT_POLICY.minLength} caracteres`);
            expect(requirements).toContain('Al menos una letra mayúscula (A-Z)');
            expect(requirements).toContain('Al menos una letra minúscula (a-z)');
            expect(requirements).toContain('Al menos un número (0-9)');
        });

        it('should include special chars requirement when enabled', () => {
            const requirements = getPasswordRequirements({
                ...DEFAULT_POLICY,
                requireSpecialChars: true
            });
            
            expect(requirements).toContain('Al menos un carácter especial (!@#$%^&*)');
        });
    });
});
