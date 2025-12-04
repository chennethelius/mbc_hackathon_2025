/**
 * Visual color palette reference component
 * Useful for development to see all theme colors at a glance
 */

import theme from '../theme';

interface ColorSwatchProps {
  name: string;
  color: string;
  textColor?: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ name, color, textColor = theme.colors.textPrimary }) => (
  <div
    style={{
      backgroundColor: color,
      border: theme.borders.thin,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      minHeight: '80px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <div style={{ fontWeight: theme.fontWeights.bold, color: textColor }}>{name}</div>
    <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: textColor }}>{color}</div>
  </div>
);

export const ThemeColorPalette = () => {
  return (
    <div style={{ padding: theme.spacing.xl, backgroundColor: theme.colors.cream }}>
      <h1 style={{ color: theme.colors.textPrimary, fontWeight: theme.fontWeights.bold }}>
        Theme Color Palette
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: theme.spacing.md,
        marginTop: theme.spacing.xl,
      }}>
        <div>
          <h3>Background</h3>
          <ColorSwatch name="Cream" color={theme.colors.cream} />
        </div>

        <div>
          <h3>Primary Pastels</h3>
          <ColorSwatch name="Lavender" color={theme.colors.lavender} />
          <ColorSwatch name="Lavender Light" color={theme.colors.lavenderLight} />
          <ColorSwatch name="Mint Green" color={theme.colors.mintGreen} />
          <ColorSwatch name="Mint Light" color={theme.colors.mintLight} />
          <ColorSwatch name="Pink" color={theme.colors.pink} />
          <ColorSwatch name="Pink Light" color={theme.colors.pinkLight} />
          <ColorSwatch name="Purple" color={theme.colors.purple} />
          <ColorSwatch name="Sky Blue" color={theme.colors.skyBlue} />
          <ColorSwatch name="Peach" color={theme.colors.peach} />
        </div>

        <div>
          <h3>Text Colors</h3>
          <ColorSwatch name="Primary" color={theme.colors.textPrimary} textColor={theme.colors.white} />
          <ColorSwatch name="Secondary" color={theme.colors.textSecondary} textColor={theme.colors.white} />
          <ColorSwatch name="Muted" color={theme.colors.textMuted} textColor={theme.colors.white} />
        </div>
      </div>

      <div style={{ marginTop: theme.spacing.xxl }}>
        <h2>Button Examples</h2>
        <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap', marginTop: theme.spacing.lg }}>
          <button
            style={{
              backgroundColor: theme.componentColors.buttons.primary.background,
              color: theme.componentColors.buttons.primary.text,
              border: theme.borders.thin,
              borderRadius: theme.borderRadius.md,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              fontWeight: theme.fontWeights.bold,
              cursor: 'pointer',
            }}
          >
            Primary Button
          </button>
          
          <button
            style={{
              backgroundColor: theme.componentColors.buttons.secondary.background,
              color: theme.componentColors.buttons.secondary.text,
              border: theme.borders.thin,
              borderRadius: theme.borderRadius.md,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              fontWeight: theme.fontWeights.bold,
              cursor: 'pointer',
            }}
          >
            Secondary Button
          </button>

          <button
            style={{
              backgroundColor: theme.componentColors.buttons.tertiary.background,
              color: theme.componentColors.buttons.tertiary.text,
              border: theme.borders.thin,
              borderRadius: theme.borderRadius.md,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              fontWeight: theme.fontWeights.bold,
              cursor: 'pointer',
            }}
          >
            Tertiary Button
          </button>

          <button
            style={{
              backgroundColor: theme.componentColors.buttons.purple.background,
              color: theme.componentColors.buttons.purple.text,
              border: theme.borders.thin,
              borderRadius: theme.borderRadius.md,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              fontWeight: theme.fontWeights.bold,
              cursor: 'pointer',
            }}
          >
            Purple Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeColorPalette;

