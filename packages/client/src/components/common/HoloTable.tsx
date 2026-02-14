import type { CSSProperties, ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface HoloTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  style?: CSSProperties;
  emptyMessage?: string;
}

const cellStyle: CSSProperties = {
  padding: '6px 12px',
  fontSize: 13,
  fontFamily: 'var(--font-body)',
  borderBottom: '1px solid var(--color-border)',
};

export default function HoloTable<T>({ columns, data, rowKey, style, emptyMessage }: HoloTableProps<T>) {
  return (
    <div style={{ overflow: 'auto', ...style }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{
                ...cellStyle,
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: 1.5,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                textAlign: col.align || 'left',
                width: col.width,
                borderBottom: '1px solid var(--color-border-bright)',
              }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ ...cellStyle, textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>
                {emptyMessage || 'No data'}
              </td>
            </tr>
          ) : data.map((row, i) => (
            <tr key={rowKey(row, i)} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
              {columns.map((col) => (
                <td key={col.key} style={{ ...cellStyle, textAlign: col.align || 'left', color: 'var(--color-text-primary)' }}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
