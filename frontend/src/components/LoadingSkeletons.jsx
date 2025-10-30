/**
 * Loading Skeleton Components
 * 
 * Reusable skeleton screens for different content types
 * Follows Attio's design language with subtle animations
 */

import { Skeleton, Card } from 'antd';
import { colors } from '../styles/theme';

/**
 * Table Skeleton - For data tables
 */
export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div style={{ padding: '24px', background: colors.background.primary }}>
      {/* Statistics cards skeleton */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {[1, 2, 3, 4].map(i => (
          <Card key={i} variant="borderless" style={{ borderRadius: 8 }}>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card variant="borderless" style={{ borderRadius: 8 }}>
        {/* Table header */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 16,
          padding: '12px 16px',
          borderBottom: `1px solid ${colors.border.light}`
        }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton.Button key={i} active size="small" style={{ width: '100%' }} />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 16,
            padding: '16px',
            borderBottom: rowIndex < rows - 1 ? `1px solid ${colors.border.light}` : 'none'
          }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} active paragraph={false} />
            ))}
          </div>
        ))}
      </Card>
    </div>
  );
};

/**
 * List Skeleton - For list views
 */
export const ListSkeleton = ({ items = 5 }) => {
  return (
    <div style={{ padding: '24px' }}>
      {Array.from({ length: items }).map((_, index) => (
        <Card 
          key={index} 
          variant="borderless" 
          style={{ 
            marginBottom: 16,
            borderRadius: 8,
            border: `1px solid ${colors.border.light}`
          }}
        >
          <Skeleton active avatar paragraph={{ rows: 2 }} />
        </Card>
      ))}
    </div>
  );
};

/**
 * Details Skeleton - For detail pages
 */
export const DetailsSkeleton = () => {
  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card variant="borderless" style={{ marginBottom: 24, borderRadius: 8 }}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>

      {/* Content sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card variant="borderless" style={{ borderRadius: 8 }}>
          <Skeleton active paragraph={{ rows: 5 }} />
        </Card>
        <Card variant="borderless" style={{ borderRadius: 8 }}>
          <Skeleton active paragraph={{ rows: 5 }} />
        </Card>
      </div>

      {/* Additional sections */}
      <Card variant="borderless" style={{ marginTop: 24, borderRadius: 8 }}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    </div>
  );
};

/**
 * Dashboard Skeleton - For dashboard pages
 */
export const DashboardSkeleton = () => {
  return (
    <div style={{ padding: '24px' }}>
      {/* Statistics cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {[1, 2, 3, 4].map(i => (
          <Card key={i} variant="borderless" style={{ borderRadius: 8 }}>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        ))}
      </div>

      {/* Charts section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        <Card variant="borderless" style={{ borderRadius: 8 }}>
          <Skeleton.Image active style={{ width: '100%', height: 300 }} />
        </Card>
        <Card variant="borderless" style={{ borderRadius: 8 }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>

      {/* Recent activities */}
      <Card variant="borderless" style={{ borderRadius: 8 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    </div>
  );
};

/**
 * Form Skeleton - For form pages
 */
export const FormSkeleton = () => {
  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      <Card variant="borderless" style={{ borderRadius: 8 }}>
        <Skeleton active paragraph={{ rows: 1 }} />
        <div style={{ marginTop: 24 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} style={{ marginBottom: 24 }}>
              <Skeleton.Button active size="small" style={{ width: 120, marginBottom: 8 }} />
              <Skeleton.Input active style={{ width: '100%' }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Skeleton.Button active style={{ width: 80 }} />
          <Skeleton.Button active style={{ width: 80 }} />
        </div>
      </Card>
    </div>
  );
};

export default {
  TableSkeleton,
  ListSkeleton,
  DetailsSkeleton,
  DashboardSkeleton,
  FormSkeleton
};

