import theme from '../theme';

/**
 * Custom hook to access theme values
 * Can be extended later to support theme switching (light/dark mode)
 */
export const useTheme = () => {
  return theme;
};

export default useTheme;

