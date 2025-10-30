import { Input } from 'antd'
import { colors } from '../../styles/theme'

/**
 * AttioInput - Pixel-Perfect Attio Style Input
 * 
 * Features:
 * - NO border, background color #FBFBFA
 * - Only on FOCUS: bottom 1px purple border appears
 * - Prefix icon color: gray #8A8A87
 */

const AttioInput = ({ 
  size = 'default',
  prefix,
  ...props 
}) => {
  const sizeStyles = {
    small: {
      height: '28px',
      fontSize: '14px',
      padding: '4px 12px',
    },
    default: {
      height: '36px',
      fontSize: '15px',
      padding: '8px 12px',
    },
    large: {
      height: '44px',
      fontSize: '16px',
      padding: '10px 14px',
    },
  }

  const inputStyle = {
    borderRadius: '6px',
    border: 'none',                                    // NO border
    borderBottom: '1px solid transparent',             // Prepare for focus state
    backgroundColor: colors.background.secondary,      // #FBFBFA
    fontSize: sizeStyles[size].fontSize,
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: 'none',
    ...props.style,
  }

  // Style the prefix icon
  const prefixWithStyle = prefix && (
    <span style={{ color: colors.text.secondary, fontSize: '16px' }}>
      {prefix}
    </span>
  )

  return (
    <Input
      {...props}
      prefix={prefixWithStyle || prefix}
      size={size}
      style={inputStyle}
      onFocus={(e) => {
        // On focus: show purple bottom border
        e.target.style.borderBottom = `1px solid ${colors.primary.main}`
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        // On blur: hide border
        e.target.style.borderBottom = '1px solid transparent'
        props.onBlur?.(e)
      }}
      styles={{
        input: {
          color: colors.text.primary,
          backgroundColor: 'transparent',
        },
      }}
    />
  )
}

// Export TextArea variant
const AttioTextArea = ({ 
  rows = 4,
  ...props 
}) => {
  const textAreaStyle = {
    borderRadius: '6px',
    border: 'none',
    borderBottom: '1px solid transparent',
    backgroundColor: colors.background.secondary,      // #FBFBFA
    fontSize: '15px',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: 'none',
    ...props.style,
  }

  return (
    <Input.TextArea
      {...props}
      rows={rows}
      style={textAreaStyle}
      onFocus={(e) => {
        e.target.style.borderBottom = `1px solid ${colors.primary.main}`
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        e.target.style.borderBottom = '1px solid transparent'
        props.onBlur?.(e)
      }}
    />
  )
}

// Export Password variant
const AttioPassword = ({ 
  size = 'default',
  ...props 
}) => {
  const passwordStyle = {
    borderRadius: '6px',
    border: 'none',
    borderBottom: '1px solid transparent',
    backgroundColor: colors.background.secondary,      // #FBFBFA
    fontSize: '15px',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: 'none',
    ...props.style,
  }

  return (
    <Input.Password
      {...props}
      size={size}
      style={passwordStyle}
      onFocus={(e) => {
        e.target.parentElement.style.borderBottom = `1px solid ${colors.primary.main}`
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        e.target.parentElement.style.borderBottom = '1px solid transparent'
        props.onBlur?.(e)
      }}
    />
  )
}

AttioInput.TextArea = AttioTextArea
AttioInput.Password = AttioPassword

export default AttioInput

