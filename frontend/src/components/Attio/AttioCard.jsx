import { Card } from 'antd'
import { colors } from '../../styles/theme'

/**
 * AttioCard - Styled card component following Attio design
 * 
 * Features:
 * - Flat design (no shadows)
 * - Clean borders
 * - 8px border radius
 * - Minimal padding
 */

const AttioCard = ({ 
  children, 
  title,
  extra,
  padding = 'default',
  bordered = true,
  ...props 
}) => {
  const paddingStyles = {
    compact: '16px',
    default: '24px',
    loose: '32px',
  }

  const cardStyle = {
    borderRadius: '8px',
    border: bordered ? `1px solid ${colors.border.light}` : 'none',
    backgroundColor: colors.background.primary,
    boxShadow: 'none',
    ...props.style,
  }

  const headStyle = {
    borderBottom: `1px solid ${colors.border.light}`,
    padding: '16px 24px',
    backgroundColor: 'transparent',
  }

  const bodyStyle = {
    padding: paddingStyles[padding],
  }

  const titleStyle = {
    fontSize: '18px',
    fontWeight: 600,
    color: colors.text.primary,
    letterSpacing: '-0.01em',
  }

  return (
    <Card
      {...props}
      title={title}
      extra={extra}
      style={cardStyle}
      styles={{
        header: headStyle,
        body: bodyStyle,
        title: titleStyle,
      }}
    >
      {children}
    </Card>
  )
}

export default AttioCard

