import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
    afterEach(() => {
        cleanup()
    })

    it('renders with default variant', () => {
        render(<Button>Click me</Button>)
        const button = screen.getByRole('button', { name: /click me/i })
        expect(button).toBeDefined()
        expect(button.className).toContain('bg-primary')
    })

    it('renders with destructive variant', () => {
        render(<Button variant="destructive">Delete</Button>)
        const button = screen.getByRole('button', { name: /delete/i })
        expect(button.className).toContain('bg-destructive')
    })

    it('applies custom classes', () => {
        render(<Button className="custom-class">Custom</Button>)
        const button = screen.getByRole('button', { name: /custom/i })
        expect(button.className).toContain('custom-class')
    })
})
