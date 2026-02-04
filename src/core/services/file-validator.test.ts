import { describe, it, expect } from 'vitest';
import { 
    isExtensionAllowed,
    sanitizeFilename,
    getAllowedExtensionsDisplay
} from './file-validator';

describe('File Validator', () => {
    describe('isExtensionAllowed', () => {
        it('should allow JPG files', () => {
            expect(isExtensionAllowed('photo.jpg')).toBe(true);
            expect(isExtensionAllowed('photo.JPG')).toBe(true);
        });

        it('should allow PDF files', () => {
            expect(isExtensionAllowed('document.pdf')).toBe(true);
        });

        it('should allow DOCX files', () => {
            expect(isExtensionAllowed('document.docx')).toBe(true);
        });

        it('should reject EXE files', () => {
            expect(isExtensionAllowed('virus.exe')).toBe(false);
        });

        it('should reject JS files', () => {
            expect(isExtensionAllowed('script.js')).toBe(false);
        });

        it('should reject PHP files', () => {
            expect(isExtensionAllowed('shell.php')).toBe(false);
        });

        it('should use custom allowed list', () => {
            const allowed = ['.pdf'];
            expect(isExtensionAllowed('doc.pdf', allowed)).toBe(true);
            expect(isExtensionAllowed('image.jpg', allowed)).toBe(false);
        });
    });

    describe('sanitizeFilename', () => {
        it('should remove path separators', () => {
            expect(sanitizeFilename('../../../etc/passwd')).not.toContain('..');
            expect(sanitizeFilename('folder/file.txt')).not.toContain('/');
            expect(sanitizeFilename('folder\\file.txt')).not.toContain('\\');
        });

        it('should remove dangerous characters', () => {
            expect(sanitizeFilename('file<script>.txt')).not.toContain('<');
            expect(sanitizeFilename('file|pipe.txt')).not.toContain('|');
        });

        it('should handle hidden files', () => {
            expect(sanitizeFilename('.htaccess')).not.toMatch(/^\./);
        });

        it('should keep valid filenames intact', () => {
            expect(sanitizeFilename('photo.jpg')).toBe('photo.jpg');
            expect(sanitizeFilename('document_v2.pdf')).toBe('document_v2.pdf');
        });
    });

    describe('getAllowedExtensionsDisplay', () => {
        it('should format extensions for display', () => {
            const display = getAllowedExtensionsDisplay(['.jpg', '.png']);
            expect(display).toBe('.jpg, .png');
        });
    });
});
