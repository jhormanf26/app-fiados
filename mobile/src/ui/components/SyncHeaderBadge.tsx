import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import { Chip } from 'react-native-paper';
import { motorSincronizacion } from '../../core/sync/syncEngine';
import { ResumenSincronizacion } from '../../core/types/database';

interface SyncHeaderBadgeProps {
  onSyncComplete?: () => void;
}

export const SyncHeaderBadge: React.FC<SyncHeaderBadgeProps> = ({ onSyncComplete }) => {
  const [resumen, setResumen] = useState<ResumenSincronizacion>({
    pendientesCount: 0,
    estaEnLinea: false,
  });
  const [sincronizando, setSincronizando] = useState<boolean>(false);

  const actualizarEstado = async () => {
    try {
      const res = await motorSincronizacion.obtenerResumen();
      setResumen(res);
    } catch (e) {
      console.warn('[SyncHeaderBadge] Error al obtener resumen:', e);
    }
  };

  useEffect(() => {
    actualizarEstado();
    const desuscribir = motorSincronizacion.suscribir(async (estaEnLinea) => {
      const res = await motorSincronizacion.obtenerResumen();
      setResumen({ ...res, estaEnLinea });
    });

    return () => desuscribir();
  }, []);

  const handlePressSync = async () => {
    if (sincronizando) return;
    setSincronizando(true);

    try {
      const res = await motorSincronizacion.forzarResincronizacionTotal();
      await actualizarEstado();
      if (onSyncComplete) {
        onSyncComplete();
      }

      const titulo = res.exito ? '🔄 Sincronización Exitosa' : '⚠️ Modo Offline';
      if (Platform.OS === 'web') {
        window.alert(`${titulo}\n\n${res.mensaje}`);
      } else {
        Alert.alert(titulo, res.mensaje);
      }
    } catch (e: any) {
      const errMsj = e.message || String(e);
      if (Platform.OS === 'web') {
        window.alert(`⚠️ Error al sincronizar: ${errMsj}`);
      } else {
        Alert.alert('⚠️ Error de Sincronización', errMsj);
      }
    } finally {
      setSincronizando(false);
    }
  };

  const { estaEnLinea, pendientesCount } = resumen;

  // Determinar ícono, colores y texto dinámico según estado real
  let icon = 'check-circle';
  let backgroundColor = '#e8f5e9';
  let textColor = '#2e7d32';
  let texto = 'Sincronizado';

  if (!estaEnLinea) {
    icon = 'wifi-off';
    backgroundColor = '#fde8e8';
    textColor = '#c62828';
    texto = 'Sin Conexión';
  } else if (pendientesCount > 0) {
    icon = 'sync';
    backgroundColor = '#fff3e0';
    textColor = '#e65100';
    texto = `Pendientes (${pendientesCount})`;
  }

  return (
    <Chip
      icon={icon}
      onPress={handlePressSync}
      style={[styles.badge, { backgroundColor }]}
      textStyle={[styles.text, { color: textColor }]}
      disabled={sincronizando}
    >
      {sincronizando ? 'Sincronizando...' : texto}
    </Chip>
  );
};

const styles = StyleSheet.create({
  badge: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
    fontSize: 11,
  },
});
