import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Provider as PaperProvider, MD3DarkTheme, ActivityIndicator, Text } from 'react-native-paper';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { inicializarBaseDatos } from './src/core/database/db';
import { AppNavigator } from './src/ui/navigation/AppNavigator';

export default function App() {
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
      <PaperProvider theme={MD3DarkTheme}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#bb86fc" />
          <Text style={{ marginTop: 12, color: '#aaa' }}>Inicializando Base de Datos Local SQLite...</Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={MD3DarkTheme}>
      <NavigationContainer theme={DarkTheme}>
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
