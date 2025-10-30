import { Table } from 'antd'
import { colors } from '../../styles/theme'
import './AttioTable.css'

/**
 * AttioTable - Pixel-Perfect Attio Style Table
 * 
 * Features:
 * - Extremely minimalist design
 * - NO borders (bordered={false})
 * - NO zebra stripes
 * - Header: transparent background, 12px gray text, font-weight: 500, 1px bottom border
 * - Rows: NO internal dividers, hover shows very light gray background
 */

const AttioTable = ({ 
  columns,
  dataSource,
  pagination = { pageSize: 10 },
  ...props 
}) => {
  // Add Attio styling to columns
  const styledColumns = columns?.map(col => ({
    ...col,
    onHeaderCell: () => ({
      style: {
        backgroundColor: 'transparent',              // NO background
        color: colors.text.secondary,                // Gray #8A8A87
        fontWeight: 500,
        fontSize: '12px',                            // Small font
        padding: '12px 16px',
        borderBottom: `1px solid ${colors.border.light}`,  // Only bottom border
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      },
    }),
    onCell: () => ({
      style: {
        padding: '14px 16px',
        fontSize: '15px',
        color: colors.text.primary,
        border: 'none',                              // NO borders
      },
    }),
  }))

  const tableStyle = {
    ...props.style,
  }

  return (
    <Table
      {...props}
      columns={styledColumns}
      dataSource={dataSource}
      pagination={pagination}
      showHeader={true}
      style={tableStyle}
      className="attio-table"
      rowClassName={() => 'attio-table-row'}
    />
  )
}

export default AttioTable

