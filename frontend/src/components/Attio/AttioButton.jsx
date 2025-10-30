import { Button } from 'antd'
import { colors } from '../../styles/theme'

/**
 * AttioButton - Pixel-Perfect Attio Style Button
 * 
 * Variants:
 * - primary: Purple background (#6E62E4), white text, font-weight: 500
 * - secondary: Light gray background (#F1F1F0), black text, font-weight: 500
 * - ghost: Transparent, no border, gray text, hover turns black
 */

const AttioButton = ({ 
  children, 
  variant = 'secondary',
  size = 'medium',
  disabled = false,
  ...props 
}) => {
  const sizeStyles = {
    small: {
      height: '28px',
      padding: '0 12px',
      fontSize: '14px',
    },
    medium: {
      height: '36px',
      padding: '0 16px',
      fontSize: '15px',
    },
    large: {
      height: '44px',
      padding: '0 20px',
      fontSize: '16px',
    },
  }

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary.main,      // #6E62E4
      border: 'none',
      color: '#FFFFFF',
      fontWeight: 500,
    },
    secondary: {
      backgroundColor: colors.border.light,      // #F1F1F0
      border: 'none',
      color: colors.text.primary,                // #1A1A1A (black)
      fontWeight: 500,
    },
    ghost: {
      backgroundColor: 'transparent',
      border: 'none',
      color: colors.text.secondary,              // #8A8A87 (gray)
      fontWeight: 500,
    },
  }

  const hoverStyles = {
    primary: {
      backgroundColor: colors.primary.dark,      // Slightly darker purple
    },
    secondary: {
      backgroundColor: colors.border.medium,     // Slightly darker gray #E5E5E4
    },
    ghost: {
      color: colors.text.primary,                // Black on hover
    },
  }

  const baseStyle = {
    borderRadius: '6px',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    ...sizeStyles[size],
    ...variantStyles[variant],
  }

  return (
    <Button
      {...props}
      disabled={disabled}
      style={{
        ...baseStyle,
        ...props.style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, hoverStyles[variant])
        }
        props.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, variantStyles[variant])
        }
        props.onMouseLeave?.(e)
      }}
    >
      {children}
    </Button>
  )
}

export default AttioButton

