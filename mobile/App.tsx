import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import {
  Provider as PaperProvider,
  MD3DarkTheme,
  Text,
  Card,
  Chip,
  ActivityIndicator,
  Button,
  Divider,
  List,
  HelperText,
} from 'react-native-paper';
import { initDatabase } from './src/core/database/db';
import { syncEngine } from './src/core/sync/syncEngine';
import { storeRepository } from './src/core/repositories/storeRepository';
import { customerRepository } from './src/core/repositories/customerRepository';
import { transactionRepository } from './src/core/repositories/transactionRepository';
import { Store, Customer, Transaction, SyncSummary } from './src/core/types/database';

export default function App() {
  const [dbReady, setDbReady] = useState<boolean | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary>({
    pendingCount: 0,
    isOnline: false,
  });

  useEffect(() => {
    async function prepareApp() {
      const isDbOk = await initDatabase();
      setDbReady(isDbOk);
      if (isDbOk) {
        await loadDemoData();
      }
    }
    prepareApp();

    const unsubscribe = syncEngine.subscribe(async (isOnline) => {
      const summary = await syncEngine.getSummary();
      setSyncSummary({ ...summary, isOnline });
    });

    return () => unsubscribe();
  }, []);

  const loadDemoData = async () => {
    // 1. Get or Create Store
    let currentStore = await storeRepository.getStore();
    if (!currentStore) {
      currentStore = await storeRepository.saveStore({
        name: 'Supermercado La Esperanza',
        ownerName: 'Carlos Mendoza',
        ownerDocument: '1098765432',
        phone: '3001234567',
        email: 'tienda@laesperanza.com',
        defaultCreditLimit: 100000,
      });
    }
    setStore(currentStore);

    // 2. Get or Create Demo Customer
    const customers = await customerRepository.getCustomers(currentStore.id);
    let activeCustomer = customers[0] ?? null;

    if (!activeCustomer) {
      activeCustomer = await customerRepository.createCustomer(currentStore.id, {
        name: 'Juan Pérez',
        documentNumber: '123456789',
        phone: '3159876543',
        email: 'juan.perez@email.com',
        notificationsAuthorized: true,
        emailVerified: true,
        customCreditLimit: 120000,
      });
    }
    setCustomer(activeCustomer);

    // 3. Load Transaction History
    if (activeCustomer) {
      const txs = await transactionRepository.getCustomerHistory(activeCustomer.id);
      setHistory(txs);
    }

    // 4. Update Sync Summary
    const summary = await syncEngine.getSummary();
    setSyncSummary(summary);
  };

  const handleAddFiado = async (amount: number) => {
    if (!store || !customer) return;
    try {
      setLimitWarning(null);
      const result = await transactionRepository.addFiado(
        store.id,
        customer.id,
        amount,
        `Compra de víveres ($${amount.toLocaleString()})`
      );

      if (result.limitExceeded) {
        setLimitWarning(
          `⚠️ ¡ALERTA! El nuevo saldo sobrepasa el límite de crédito ($${result.effectiveLimit.toLocaleString()}).`
        );
      }

      await loadDemoData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleAddPago = async (amount: number) => {
    if (!store || !customer) return;
    try {
      setLimitWarning(null);
      await transactionRepository.addPago(
        store.id,
        customer.id,
        amount,
        `Abono a cuenta ($${amount.toLocaleString()})`
      );
      await loadDemoData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <PaperProvider theme={MD3DarkTheme}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              {store ? store.name : 'Gestor Digital de Fiados'}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {store ? `Propietario: ${store.ownerName}` : 'Inicializando...'}
            </Text>
          </View>

          {/* Badges */}
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

            <Chip icon="tray-full" style={styles.chip}>
              Queue: {syncSummary.pendingCount}
            </Chip>
          </View>

          {/* Customer Debt Card */}
          {customer && (
            <Card style={styles.card} mode="elevated">
              <Card.Content>
                <View style={styles.customerHeader}>
                  <View>
                    <Text variant="titleMedium" style={styles.cardTitle}>
                      {customer.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#aaa' }}>
                      Doc: {customer.documentNumber} | Tel: {customer.phone}
                    </Text>
                  </View>
                  <Chip icon="shield-check" style={{ backgroundColor: '#2e7d32' }}>
                    Verificado
                  </Chip>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.balanceRow}>
                  <View>
                    <Text variant="bodySmall" style={{ color: '#aaa' }}>
                      Saldo Deuda Actual:
                    </Text>
                    <Text variant="headlineSmall" style={{ color: '#ef5350', fontWeight: 'bold' }}>
                      ${customer.currentBalance.toLocaleString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="bodySmall" style={{ color: '#aaa' }}>
                      Límite de Crédito:
                    </Text>
                    <Text variant="titleMedium" style={{ color: '#81c784' }}>
                      ${(customer.customCreditLimit ?? store?.defaultCreditLimit ?? 100000).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {limitWarning && (
                  <HelperText type="error" visible={true} style={{ fontSize: 13, marginTop: 8 }}>
                    {limitWarning}
                  </HelperText>
                )}

                <Divider style={styles.divider} />

                {/* Quick Action Buttons */}
                <Text variant="labelLarge" style={{ marginBottom: 10, color: '#bb86fc' }}>
                  Acciones Rápidas (Prueba de Transacción Local):
                </Text>

                <View style={styles.buttonRow}>
                  <Button
                    mode="contained"
                    buttonColor="#c62828"
                    icon="plus-circle"
                    onPress={() => handleAddFiado(50000)}
                    style={styles.actionBtn}
                  >
                    + Fiado $50.000
                  </Button>

                  <Button
                    mode="contained"
                    buttonColor="#2e7d32"
                    icon="minus-circle"
                    onPress={() => handleAddPago(20000)}
                    style={styles.actionBtn}
                  >
                    - Pago $20.000
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Chronological History List */}
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Historial Cronológico de Movimientos
              </Text>
              <Divider style={styles.divider} />

              {history.length === 0 ? (
                <Text variant="bodyMedium" style={{ color: '#aaa', fontStyle: 'italic' }}>
                  No hay movimientos registrados para este cliente.
                </Text>
              ) : (
                history.map((item) => (
                  <List.Item
                    key={item.id}
                    title={`${item.type === 'FIADO' ? '🛒 Fiado' : item.type === 'PAGO' ? '💵 Pago / Abono' : '⚠️ Anulacion'}: $${item.amount.toLocaleString()}`}
                    description={`${item.description ?? 'Sin descripción'} | ${new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    right={() => (
                      <Chip
                        icon={item.syncStatus === 'SYNCED' ? 'check' : 'clock-outline'}
                        style={{
                          height: 30,
                          backgroundColor: item.syncStatus === 'SYNCED' ? '#1b5e20' : '#424242',
                        }}
                      >
                        {item.syncStatus}
                      </Chip>
                    )}
                    titleStyle={{
                      color: item.type === 'FIADO' ? '#ef5350' : item.type === 'PAGO' ? '#81c784' : '#ffb74d',
                      fontWeight: 'bold',
                    }}
                  />
                ))
              )}
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
    paddingTop: 50,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: '#bb86fc',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#b0bec5',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
  },
});
