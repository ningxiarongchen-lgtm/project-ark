import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { 
  SearchOutlined, 
  ProjectOutlined,
  FileDoneOutlined,
  PlusOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  TeamOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons'
import { colors } from '../../styles/theme'
import './AttioCommandPalette.css'

/**
 * AttioCommandPalette - Global command palette (Cmd+K / Ctrl+K)
 * 
 * Features:
 * - Fuzzy search
 * - Keyboard navigation
 * - Quick actions
 * - Attio-style minimal UI
 */

const AttioCommandPalette = ({ open, onOpenChange }) => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  // Clear search when closed
  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  const handleSelect = (callback) => {
    callback()
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="attio-command-palette-overlay" onClick={() => onOpenChange(false)}>
      <div className="attio-command-palette-container" onClick={(e) => e.stopPropagation()}>
        <Command className="attio-command-palette" label="Command Menu">
          {/* Search Input */}
          <div className="attio-command-input-wrapper">
            <SearchOutlined style={{ color: colors.text.secondary, fontSize: 18 }} />
            <Command.Input
              placeholder="搜索项目、订单或执行操作..."
              value={search}
              onValueChange={setSearch}
              className="attio-command-input"
            />
            <kbd className="attio-command-kbd">ESC</kbd>
          </div>

          <Command.List className="attio-command-list">
            <Command.Empty className="attio-command-empty">
              未找到结果
            </Command.Empty>

            {/* Navigation Group */}
            <Command.Group heading="导航" className="attio-command-group">
              <Command.Item
                onSelect={() => handleSelect(() => navigate('/dashboard'))}
                className="attio-command-item"
              >
                <DashboardOutlined />
                <span>仪表盘</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect(() => navigate('/projects'))}
                className="attio-command-item"
              >
                <ProjectOutlined />
                <span>项目管理</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect(() => navigate('/orders'))}
                className="attio-command-item"
              >
                <FileDoneOutlined />
                <span>订单管理</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect(() => navigate('/products'))}
                className="attio-command-item"
              >
                <DatabaseOutlined />
                <span>产品数据库</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect(() => navigate('/suppliers'))}
                className="attio-command-item"
              >
                <TeamOutlined />
                <span>供应商管理</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect(() => navigate('/service-center'))}
                className="attio-command-item"
              >
                <CustomerServiceOutlined />
                <span>售后服务</span>
              </Command.Item>
            </Command.Group>

            {/* Actions Group */}
            <Command.Group heading="操作" className="attio-command-group">
              <Command.Item
                onSelect={() => handleSelect(() => navigate('/projects'))}
                className="attio-command-item"
              >
                <PlusOutlined />
                <span>新建项目</span>
                <kbd className="attio-command-shortcut">⌘N</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect(() => navigate('/orders'))}
                className="attio-command-item"
              >
                <PlusOutlined />
                <span>新建订单</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect(() => window.location.reload())}
                className="attio-command-item"
              >
                <SearchOutlined />
                <span>刷新页面</span>
                <kbd className="attio-command-shortcut">⌘R</kbd>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}

export default AttioCommandPalette

