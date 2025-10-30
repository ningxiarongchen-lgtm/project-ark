import { Tag } from 'antd'
import { colors } from '../../styles/theme'

/**
 * AttioTag - Styled tag component following Attio design
 * 
 * Features:
 * - Subtle, flat design
 * - Clean borders
 * - Color-coded variants
 * - 4px border radius
 */

const AttioTag = ({ 
  children,
  color = 'default',
  ...props 
}) => {
  const colorVariants = {
    default: {
      backgroundColor: colors.background.secondary,
      borderColor: colors.border.medium,
      color: colors.text.primary,
    },
    primary: {
      backgroundColor: colors.primary[50],
      borderColor: colors.primary[200],
      color: colors.primary.main,
    },
    success: {
      backgroundColor: colors.success.light,
      borderColor: colors.success.main,
      color: colors.success.dark,
    },
    warning: {
      backgroundColor: colors.warning.light,
      borderColor: colors.warning.main,
      color: colors.warning.dark,
    },
    error: {
      backgroundColor: colors.error.light,
      borderColor: colors.error.main,
      color: colors.error.dark,
    },
    info: {
      backgroundColor: colors.info.light,
      borderColor: colors.info.main,
      color: colors.info.dark,
    },
  }

  const tagStyle = {
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 500,
    padding: '2px 10px',
    border: `1px solid ${colorVariants[color]?.borderColor || colors.border.medium}`,
    backgroundColor: colorVariants[color]?.backgroundColor || colors.background.secondary,
    color: colorVariants[color]?.color || colors.text.primary,
    ...props.style,
  }

  return (
    <Tag
      {...props}
      style={tagStyle}
    >
      {children}
    </Tag>
  )
}

export default AttioTag

