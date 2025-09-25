# SignalStack Logo Usage Guide

## Logo Assets

The SignalStack logo has been integrated throughout the application with the following assets:

### Available Logo Files

- `/public/logo.svg` - Full square logo with chart icon and text (400x400)
- `/public/logo-horizontal.svg` - Horizontal version for headers (200x40)
- `/public/favicon.svg` - Favicon version (32x32)

### Logo Component

The `Logo` component (`/components/Logo.tsx`) provides a flexible way to display the SignalStack logo:

```tsx
import Logo from '@/components/Logo';

// Icon only
<Logo variant="icon" size="large" />

// Horizontal layout (default for headers)
<Logo variant="horizontal" size="medium" clickable />

// Full stacked layout
<Logo variant="full" size="large" />
```

#### Props

- `variant`: `'icon' | 'horizontal' | 'full'`
- `size`: `'small' | 'medium' | 'large'`
- `clickable`: `boolean` (adds hover effects)
- `className`: `string` (additional CSS classes)

## Design Specifications

### Chart Icon

The logo features a minimalist chart with:
- **Orange bars** (`#fb923c`) - representing data points
- **Teal bars** (`#2dd4bf`) - representing growth/signals  
- **Upward arrow** - indicating positive trends
- **Clean typography** - Inter font family

### Color Palette

- **Primary Teal**: `#2dd4bf` (bright accent)
- **Secondary Orange**: `#fb923c` (data visualization)
- **Text**: `#f8fafc` (high contrast white)
- **Background**: `#1e293b` (dark slate)

## Current Integration

### ✅ Implemented

- [x] **Layout Header** - Horizontal logo in navigation
- [x] **Landing Page** - Large icon version as hero element
- [x] **Dashboard** - Consistent branding throughout
- [x] **Favicon** - SVG favicon for browser tabs
- [x] **Logo Component** - Reusable React component
- [x] **Document Meta** - Proper favicon and meta tag setup

### Component Locations

1. **Layout.tsx** - Header navigation logo
2. **index.tsx** - Landing page hero section
3. **_document.tsx** - Favicon and meta tags
4. **Logo.tsx** - Main logo component

## Usage Examples

### Header Navigation
```tsx
<Logo variant="horizontal" size="medium" clickable />
```

### Landing Page Hero
```tsx
<Logo variant="icon" size="large" />
```

### Footer or About Section
```tsx
<Logo variant="full" size="medium" />
```

## Brand Guidelines

- Always maintain proper contrast ratios
- Use the horizontal variant in navigation/headers
- Use the icon variant for compact spaces
- Ensure adequate whitespace around the logo
- Maintain the orange/teal color scheme for consistency

The logo reflects SignalStack's focus on data-driven crypto trading signals with a clean, professional aesthetic that builds trust with traders.