# Theme Guide

This project uses a centralized theme system to maintain consistency across all components.

## Theme Files

- **`src/theme.ts`** - Main theme configuration with all colors, spacing, and design tokens
- **`src/theme.d.ts`** - TypeScript type definitions for the theme
- **`src/hooks/useTheme.ts`** - React hook to access theme in components
- **`src/index.css`** - CSS variables that mirror the theme.ts values

## Color Palette

### Background
- **Cream**: `#FFF8E1` - Main page background

### Primary Pastels
- **Lavender**: `#E0CCFF` - Cards, headers, primary sections
- **Lavender Light**: `#F0E4FF` - Hover states, navbar
- **Mint Green**: `#A0FFB0` - Primary action buttons
- **Mint Light**: `#C5FFD0` - Hover states for primary buttons
- **Pink**: `#FFD4D4` - Secondary buttons, accents
- **Pink Light**: `#FFE5E5` - Light backgrounds, tabs
- **Purple**: `#D4B5FF` - Links, special highlights
- **Sky Blue**: `#C5E4FF` - Info elements, settings
- **Peach**: `#FFCFB3` - Additional accent

### Text
- **Primary**: `#2A2A2A` - Main text
- **Secondary**: `#5A5A5A` - Labels, secondary text
- **Muted**: `#8A8A8A` - Disabled, hints

## Usage in CSS

Use CSS variables for consistency:

```css
.my-component {
  background: var(--lavender);
  color: var(--text-primary);
  border: var(--border-thin);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
  transition: var(--transition-fast);
}
```

## Usage in React/TypeScript

Import and use the theme in your components:

```typescript
import { useTheme } from '../hooks/useTheme';
// or
import theme from '../theme';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <div style={{ 
      backgroundColor: theme.colors.mintGreen,
      color: theme.colors.textPrimary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    }}>
      Content
    </div>
  );
}
```

## Component Color Mappings

Pre-defined color combinations for common UI elements:

### Buttons
- **Primary**: Mint green background (`mintGreen` → `mintLight` on hover)
- **Secondary**: Pink background (`pink` → `#FFC4C4` on hover)
- **Tertiary**: Sky blue background (`skyBlue` → `#B5D9FF` on hover)
- **Purple**: Lavender background (`lavender` → `purple` on hover)

### Cards
- **Primary**: Lavender background
- **Secondary**: White background
- **Accent**: Pink light background

### Inputs
- **Background**: White
- **Focus**: Lavender light
- **Border**: Text primary (dark)

## Design Tokens

### Spacing
- `xs`: 0.25rem (4px)
- `sm`: 0.5rem (8px)
- `md`: 1rem (16px)
- `lg`: 1.5rem (24px)
- `xl`: 2rem (32px)
- `xxl`: 3rem (48px)

### Border Radius
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 20px
- `xxl`: 24px

### Borders
- `thin`: 2px solid (for most elements)
- `thick`: 3px solid (for modals, important cards)

### Shadows
- `sm`: Subtle shadow for small elements
- `md`: Standard shadow for cards
- `lg`: Prominent shadow for modals

### Font Weights
- `normal`: 400
- `medium`: 500
- `semibold`: 600
- `bold`: 700

### Transitions
- `fast`: 0.2s - For quick interactions
- `normal`: 0.3s - For standard animations

## Best Practices

1. **Always use theme colors** - Never hardcode hex colors in components
2. **Use CSS variables in CSS files** - For better performance
3. **Use theme object in JS/TS** - For dynamic styling
4. **Maintain consistency** - Keep `theme.ts` and `index.css` in sync
5. **Use component color mappings** - For semantic color choices

## Updating the Theme

To update colors:

1. Update `src/theme.ts`
2. Update corresponding CSS variables in `src/index.css`
3. Test across all components to ensure consistency

## Tea App Design Principles

This theme follows Tea app design principles:
- ✅ No gradients - solid colors only
- ✅ Bold borders (2-3px) on all elements
- ✅ Vivid, saturated pastel colors
- ✅ Clean, flat design
- ✅ Rounded corners throughout
- ✅ Bold typography (600-700 weight)
- ✅ Simple, clean hover effects

