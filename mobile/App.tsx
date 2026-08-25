import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  Provider as PaperProvider,
  MD3DarkTheme,
  Text,
  Card,
  Chip,
  ActivityIndicator,
  Button,
  Divider,
} from 'react-native-paper';
import { initDatabase } from './src/core/database/db';
import { syncEngine } from './src/core/sync/syncEngine';
import { SyncSummary } from './src/core/types/database';

export default function App() {
  const [dbReady, setDbReady] = useState<boolean | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary>({
    pendingCount: 0,
    isOnline: false,
  });

  useEffect(() => {
    async function prepareApp() {
      const isDbOk = await initDatabase();
      setDbReady(isDbOk);
      const summary = await syncEngine.getSummary();
      setSyncSummary(summary);
    }
    prepareApp();

    const unsubscribe = syncEngine.subscribe(async (isOnline) => {
      const summary = await syncEngine.getSummary();
      setSyncSummary({ ...summary, isOnline });
    });

    return () => unsubscribe();
  }, []);

  return (
    <PaperProvider theme={MD3DarkTheme}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              Gestor Digital de Fiados
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Arquitectura Offline-First (Expo + SQLite)
            </Text>
          </View>

          {/* Status Badges */}
          <View style={styles.badgeRow}>
            <Chip
              icon={syncSummary.isOnline ? 'wifi' : 'wifi-off'}
              style={[
                styles.chip,
                { backgroundColor: syncSummary.isOnline ? '#1b5e20' : '#b71c1c' },
              ]}
            >
              {syncSummary.isOnline ? 'Online' : 'Offline'}
            </Chip>

            <Chip
              icon="database"
              style={[
                styles.chip,
                { backgroundColor: dbReady ? '#0d47a1' : '#e65100' },
              ]}
            >
              {dbReady ? 'SQLite Listo' : 'Iniciando BD'}
            </Chip>
          </View>

          {/* Database Setup Card */}
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Estado de la Base de Datos Local
              </Text>
              <Divider style={styles.divider} />
              {dbReady === null ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator animating={true} color="#bb86fc" />
                  <Text style={{ marginLeft: 10 }}>Creando tablas SQLite local...</Text>
                </View>
              ) : dbReady ? (
                <Text variant="bodyMedium" style={styles.successText}>
                  ✅ Base de datos `expo-sqlite` inicializada con éxito. Tablas de Tiendas, Clientes, Movimientos y Cola de Sincronización listas.
                </Text>
              ) : (
                <Text variant="bodyMedium" style={styles.errorText}>
                  ❌ Error al inicializar SQLite local.
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* Sync Engine Card */}
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Motor de Sincronización (Outbox Queue)
              </Text>
              <Divider style={styles.divider} />
              <View style={styles.syncRow}>
                <Text variant="bodyLarge">Registros Pendientes:</Text>
                <Chip icon="clock-outline">{syncSummary.pendingCount}</Chip>
              </View>
              <Text variant="bodySmall" style={styles.infoText}>
                Las operaciones de fiados y pagos creadas sin internet se guardan en el celular con un ID único UUID v4 y se enviarán automáticamente al servidor Spring Boot en Dokploy al recuperar señal.
              </Text>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: '#bb86fc',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#b0bec5',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    borderRadius: 20,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#1e1e1e',
  },
  cardTitle: {
    color: '#ffffff',
    fontWeight: '600',
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#333',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  successText: {
    color: '#81c784',
  },
  errorText: {
    color: '#e57373',
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  infoText: {
    color: '#90a4ae',
    marginTop: 8,
    lineHeight: 18,
  },
});
