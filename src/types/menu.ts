
export interface MenuItem {
  id: string;
  label: string;
  icon: string; // SVG path or icon name
  path: string;
  parentId?: string; // For submenu items
  order: number;
  isActive: boolean;
  permissions?: string[]; // Optional permissions required
}