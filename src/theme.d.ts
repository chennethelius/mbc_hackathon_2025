/**
 * Type definitions for theme
 */

export interface Theme {
  colors: {
    cream: string;
    lavender: string;
    lavenderLight: string;
    mintGreen: string;
    mintLight: string;
    pink: string;
    pinkLight: string;
    purple: string;
    skyBlue: string;
    peach: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    white: string;
    black: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borders: {
    thin: string;
    thick: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  fontWeights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  transitions: {
    fast: string;
    normal: string;
  };
  componentColors: {
    navbar: {
      background: string;
      text: string;
    };
    buttons: {
      primary: {
        background: string;
        hover: string;
        text: string;
      };
      secondary: {
        background: string;
        hover: string;
        text: string;
      };
      tertiary: {
        background: string;
        hover: string;
        text: string;
      };
      purple: {
        background: string;
        hover: string;
        text: string;
      };
    };
    cards: {
      primary: string;
      secondary: string;
      accent: string;
    };
    inputs: {
      background: string;
      focusBackground: string;
      border: string;
    };
    page: {
      background: string;
    };
  };
  cssVar: (value: string) => string;
}

declare const theme: Theme;
export default theme;

