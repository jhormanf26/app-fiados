import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { Searchbar, FAB, Card, Text, Chip, ActivityIndicator, IconButton, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { clienteRepository } from '../../core/repositories/clienteRepository';
import { tiendaRepository } from '../../core/repositories/tiendaRepository';
import { Cliente, Tienda } from '../../core/types/database';
import { CrearClienteModal } from '../modals/CrearClienteModal';
import { useAppTheme } from '../theme/ThemeContext';

type TipoFiltro = 'TODOS' | 'DEUDA' | 'ALDIA';

function obtenerIniciales(nombre: string): string {
  if (!nombre) return 'CL';
  const partes = nombre.trim().split(' ').filter(Boolean);
  if (partes.length >= 2) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }
  return partes[0].substring(0, 2).toUpperCase();
}

export const ClientesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDarkMode } = useAppTheme();
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<TipoFiltro>('TODOS');
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

  const handleAbrirEditar = (cliente: Cliente, e: any) => {
    e.stopPropagation();
    setClienteEditar(cliente);
    setModalVisible(true);
  };

  // Filtrado de la lista por el chip seleccionado (Todos, Con Deuda, Al Día)
  const clientesFiltrados = clientes.filter((c) => {
    if (filtro === 'DEUDA') return c.saldoActual > 0;
    if (filtro === 'ALDIA') return c.saldoActual === 0;
    return true;
  });

  const renderCliente = ({ item }: { item: Cliente }) => {
    const tieneDeuda = item.saldoActual > 0;
    const iniciales = obtenerIniciales(item.nombre);

    return (
      <Card
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
            borderColor: isDarkMode ? '#333333' : '#e0e0e0',
          },
        ]}
        mode="outlined"
        onPress={() => navigation.navigate('DetalleCliente', { clienteId: item.id })}
      >
        <Card.Content style={styles.cardContent}>
          {/* Fila Superior: Avatar + Info */}
          <View style={styles.topRow}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: tieneDeuda
                    ? '#6200ee'
                    : isDarkMode
                    ? '#333333'
                    : '#e0e0e0',
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  {
                    color: tieneDeuda
                      ? '#ffffff'
                      : isDarkMode
                      ? '#bb86fc'
                      : '#444444',
                  },
                ]}
              >
                {iniciales}
              </Text>
            </View>

            <View style={styles.infoCol}>
              <Text
                variant="titleMedium"
                style={[
                  styles.nombreCliente,
                  { color: isDarkMode ? '#ffffff' : '#1c1b1f' },
                ]}
              >
                {item.nombre}
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.subtext,
                  { color: isDarkMode ? '#b0bec5' : '#666666' },
                ]}
              >
                🪪 ID: {item.numeroDocumento}  •  📞 {item.telefono}
              </Text>
            </View>
          </View>

          <Divider style={[styles.cardDivider, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f0f0f0' }]} />

          {/* Fila Inferior: Pill Deuda/Al Día + Botón Editar */}
          <View style={styles.bottomRow}>
            {tieneDeuda ? (
              <View style={[styles.badgePill, styles.badgePillDeuda]}>
                <Text style={styles.badgeTextDeuda}>
                  ⚠️ Deuda: ${(item.saldoActual ?? 0).toLocaleString()}
                </Text>
              </View>
            ) : (
              <View style={[styles.badgePill, styles.badgePillAlDia]}>
                <Text style={styles.badgeTextAlDia}>
                  💬 Al Día ($0)
                </Text>
              </View>
            )}

            <IconButton
              icon="pencil-outline"
              iconColor={isDarkMode ? '#bb86fc' : '#6200ee'}
              size={20}
              onPress={(e) => handleAbrirEditar(item, e)}
              style={styles.btnEditar}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Barra de Encabezado Superior Stitch */}
      <View style={[styles.headerContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
        <View style={styles.topHeaderBar}>
          <IconButton
            icon="sync"
            iconColor={isDarkMode ? '#bb86fc' : '#6200ee'}
            size={24}
            onPress={() => cargarClientes(busqueda)}
          />
          <Text variant="titleMedium" style={styles.storeNameHeader}>
            {tienda?.nombre || 'Supermercado La Esperanza'}
          </Text>
        </View>

        <Text variant="headlineMedium" style={[styles.tituloPantalla, { color: colors.text }]}>
          Directorio de Clientes
        </Text>

        {/* Buscador Outlined estilo Stitch */}
        <Searchbar
          placeholder="Buscar por Nombre, ID o Teléfono..."
          onChangeText={handleBuscar}
          value={busqueda}
          style={[
            styles.searchbar,
            {
              backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
              borderColor: isDarkMode ? '#333333' : '#cccccc',
            },
          ]}
          inputStyle={{ color: colors.text }}
          iconColor={colors.primary}
          placeholderTextColor={isDarkMode ? '#777777' : '#888888'}
        />

        {/* Pills de Filtrado: Todos / Con Deuda / Al Día */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFiltro('TODOS')}
            style={[
              styles.filterPill,
              filtro === 'TODOS'
                ? styles.filterPillActive
                : { backgroundColor: isDarkMode ? '#262626' : '#eeeeee' },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                filtro === 'TODOS' ? styles.filterPillTextActive : { color: colors.text },
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFiltro('DEUDA')}
            style={[
              styles.filterPill,
              filtro === 'DEUDA'
                ? styles.filterPillActive
                : { backgroundColor: isDarkMode ? '#262626' : '#eeeeee' },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                filtro === 'DEUDA' ? styles.filterPillTextActive : { color: colors.text },
              ]}
            >
              Con Deuda
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFiltro('ALDIA')}
            style={[
              styles.filterPill,
              filtro === 'ALDIA'
                ? styles.filterPillActive
                : { backgroundColor: isDarkMode ? '#262626' : '#eeeeee' },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                filtro === 'ALDIA' ? styles.filterPillTextActive : { color: colors.text },
              ]}
            >
              Al Día
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista o Loader */}
      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={clientesFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={renderCliente}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                {busqueda
                  ? 'No se encontraron clientes que coincidan con la búsqueda.'
                  : filtro === 'DEUDA'
                  ? '¡Excelente! Ningún cliente tiene deudas pendientes en este momento.'
                  : filtro === 'ALDIA'
                  ? 'No hay clientes al día registrados.'
                  : 'No hay clientes registrados aún. Toca + para agregar el primero.'}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB Estilo Stitch Púrpura Destacado */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: isDarkMode ? '#bb86fc' : '#6200ee' }]}
        color={isDarkMode ? '#000000' : '#ffffff'}
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
  },
  headerContainer: {
    padding: 16,
    paddingTop: 36,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  storeNameHeader: {
    color: '#6200ee',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tituloPantalla: {
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 24,
  },
  searchbar: {
    borderRadius: 12,
    borderWidth: 1,
    elevation: 0,
    marginBottom: 12,
    height: 48,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: '#81c784',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#1b5e20',
    fontWeight: 'bold',
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
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
  },
  cardContent: {
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  infoCol: {
    flex: 1,
  },
  nombreCliente: {
    fontWeight: 'bold',
    fontSize: 17,
  },
  subtext: {
    marginTop: 2,
    fontSize: 13,
  },
  cardDivider: {
    marginVertical: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgePillDeuda: {
    backgroundColor: '#fde8e8',
  },
  badgeTextDeuda: {
    color: '#c62828',
    fontWeight: 'bold',
    fontSize: 13,
  },
  badgePillAlDia: {
    backgroundColor: '#e8f5e9',
  },
  badgeTextAlDia: {
    color: '#2e7d32',
    fontWeight: 'bold',
    fontSize: 13,
  },
  btnEditar: {
    margin: 0,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 16,
    bottom: 20,
    borderRadius: 16,
    elevation: 4,
  },
});
