import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Provider as PaperProvider, ActivityIndicator, Text } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { inicializarBaseDatos } from './src/core/database/db';
import { AppNavigator } from './src/ui/navigation/AppNavigator';
import { ThemeProvider, useAppTheme } from './src/ui/theme/ThemeContext';

function AppContent() {
  const { paperTheme, navTheme, colors } = useAppTheme();
  const [bdLista, setBdLista] = useState<boolean | null>(null);

  useEffect(() => {
    async function prepararApp() {
      const estaBdOk = await inicializarBaseDatos();
      setBdLista(estaBdOk);
    }
    prepararApp();
  }, []);

  if (bdLista === null) {
    return (
      <PaperProvider theme={paperTheme}>
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textSecondary }}>Inicializando Base de Datos Local SQLite...</Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={navTheme}>
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
