/**
 * Attio Design System Theme Configuration (Pixel-Perfect)
 * 
 * This theme configuration precisely replicates Attio's design aesthetic
 * Reference: https://refero.design/websites/37
 */

// Color Palette - Attio Exact Colors
export const colors = {
  // Primary Accent Color - Attio Purple
  primary: {
    main: '#6E62E4',      // Attio signature purple
    light: '#8F85E9',
    dark: '#5A4FCC',
    50: '#F5F4FE',
    100: '#ECEAFB',
    200: '#DDD9F8',
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',    // Pure white - main page background
    secondary: '#FBFBFA',  // Very light warm gray - sidebar/panels
    tertiary: '#F7F7F6',   // Slightly darker warm gray
  },
  
  // Border & Divider Colors
  border: {
    light: '#F1F1F0',      // Light gray - main dividers
    medium: '#E5E5E4',     // Medium gray
    dark: '#D4D4D2',       // Darker borders
  },
  
  // Text Colors
  text: {
    primary: '#1A1A1A',    // Almost black - primary text
    secondary: '#8A8A87',  // Medium gray - secondary text
    tertiary: '#B8B8B5',   // Light gray - placeholders
    inverse: '#FFFFFF',    // White text on dark backgrounds
  },
  
  // Semantic Colors (subtle, Attio-style)
  success: {
    light: '#E8F5E9',
    main: '#10B981',
    dark: '#059669',
  },
  warning: {
    light: '#FFF8E1',
    main: '#F59E0B',
    dark: '#D97706',
  },
  error: {
    light: '#FFEBEE',
    main: '#EF4444',
    dark: '#DC2626',
  },
  info: {
    light: '#E3F2FD',
    main: '#3B82F6',
    dark: '#2563EB',
  },
}

// Typography
export const typography = {
  fontFamily: {
    primary: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
    mono: '"SF Mono", "Cascadia Code", "Consolas", "Monaco", monospace',
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '0.9375rem', // 15px
    md: '1rem',        // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
}

// Spacing Scale
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
}

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px
  base: '0.5rem',   // 8px
  md: '0.625rem',   // 10px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
}

// Shadows - Attio uses MINIMAL shadows (flat design)
export const shadows = {
  none: 'none',  // Attio's preference: no shadows, use borders instead
  // Only keep minimal shadows for dropdowns/modals when absolutely necessary
  dropdown: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
}

// Transitions
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slowest: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
}

// Z-index Scale
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
}

// Ant Design Theme Token Configuration - Attio Style (Pixel-Perfect)
export const antdTheme = {
  token: {
    // Colors - Attio Palette (EXACT as per user specification)
    colorPrimary: '#6E62E4',              // Attio Purple
    colorSuccess: colors.success.main,
    colorWarning: colors.warning.main,
    colorError: colors.error.main,
    colorInfo: colors.info.main,
    colorText: '#1A1A1A',                 // Primary text
    colorTextSecondary: '#8A8A87',        // Secondary text
    colorBorder: '#F1F1F0',               // Light border
    colorBgLayout: '#FFFFFF',             // Layout background
    
    // Border - Attio uses 6px radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    
    // Typography - Inter font (EXACT as per user specification)
    fontFamily: "'Inter', sans-serif",
    fontSize: 15,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,
    fontWeightStrong: 600,
    
    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
    
    // Control Heights
    controlHeight: 36,
    controlHeightLG: 44,
    controlHeightSM: 28,
    
    // NO SHADOWS - Attio flat design
    boxShadow: 'none',
    boxShadowSecondary: 'none',
    boxShadowTertiary: 'none',
    
    // Motion
    motionDurationFast: '0.15s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },
  components: {
    Layout: {
      siderBg: '#FBFBFA',                   // EXACT as per user specification
      headerBg: '#FFFFFF',                  // EXACT as per user specification
      headerHeight: 64,
      headerPadding: '0 24px',
      bodyBg: '#FFFFFF',
      triggerBg: '#F7F7F6',
    },
    Menu: {
      itemBg: 'transparent',                // EXACT as per user specification
      itemHoverBg: '#F1F1F0',               // EXACT as per user specification
      itemSelectedBg: '#F1F1F0',            // EXACT as per user specification
      itemActiveBg: '#F1F1F0',              // EXACT as per user specification
      itemSelectedColor: '#6E62E4',
      itemHoverColor: '#1A1A1A',
      itemColor: '#8A8A87',
      iconSize: 18,
      itemHeight: 40,
      itemMarginInline: 8,
      itemBorderRadius: 6,
    },
    Button: {
      defaultBg: '#F1F1F0',                 // EXACT as per user specification
      defaultColor: '#1A1A1A',              // EXACT as per user specification
      defaultBorderColor: 'transparent',    // EXACT as per user specification
      borderRadius: 6,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      paddingContentHorizontal: 16,
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
    },
    Card: {
      borderRadiusLG: 8,
      paddingLG: 24,
      boxShadow: 'none',
      headerHeight: 56,
      colorBorderSecondary: '#F1F1F0',
    },
    Table: {
      headerBg: '#FFFFFF',                  // EXACT as per user specification
      headerColor: '#8A8A87',               // EXACT as per user specification
      borderColor: '#F1F1F0',
      rowHoverBg: '#F7F7F6',
      headerBorderRadius: 0,
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      fontSize: 14,
    },
    Input: {
      activeBorderColor: '#6E62E4',         // EXACT as per user specification
      hoverBorderColor: '#6E62E4',          // EXACT as per user specification
      borderRadius: 6,
      controlHeight: 36,
      paddingBlock: 8,
      paddingInline: 12,
      fontSize: 15,
      colorBorder: '#F1F1F0',
      colorBgContainer: '#FFFFFF',
      activeShadow: 'none',
    },
    Select: {
      borderRadius: 6,
      controlHeight: 36,
      fontSize: 15,
      optionPadding: '8px 12px',
    },
    Modal: {
      borderRadiusLG: 8,
      headerBg: '#FFFFFF',
      contentBg: '#FFFFFF',
      titleFontSize: 20,
      titleLineHeight: 1.4,
      boxShadow: 'none',
    },
    Dropdown: {
      borderRadiusLG: 6,
      boxShadow: 'none',
      paddingBlock: 4,
    },
    Popover: {
      boxShadow: 'none',
    },
    Tabs: {
      itemColor: '#8A8A87',
      itemSelectedColor: '#1A1A1A',
      itemHoverColor: '#1A1A1A',
      inkBarColor: '#6E62E4',
      titleFontSize: 15,
    },
    Badge: {
      fontWeight: 500,
      fontSize: 12,
    },
    Tag: {
      borderRadiusSM: 4,
      fontSize: 13,
      fontWeight: 500,
    },
  },
}

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  antdTheme,
}

