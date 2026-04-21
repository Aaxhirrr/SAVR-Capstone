import React, { useEffect } from 'react';
import useThemeStore from '../stores/themeStore';

type ThemeProviderProps = {
  children: React.ReactNode;
};

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { getTheme } = useThemeStore();
  
  useEffect(() => {
    // Apply theme colors to CSS variables
    const applyTheme = () => {
      const theme = getTheme();
      const root = document.documentElement;
      
      // Convert hex colors to HSL for CSS variables
      const convertHexToHSL = (hex: string) => {
        // Remove the # if present
        hex = hex.replace('#', '');
        
        // Parse the r, g, b values
        let r = parseInt(hex.substring(0, 2), 16) / 255;
        let g = parseInt(hex.substring(2, 4), 16) / 255;
        let b = parseInt(hex.substring(4, 6), 16) / 255;
        
        // Find the min and max values to determine lightness
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          
          h /= 6;
        }
        
        // Convert to the proper format
        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);
        
        return `${h} ${s}% ${l}%`;
      };
      
      // Set main Tailwind CSS variables based on theme colors
      root.style.setProperty('--primary', convertHexToHSL(theme.colors.primary));
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      
      // Background is either light or dark based on theme
      if (theme.id === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Apply custom CSS variables for all theme colors
      Object.entries(theme.colors).forEach(([key, value]) => {
        // Set both the direct color and HSL version
        root.style.setProperty(`--theme-${key}`, value);
        
        try {
          // Only convert valid hex colors
          if (value && value.startsWith('#')) {
            root.style.setProperty(`--theme-${key}-hsl`, convertHexToHSL(value));
          }
        } catch (error) {
          console.error(`Error converting color ${key}: ${value}`);
        }
      });
      
      // Apply body background color for more consistent experience
      document.body.style.backgroundColor = theme.colors.background;
      document.body.style.color = theme.colors.foreground;
    };
    
    applyTheme();
    
    // Listen for theme changes
    window.addEventListener('storage', applyTheme);
    return () => {
      window.removeEventListener('storage', applyTheme);
    };
  }, [getTheme]);
  
  return <>{children}</>;
};

export default ThemeProvider; 