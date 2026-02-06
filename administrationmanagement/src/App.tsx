// packages/app-products/src/Products.tsx
import React from 'react';

// 🎨 Option 1: Import just the CSS (if not using ThemeProvider wrapper)
// import 'theme/styles';

// 🎨 Option 2: Use the hook if wrapped in ThemeProvider (recommended)
// @ts-ignore
//import ThemeProvider  from './themes/ThemeProvider';
import { useTheme } from './themes/ThemeProvider';

interface Product {
  id: number;
  name: string;
  price: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

const products: Product[] = [
  { id: 1, name: 'Wireless Headphones', price: 99.99, status: 'in-stock' },
  { id: 2, name: 'Mechanical Keyboard', price: 149.99, status: 'low-stock' },
  { id: 3, name: 'USB-C Hub', price: 49.99, status: 'in-stock' },
  { id: 4, name: '4K Monitor', price: 399.99, status: 'out-of-stock' },
];

const statusBadgeClass: Record<Product['status'], string> = {
  'in-stock': 'badge badge-success',
  'low-stock': 'badge badge-warning',
  'out-of-stock': 'badge badge-error',
};

const statusLabel: Record<Product['status'], string> = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
};

export default function App() {
 const { theme, setTheme, toggleDarkMode, isDark } = useTheme();

  return (
    <div style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>
      {/* Display current theme */}
      <p>Current theme: {theme}</p>
      <p>Is dark mode: {isDark ? 'Yes' : 'No'}</p>

      {/* Toggle dark/light */}
      <button onClick={toggleDarkMode}>
        {isDark ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
      </button>

      {/* Set specific theme */}
      <button onClick={() => setTheme('brand-a')}>
        Use Brand A Theme
      </button>

        <button className="btn btn-secondaryoij" style={{ color: "var(--color-primary)"  } } onClick={toggleDarkMode}>
        {isDark ? '☀️ Light' : '🌙 Dark'}
      </button>
    </div>
  );
}