// Design tokens for consistent styling across network map components

export const COLORS = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },
  
  // Semantic status colors
  status: {
    active: '#10b981',
    inactive: '#6b7280', 
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  
  // Grayscale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  
  // Map-specific colors
  map: {
    background: '#1f2937',
    canvas: '#111827',
    grid: '#374151',
    highlight: '#3b82f6',
    selection: '#f59e0b'
  }
} as const;

export const SPACING = {
  xs: '4px',
  sm: '8px', 
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    primary: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace'
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px', 
    lg: '18px',
    xl: '20px',
    xxl: '24px'
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  }
} as const;

export const BORDER = {
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px'
  },
  width: {
    thin: '1px',
    normal: '2px',
    thick: '4px'
  }
} as const;

export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
} as const;

export const Z_INDEX = {
  map: 0,
  controls: 10,
  toolbar: 20, 
  panel: 30,
  modal: 40,
  tooltip: 50
} as const;

// Animation and transition values
export const MOTION = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)'
  }
} as const;

// CSS utility functions
export const cssUtils = {
  // Convert design tokens to CSS custom properties
  toCustomProperties: () => {
    const props: Record<string, string> = {};
    
    // Color properties
    Object.entries(COLORS).forEach(([category, values]) => {
      Object.entries(values).forEach(([shade, value]) => {
        props[`--color-${category}-${shade}`] = value;
      });
    });
    
    // Spacing properties
    Object.entries(SPACING).forEach(([size, value]) => {
      props[`--spacing-${size}`] = value;
    });
    
    // Typography properties  
    Object.entries(TYPOGRAPHY.fontSize).forEach(([size, value]) => {
      props[`--font-size-${size}`] = value;
    });
    
    return props;
  },
  
  // Generate responsive styles
  responsive: (values: { mobile: string; tablet: string; desktop: string }) => {
    return {
      '@media (max-width: 767px)': { value: values.mobile },
      '@media (min-width: 768px) and (max-width: 1023px)': { value: values.tablet },
      '@media (min-width: 1024px)': { value: values.desktop }
    };
  }
};