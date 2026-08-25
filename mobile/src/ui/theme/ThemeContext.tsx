import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, MD3Theme } from 'react-native-paper';
import { DarkTheme as NavDarkTheme, DefaultTheme as NavLightTheme, Theme as NavTheme } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void;
  paperTheme: MD3Theme;
  navTheme: NavTheme;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    inputBackground: string;
  };
}

const THEME_KEY = 'fiados_app_theme_dark';

const customDarkPaper = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
    secondary: '#03dac6',
    background: '#121212',
    surface: '#1e1e1e',
  },
};

const customLightPaper = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    secondary: '#018786',
    background: '#f6f6f6',
    surface: '#ffffff',
  },
};

const customDarkNav: NavTheme = {
  ...NavDarkTheme,
  colors: {
    ...NavDarkTheme.colors,
    primary: '#bb86fc',
    background: '#121212',
    card: '#1e1e1e',
    text: '#ffffff',
    border: '#333333',
  },
};

const customLightNav: NavTheme = {
  ...NavLightTheme,
  colors: {
    ...NavLightTheme.colors,
    primary: '#6200ee',
    background: '#f6f6f6',
    card: '#ffffff',
    text: '#1c1b1f',
    border: '#e0e0e0',
  },
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  toggleTheme: () => {},
  setDarkMode: () => {},
  paperTheme: customDarkPaper,
  navTheme: customDarkNav,
  colors: {
    background: '#121212',
    card: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#b0bec5',
    border: '#333333',
    primary: '#bb86fc',
    inputBackground: '#1e1e1e',
  },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    async function loadTheme() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const val = window.localStorage.getItem(THEME_KEY);
          if (val !== null) {
            setIsDarkMode(val === 'true');
            return;
          }
        }
        const val = await SecureStore.getItemAsync(THEME_KEY);
        if (val !== null) {
          setIsDarkMode(val === 'true');
        } else {
          setIsDarkMode(systemScheme !== 'light');
        }
      } catch (e) {
        setIsDarkMode(true);
      }
    }
    loadTheme();
  }, [systemScheme]);

  const saveThemePreference = async (dark: boolean) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(THEME_KEY, String(dark));
      }
      await SecureStore.setItemAsync(THEME_KEY, String(dark));
    } catch (e) {
      // Ignore storage errors
    }
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      saveThemePreference(next);
      return next;
    });
  };

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    saveThemePreference(value);
  };

  const paperTheme = isDarkMode ? customDarkPaper : customLightPaper;
  const navTheme = isDarkMode ? customDarkNav : customLightNav;

  const colors = isDarkMode
    ? {
        background: '#121212',
        card: '#1e1e1e',
        text: '#ffffff',
        textSecondary: '#b0bec5',
        border: '#333333',
        primary: '#bb86fc',
        inputBackground: '#1e1e1e',
      }
    : {
        background: '#f6f6f6',
        card: '#ffffff',
        text: '#1c1b1f',
        textSecondary: '#666666',
        border: '#e0e0e0',
        primary: '#6200ee',
        inputBackground: '#f0f0f0',
      };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        setDarkMode,
        paperTheme,
        navTheme,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
