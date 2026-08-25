import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Searchbar, FAB, Card, Text, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { clienteRepository } from '../../core/repositories/clienteRepository';
import { tiendaRepository } from '../../core/repositories/tiendaRepository';
import { Cliente, Tienda } from '../../core/types/database';
import { CrearClienteModal } from '../modals/CrearClienteModal';

export const ClientesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null);

  const cargarClientes = async (query?: string) => {
    try {
      let t = tienda;
      if (!t) {
        t = await tiendaRepository.obtenerTienda();
        setTienda(t);
      }
      if (t) {
        const lista = await clienteRepository.obtenerClientes(t.id, query);
        setClientes(lista);
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarClientes(busqueda);
    }, [busqueda])
  );

  const handleBuscar = (query: string) => {
    setBusqueda(query);
    cargarClientes(query);
  };

  const handleAbrirCrear = () => {
    setClienteEditar(null);
    setModalVisible(true);
  };

  const handleAbrirEditar = (cliente: Cliente) => {
    setClienteEditar(cliente);
    setModalVisible(true);
  };

  const renderCliente = ({ item }: { item: Cliente }) => {
    const tieneDeuda = item.saldoActual > 0;

    return (
      <Card
        style={styles.card}
        mode="elevated"
        onPress={() => navigation.navigate('DetalleCliente', { clienteId: item.id })}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.infoCol}>
            <Text variant="titleMedium" style={styles.nombreCliente}>
              {item.nombre}
            </Text>
            <Text variant="bodySmall" style={styles.subtext}>
              Doc: {item.numeroDocumento} | Tel: {item.telefono}
            </Text>

            <View style={styles.chipRow}>
              {tieneDeuda ? (
                <Chip icon="account-cash-outline" style={styles.chipDeuda} textStyle={{ color: '#ef5350' }}>
                  Deuda: ${item.saldoActual.toLocaleString()}
                </Chip>
              ) : (
                <Chip icon="check-circle-outline" style={styles.chipAlDia} textStyle={{ color: '#81c784' }}>
                  Al Día ($0)
                </Chip>
              )}
            </View>
          </View>

          <IconButton
            icon="square-edit-outline"
            iconColor="#bb86fc"
            size={22}
            onPress={() => handleAbrirEditar(item)}
          />
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Buscar por nombre, documento o cel..."
          onChangeText={handleBuscar}
          value={busqueda}
          style={styles.searchbar}
          inputStyle={{ color: '#fff' }}
          iconColor="#bb86fc"
        />
      </View>

      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#bb86fc" />
        </View>
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={(item) => item.id}
          renderItem={renderCliente}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={{ color: '#aaa', textAlign: 'center' }}>
                {busqueda
                  ? 'No se encontraron clientes que coincidan con la búsqueda.'
                  : 'No hay clientes registrados aún. Toca + para agregar el primero.'}
              </Text>
            </View>
          }
        />
      )}

      <FAB
        icon="account-plus"
        label="Nuevo Cliente"
        style={styles.fab}
        color="#ffffff"
        onPress={handleAbrirCrear}
      />

      {tienda && (
        <CrearClienteModal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          tiendaId={tienda.id}
          clienteEditar={clienteEditar}
          onSuccess={() => cargarClientes(busqueda)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#1e1e1e',
  },
  searchbar: {
    backgroundColor: '#121212',
    borderRadius: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#1e1e1e',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
  },
  nombreCliente: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  subtext: {
    color: '#b0bec5',
    marginVertical: 4,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  chipDeuda: {
    backgroundColor: '#3b1c1c',
  },
  chipAlDia: {
    backgroundColor: '#1b3b1c',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
});
