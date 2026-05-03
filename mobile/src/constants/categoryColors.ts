export const CATEGORY_COLORS = [
  '#E85D3A',
  '#F5A623',
  '#3498DB',
  '#2ECC71',
  '#E91E8C',
  '#9B59B6',
  '#FF8C42',
  '#E74C3C',
  '#1ABC9C',
  '#5B6ABF',
] as const;

export function getCategoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

export const ACCENT = '#6C4EF2';
export const ACCENT_LIGHT = '#8B6FF7';
export const CORAL = '#E85D3A';
