import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import useThemeStore, { themes } from '../stores/themeStore';

const ThemeSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme, setTheme } = useThemeStore();
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleThemeChange = (themeId: string) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="flex items-center justify-center p-2 rounded-full bg-opacity-20 hover:bg-white/30 transition-colors"
        aria-label="Open theme menu"
      >
        {isOpen ? (
          <X size={20} />
        ) : (
          <Menu size={20} />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1 rounded-md">
            <div className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
              <span className="font-medium">Select Theme</span>
            </div>
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`flex items-center w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  currentTheme === theme.id ? 'bg-gray-50 dark:bg-gray-700/50 font-medium' : ''
                }`}
              >
                <span 
                  className="w-5 h-5 mr-3 rounded-full" 
                  style={{ backgroundColor: theme.colors.primary }}
                ></span>
                <span>
                  {theme.name}
                </span>
                {currentTheme === theme.id && (
                  <span className="ml-auto">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector; 