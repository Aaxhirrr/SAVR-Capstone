import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = {
  id: string;
  name: string;
  colors: Record<string, string>;
}

// Define the themes based on user specifications
export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Default Green',
    colors: {
      // Main colors
      primary: '#71C278', // Main Logo Green
      primaryDark: '#204529', // Dark Green  
      accent: '#E31836', // Red
      // Secondary colors
      secondary: '#D4E498', // Light mint green
      tertiary: '#EFD3B1', // Peach
      // UI colors
      background: '#FCFCFC',
      foreground: '#204529', // Dark Green for better text contrast
      card: '#FFFFFF',
      cardHover: '#F7FAEF', // Very light mint
      muted: '#F3F7E8', // Light mint variant
      border: '#D4E498', // Light mint green for borders
      headerBg: '#71C278', // Main Logo Green
      sidebarBg: '#F7FAEF', // Very light mint
      activeLinkBg: '#D4E498', // Light mint green
      activeLinkText: '#204529', // Dark Green
      buttonPrimary: '#71C278', // Main Logo Green
      buttonPrimaryHover: '#5DA863', // Slightly darker green
      buttonPrimaryText: '#FFFFFF',
      buttonSecondary: '#EFD3B1', // Peach
      buttonSecondaryHover: '#E5C3A1', // Slightly darker peach
      buttonSecondaryText: '#204529', // Dark Green
      destructive: '#E31836', // Red
      highlight: '#FCF2E8', // Very light peach
    }
  },
  {
    id: 'original',
    name: 'Original Savr',
    colors: {
      // Based on the original application styling
      primary: '#16a34a', // Green-600
      primaryDark: '#166534', // Green-800
      accent: '#dc2626', // Red-600
      secondary: '#f0fdf4', // Green-50
      tertiary: '#dcfce7', // Green-100
      background: '#FFFFFF',
      foreground: '#1C1C1C',
      card: '#FFFFFF',
      muted: '#f9fafb', // Gray-50
      border: '#e5e7eb', // Gray-200
    }
  },
  {
    id: 'green-shades',
    name: 'Green Shades',
    colors: {
      // Different shades of green
      primary: '#2E7D32',
      primaryDark: '#1B5E20',
      accent: '#81C784',
      secondary: '#A5D6A7',
      tertiary: '#C8E6C9',
      background: '#F1F8E9',
      foreground: '#1C1C1C',
      card: '#FFFFFF',
      muted: '#E8F5E9',
      border: '#C8E6C9',
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      primary: '#388E3C',
      primaryDark: '#1B5E20',
      accent: '#66BB6A',
      secondary: '#2E7D32',
      tertiary: '#43A047',
      background: '#121212',
      foreground: '#E0E0E0',
      card: '#1E1E1E',
      muted: '#2D2D2D',
      border: '#333333',
    }
  },
  {
    id: 'pakistan',
    name: 'Pakistan Green',
    colors: {
      primary: '#25a244',
      primaryDark: '#10451d',
      accent: '#4ad66d',
      secondary: '#155d27',
      tertiary: '#208b3a',
      background: '#FFFFFF',
      foreground: '#10451d',
      card: '#b7efc5',
      muted: '#92e6a7',
      border: '#6ede8a',
    }
  },
  {
    id: 'fresh-market',
    name: 'Fresh Market',
    colors: {
      primary: '#4CAF50', // Vibrant green
      primaryDark: '#2E7D32', // Dark green
      accent: '#FF7043', // Soft orange - for CTAs
      secondary: '#E8F5E9', // Very light green
      tertiary: '#C8E6C9', // Light green
      background: '#FAFAFA', // Off-white
      foreground: '#263238', // Dark blue-gray
      card: '#FFFFFF', // White
      muted: '#ECEFF1', // Light blue-gray
      border: '#CFD8DC', // Soft blue-gray
    }
  },
  {
    id: 'earthy-elegance',
    name: 'Earthy Elegance',
    colors: {
      primary: '#606c38', // Dark Moss Green
      primaryDark: '#283618', // Pakistan Green
      accent: '#bc6c25', // Tiger's Eye
      secondary: '#dda15e', // Earth Yellow
      tertiary: '#fefae0', // Cornsilk
      background: '#fefae0', // Cornsilk
      foreground: '#283618', // Pakistan Green
      card: '#FFFFFF',
      cardHover: '#f5f5dc', // Light Cornsilk
      muted: '#f0e68c', // Khaki
      border: '#dda15e', // Earth Yellow
      headerBg: '#606c38', // Dark Moss Green
      sidebarBg: '#f5f5dc', // Light Cornsilk
      activeLinkBg: '#dda15e', // Earth Yellow
      activeLinkText: '#283618', // Pakistan Green
      buttonPrimary: '#606c38', // Dark Moss Green
      buttonPrimaryHover: '#4f5d2e', // Slightly darker moss green
      buttonPrimaryText: '#FFFFFF',
      buttonSecondary: '#dda15e', // Earth Yellow
      buttonSecondaryHover: '#c49b4e', // Slightly darker earth yellow
      buttonSecondaryText: '#283618', // Pakistan Green
      destructive: '#bc6c25', // Tiger's Eye
      highlight: '#fefae0', // Cornsilk
    }
  },
  {
    id: 'earthy',
    name: 'Earthy',
    colors: {
      primary: '#8ecae6', // Sky Blue
      primaryDark: '#219ebc', // Blue Green
      accent: '#fb8500', // UT Orange
      secondary: '#ffb703', // Selective Yellow
      tertiary: '#023047', // Prussian Blue
      background: '#023047', // Prussian Blue
      foreground: '#fefae0', // Cornsilk
      card: '#FFFFFF',
      cardHover: '#e0f7fa', // Light Sky Blue
      muted: '#e0f2f1', // Light Blue Green
      border: '#ffb703', // Selective Yellow
      headerBg: '#8ecae6', // Sky Blue
      sidebarBg: '#e0f7fa', // Light Sky Blue
      activeLinkBg: '#ffb703', // Selective Yellow
      activeLinkText: '#023047', // Prussian Blue
      buttonPrimary: '#8ecae6', // Sky Blue
      buttonPrimaryHover: '#6fa8dc', // Slightly darker sky blue
      buttonPrimaryText: '#023047', // Prussian Blue
      buttonSecondary: '#ffb703', // Selective Yellow
      buttonSecondaryHover: '#e6ac00', // Slightly darker selective yellow
      buttonSecondaryText: '#023047', // Prussian Blue
      destructive: '#fb8500', // UT Orange
      highlight: '#fefae0', // Cornsilk
    }
  },
  {
    id: 'timberwolf',
    name: 'Timberwolf',
    colors: {
      primary: '#dad7cd', // Timberwolf
      primaryDark: '#588157', // Fern Green
      accent: '#344e41', // Brunswick Green
      secondary: '#a3b18a', // Sage
      tertiary: '#3a5a40', // Hunter Green
      background: '#dad7cd', // Timberwolf
      foreground: '#3a5a40', // Hunter Green
      card: '#FFFFFF',
      cardHover: '#f0f0e0', // Light Timberwolf
      muted: '#e0e0d1', // Light Sage
      border: '#a3b18a', // Sage
      headerBg: '#588157', // Fern Green
      sidebarBg: '#f0f0e0', // Light Timberwolf
      activeLinkBg: '#a3b18a', // Sage
      activeLinkText: '#3a5a40', // Hunter Green
      buttonPrimary: '#588157', // Fern Green
      buttonPrimaryHover: '#4a6b4f', // Slightly darker fern green
      buttonPrimaryText: '#FFFFFF',
      buttonSecondary: '#a3b18a', // Sage
      buttonSecondaryHover: '#8b9c7a', // Slightly darker sage
      buttonSecondaryText: '#3a5a40', // Hunter Green
      destructive: '#344e41', // Brunswick Green
      highlight: '#dad7cd', // Timberwolf
    }
  },
  {
    id: 'ash',
    name: 'Ash',
    colors: {
      primary: '#cad2c5', // Ash Gray
      primaryDark: '#52796f', // Hooker's Green
      accent: '#2f3e46', // Charcoal
      secondary: '#84a98c', // Cambridge Blue
      tertiary: '#354f52', // Dark Slate Gray
      background: '#cad2c5', // Ash Gray
      foreground: '#2f3e46', // Charcoal
      card: '#FFFFFF',
      cardHover: '#e0e7e4', // Light Ash Gray
      muted: '#d0d9d5', // Light Cambridge Blue
      border: '#84a98c', // Cambridge Blue
      headerBg: '#52796f', // Hooker's Green
      sidebarBg: '#e0e7e4', // Light Ash Gray
      activeLinkBg: '#84a98c', // Cambridge Blue
      activeLinkText: '#2f3e46', // Charcoal
      buttonPrimary: '#52796f', // Hooker's Green
      buttonPrimaryHover: '#466a60', // Slightly darker hooker's green
      buttonPrimaryText: '#FFFFFF',
      buttonSecondary: '#84a98c', // Cambridge Blue
      buttonSecondaryHover: '#739b7e', // Slightly darker cambridge blue
      buttonSecondaryText: '#2f3e46', // Charcoal
      destructive: '#2f3e46', // Charcoal
      highlight: '#cad2c5', // Ash Gray
    }
  },
  {
    id: 'savr-serenity',
    name: 'Savr Serenity',
    colors: {
      primary: '#A8DADC', // Soft Mint
      primaryDark: '#457B9D', // Calm Teal
      accent: '#E76F51', // Sunset Orange
      secondary: '#F4A261', // Warm Sand
      tertiary: '#F1FAEE', // Gentle Peach
      background: '#F1FAEE', // Gentle Peach
      foreground: '#457B9D', // Calm Teal
      card: '#FFFFFF',
      cardHover: '#E8F5F2', // Light Mint
      muted: '#E0F2F1', // Light Teal
      border: '#F4A261', // Warm Sand
      headerBg: '#A8DADC', // Soft Mint
      sidebarBg: '#E8F5F2', // Light Mint
      activeLinkBg: '#F4A261', // Warm Sand
      activeLinkText: '#457B9D', // Calm Teal
      buttonPrimary: '#A8DADC', // Soft Mint
      buttonPrimaryHover: '#90C9C9', // Slightly darker mint
      buttonPrimaryText: '#457B9D', // Calm Teal
      buttonSecondary: '#F4A261', // Warm Sand
      buttonSecondaryHover: '#E69550', // Slightly darker warm sand
      buttonSecondaryText: '#457B9D', // Calm Teal
      destructive: '#E76F51', // Sunset Orange
      highlight: '#F1FAEE', // Gentle Peach
    }
  },
];

type ThemeStore = {
  currentTheme: string;
  setTheme: (themeId: string) => void;
  getTheme: () => Theme;
}

const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: 'green-shades',
      setTheme: (themeId) => set({ currentTheme: themeId }),
      getTheme: () => {
        const current = get().currentTheme;
        return themes.find(theme => theme.id === current) || themes[0];
      },
    }),
    {
      name: 'savr-theme',
    }
  )
);

export default useThemeStore; 