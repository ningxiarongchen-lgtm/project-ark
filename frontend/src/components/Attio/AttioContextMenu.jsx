import { useState, useEffect, useRef } from 'react'
import { 
  EditOutlined, 
  DeleteOutlined, 
  CopyOutlined,
  EyeOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import './AttioContextMenu.css'

/**
 * AttioContextMenu - Custom context menu (right-click)
 * 
 * Features:
 * - Replace browser default context menu
 * - White background, no shadow, thin border
 * - Smooth animations (150ms)
 * - Keyboard navigation
 */

const AttioContextMenu = ({ children, items = [] }) => {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const menuRef = useRef(null)
  const containerRef = useRef(null)

  // Handle right-click
  const handleContextMenu = (e) => {
    e.preventDefault()
    
    // Get container bounds
    const container = containerRef.current
    if (!container) return
    
    const containerRect = container.getBoundingClientRect()
    
    // Calculate position relative to viewport
    let x = e.clientX
    let y = e.clientY
    
    // Adjust if menu would go off-screen
    const menuWidth = 200
    const menuHeight = items.length * 40 + 16
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10
    }
    
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10
    }
    
    setPosition({ x, y })
    setVisible(true)
  }

  // Close menu on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setVisible(false)
      }
    }

    const handleScroll = () => {
      setVisible(false)
    }

    if (visible) {
      document.addEventListener('click', handleClick)
      document.addEventListener('scroll', handleScroll, true)
    }

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [visible])

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && visible) {
        setVisible(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible])

  const handleItemClick = (item) => {
    item.onClick?.()
    setVisible(false)
  }

  return (
    <>
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        {children}
      </div>

      {visible && (
        <div
          ref={menuRef}
          className="attio-context-menu"
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          {items.map((item, index) => (
            item.divider ? (
              <div key={index} className="attio-context-menu-divider" />
            ) : (
              <div
                key={index}
                className={`attio-context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
                onClick={() => !item.disabled && handleItemClick(item)}
              >
                {item.icon && <span className="attio-context-menu-icon">{item.icon}</span>}
                <span className="attio-context-menu-label">{item.label}</span>
                {item.shortcut && <kbd className="attio-context-menu-shortcut">{item.shortcut}</kbd>}
              </div>
            )
          ))}
        </div>
      )}
    </>
  )
}

// Hook for programmatic context menu
export const useAttioContextMenu = () => {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const show = (e) => {
    e.preventDefault()
    setPosition({ x: e.clientX, y: e.clientY })
    setVisible(true)
  }

  const hide = () => {
    setVisible(false)
  }

  return { visible, position, show, hide }
}

// Pre-defined menu items
export const commonContextMenuItems = {
  view: (onClick) => ({
    label: '查看详情',
    icon: <EyeOutlined />,
    onClick,
  }),
  edit: (onClick) => ({
    label: '编辑',
    icon: <EditOutlined />,
    shortcut: '⌘E',
    onClick,
  }),
  copy: (onClick) => ({
    label: '复制',
    icon: <CopyOutlined />,
    shortcut: '⌘C',
    onClick,
  }),
  delete: (onClick) => ({
    label: '删除',
    icon: <DeleteOutlined />,
    danger: true,
    onClick,
  }),
  divider: () => ({
    divider: true,
  }),
}

export default AttioContextMenu

