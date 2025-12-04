/**
 * Example component demonstrating theme usage
 * This file can be deleted - it's just for reference
 */

import { useTheme } from '../hooks/useTheme';
import theme, { colors, componentColors } from '../theme';

export const ThemeExample = () => {
  // Method 1: Use the hook
  const themeFromHook = useTheme();

  // Method 2: Direct import
  const primaryColor = colors.mintGreen;
  const buttonColors = componentColors.buttons.primary;

  return (
    <div style={{ padding: theme.spacing.xl }}>
      <h2>Theme Usage Examples</h2>

      {/* Example 1: Using theme object directly */}
      <button
        style={{
          backgroundColor: theme.colors.mintGreen,
          color: theme.colors.textPrimary,
          border: theme.borders.thin,
          borderRadius: theme.borderRadius.md,
          padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
          fontWeight: theme.fontWeights.bold,
          cursor: 'pointer',
          transition: theme.transitions.fast,
        }}
      >
        Primary Button
      </button>

      {/* Example 2: Using component color mappings */}
      <button
        style={{
          backgroundColor: componentColors.buttons.secondary.background,
          color: componentColors.buttons.secondary.text,
          border: theme.borders.thin,
          borderRadius: theme.borderRadius.md,
          padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
          fontWeight: theme.fontWeights.bold,
          cursor: 'pointer',
          marginLeft: theme.spacing.md,
        }}
      >
        Secondary Button
      </button>

      {/* Example 3: Card with theme colors */}
      <div
        style={{
          backgroundColor: theme.colors.lavender,
          border: theme.borders.thin,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.xl,
          marginTop: theme.spacing.lg,
          boxShadow: theme.shadows.md,
        }}
      >
        <h3 style={{ color: theme.colors.textPrimary, fontWeight: theme.fontWeights.bold }}>
          Themed Card
        </h3>
        <p style={{ color: theme.colors.textSecondary }}>
          This card uses theme colors for consistency
        </p>
      </div>

      {/* CSS Classes are still preferred for performance */}
      <div className="themed-component">
        <p>For better performance, use CSS classes with CSS variables from index.css</p>
      </div>
    </div>
  );
};

export default ThemeExample;

