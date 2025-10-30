/**
 * Attio Components Library
 * 
 * A collection of styled components following Attio's design system.
 * All components feature:
 * - Flat design (no shadows)
 * - Clean borders and dividers
 * - Consistent spacing and typography
 * - Smooth transitions
 * - Inter font family
 */

export { default as AttioButton } from './AttioButton'
export { default as AttioCard } from './AttioCard'
export { default as AttioInput } from './AttioInput'
export { default as AttioTable } from './AttioTable'
export { default as AttioTag } from './AttioTag'

// Advanced Layout Components
export { 
  default as AttioResizablePanels,
  AttioPanelGroup,
  AttioPanel,
  AttioResizeHandle,
} from './AttioResizablePanels'

// Interactive Components
export { default as AttioCommandPalette } from './AttioCommandPalette'
export { 
  default as AttioContextMenu,
  useAttioContextMenu,
  commonContextMenuItems,
} from './AttioContextMenu'

