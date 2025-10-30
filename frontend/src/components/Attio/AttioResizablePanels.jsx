import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { colors } from '../../styles/theme'
import './AttioResizablePanels.css'

/**
 * AttioResizablePanels - Attio-style resizable panel system
 * 
 * Features:
 * - Three-column draggable layout
 * - 1px light gray divider
 * - Hover: divider turns purple
 * - Smooth transitions
 */

export const AttioPanel = ({ children, defaultSize, minSize = 15, maxSize = 85, ...props }) => {
  return (
    <Panel 
      defaultSize={defaultSize} 
      minSize={minSize}
      maxSize={maxSize}
      {...props}
      style={{
        overflow: 'auto',
        ...props.style,
      }}
    >
      {children}
    </Panel>
  )
}

export const AttioResizeHandle = () => {
  return (
    <PanelResizeHandle className="attio-resize-handle">
      <div className="attio-resize-handle-inner" />
    </PanelResizeHandle>
  )
}

export const AttioPanelGroup = ({ children, direction = 'horizontal', ...props }) => {
  return (
    <PanelGroup 
      direction={direction}
      {...props}
      style={{
        height: '100%',
        width: '100%',
        ...props.style,
      }}
    >
      {children}
    </PanelGroup>
  )
}

// Export all components
export default {
  Group: AttioPanelGroup,
  Panel: AttioPanel,
  ResizeHandle: AttioResizeHandle,
}

