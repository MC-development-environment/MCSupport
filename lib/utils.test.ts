import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
    it('merges class names correctly', () => {
        expect(cn('c-1', 'c-2')).toBe('c-1 c-2')
    })

    it('handles conditional classes', () => {
        expect(cn('c-1', true && 'c-2', false && 'c-3')).toBe('c-1 c-2')
    })

    it('merges tailwind conflicts correctly', () => {
        expect(cn('px-2', 'px-4')).toBe('px-4')
    })
})
