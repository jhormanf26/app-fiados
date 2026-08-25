import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, TextInput, Button, HelperText, ActivityIndicator, Divider, Switch, IconButton, Chip } from 'react-native-paper';
import { tiendaRepository } from '../../core/repositories/tiendaRepository';
import { Tienda } from '../../core/types/database';
import { APP_VERSION, APP_BUILD_DATE } from '../../core/constants/version';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { formatearMonedaInput, desformatearMonedaInput } from '../../core/utils/currency';

export const ConfiguracionScreen: React.FC = () => {
  const { isDarkMode, toggleTheme, colors } = useAppTheme();
  const { logout } = useAuth();
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [nombre, setNombre] = useState('');
  const [nombrePropietario, setNombrePropietario] = useState('');
  const [documentoPropietario, setDocumentoPropietario] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [limitePredeterminado, setLimitePredeterminado] = useState('100000');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarTienda();
  }, []);

  const cargarTienda = async () => {
    try {
      const t = await tiendaRepository.obtenerTienda();
      if (t) {
        setTienda(t);
        setNombre(t.nombre);
        setNombrePropietario(t.nombrePropietario);
        setDocumentoPropietario(t.documentoPropietario);
        setTelefono(t.telefono);
        setCorreo(t.correo);
        setDireccion(t.direccion ?? '');
        setCiudad(t.ciudad ?? '');
        setLimitePredeterminado(formatearMonedaInput(t.limiteCreditoPredeterminado));
      }
    } catch (err) {
      console.error('Error al cargar tienda:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async () => {
    setError(null);
    if (!nombre.trim() || !nombrePropietario.trim() || !telefono.trim() || !correo.trim()) {
      setError('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    const limiteVal = desformatearMonedaInput(limitePredeterminado);
    if (isNaN(limiteVal) || limiteVal <= 0) {
      setError('Por favor ingresa un límite de crédito predeterminado válido.');
      return;
    }

    setGuardando(true);
    try {
      await tiendaRepository.guardarTienda({
        nombre: nombre.trim(),
        nombrePropietario: nombrePropietario.trim(),
        documentoPropietario: documentoPropietario.trim(),
        telefono: telefono.trim(),
        correo: correo.trim(),
        direccion: direccion.trim() || undefined,
        ciudad: ciudad.trim() || undefined,
        limiteCreditoPredeterminado: limiteVal,
      });

      Alert.alert('Éxito', 'Configuración de la tienda guardada correctamente.');
      await cargarTienda();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Encabezado Superior FiaYa */}
      <View style={[styles.topHeaderBar, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={cargarTienda}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <IconButton
            icon="sync"
            iconColor={isDarkMode ? '#bb86fc' : '#6200ee'}
            size={22}
            style={{ margin: 0 }}
          />
          <Text variant="titleMedium" style={{ color: '#6200ee', fontWeight: 'bold', fontSize: 18, marginLeft: 2 }}>
            FiaYa
          </Text>
        </TouchableOpacity>

        <Chip
          icon="check-circle"
          style={{ backgroundColor: '#e8f5e9' }}
          textStyle={{ color: '#2e7d32', fontWeight: 'bold', fontSize: 11 }}
        >
          Synced
        </Chip>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={[styles.titulo, { color: colors.text }]}>
          Ajustes y Configuración
        </Text>

        {/* Tarjeta 1: Store Info */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: colors.text }]}>
              Información de la Tienda
            </Text>
            <Divider style={styles.divider} />

            <TextInput
              label="Nombre de la Tienda *"
              value={nombre}
              onChangeText={setNombre}
              textColor={colors.text}
              contentStyle={{ color: colors.text }}
              activeOutlineColor={colors.primary}
              outlineColor={colors.border}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.inputBackground }]}
              right={nombre ? <TextInput.Icon icon="close" onPress={() => setNombre('')} /> : undefined}
            />

            <TextInput
              label="Nombre del Propietario *"
              value={nombrePropietario}
              onChangeText={setNombrePropietario}
              textColor={colors.text}
              contentStyle={{ color: colors.text }}
              activeOutlineColor={colors.primary}
              outlineColor={colors.border}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.inputBackground }]}
              right={nombrePropietario ? <TextInput.Icon icon="close" onPress={() => setNombrePropietario('')} /> : undefined}
            />

            <TextInput
              label="Documento del Propietario *"
              value={documentoPropietario}
              onChangeText={setDocumentoPropietario}
              keyboardType="numeric"
              textColor={colors.text}
              contentStyle={{ color: colors.text }}
              activeOutlineColor={colors.primary}
              outlineColor={colors.border}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.inputBackground }]}
              right={documentoPropietario ? <TextInput.Icon icon="close" onPress={() => setDocumentoPropietario('')} /> : undefined}
            />

            <TextInput
              label="Teléfono de Contacto *"
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
              textColor={colors.text}
              contentStyle={{ color: colors.text }}
              activeOutlineColor={colors.primary}
              outlineColor={colors.border}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.inputBackground }]}
              right={telefono ? <TextInput.Icon icon="close" onPress={() => setTelefono('')} /> : undefined}
            />

            <TextInput
              label="Correo de la Tienda *"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textColor={colors.text}
              contentStyle={{ color: colors.text }}
              activeOutlineColor={colors.primary}
              outlineColor={colors.border}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.inputBackground }]}
              right={correo ? <TextInput.Icon icon="close" onPress={() => setCorreo('')} /> : undefined}
            />

            <TextInput
              label="Dirección (opcional)"
              value={direccion}
              onChangeText={setDireccion}
              textColor={colors.text}
              contentStyle={{ color: colors.text }}
              activeOutlineColor={colors.primary}
              outlineColor={colors.border}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.inputBackground }]}
              right={direccion ? <TextInput.Icon icon="close" onPress={() => setDireccion('')} /> : undefined}
            />

            <TextInput
              label="Ciudad / Municipio (opcional)"
              value={ciudad}
              onChangeText={setCiudad}
              textColor={colors.text}
              contentStyle={{ color: colors.text }}
              activeOutlineColor={colors.primary}
              outlineColor={colors.border}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.inputBackground }]}
              right={ciudad ? <TextInput.Icon icon="close" onPress={() => setCiudad('')} /> : undefined}
            />
          </Card.Content>
        </Card>

        {/* Tarjeta 2: Credit Policies */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: colors.text }]}>
              Políticas de Crédito
            </Text>
            <Divider style={styles.divider} />

            <TextInput
              label="Límite de Crédito Predeterminado ($) *"
              value={limitePredeterminado}
              onChangeText={(val) => setLimitePredeterminado(formatearMonedaInput(val))}
              keyboardType="numeric"
              textColor={colors.text}
              contentStyle={{ color: colors.text }}
              activeOutlineColor={colors.primary}
              outlineColor={colors.border}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.inputBackground }]}
              left={<TextInput.Affix text="$ " />}
              right={limitePredeterminado ? <TextInput.Icon icon="close" onPress={() => setLimitePredeterminado('')} /> : undefined}
            />
          </Card.Content>
        </Card>

        {/* Tarjeta 3: Appearance */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: colors.text }]}>
              Apariencia (Appearance)
            </Text>
            <Divider style={styles.divider} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 20 }}>{isDarkMode ? '🌙' : '☀️'}</Text>
                <Text variant="bodyMedium" style={{ color: colors.text, fontWeight: '600' }}>
                  Modo Oscuro / Modo Claro
                </Text>
              </View>

              <Switch value={isDarkMode} onValueChange={toggleTheme} color={colors.primary} />
            </View>
          </Card.Content>
        </Card>

        {error && (
          <HelperText type="error" visible={true} style={{ fontSize: 13, marginBottom: 10 }}>
            {error}
          </HelperText>
        )}

        <Button
          mode="contained"
          buttonColor={isDarkMode ? '#bb86fc' : '#6200ee'}
          textColor={isDarkMode ? '#000000' : '#ffffff'}
          icon="content-save"
          onPress={handleGuardar}
          loading={guardando}
          disabled={guardando}
          style={styles.btnGuardar}
          contentStyle={{ paddingVertical: 4 }}
        >
          Guardar Cambios
        </Button>

        {/* Botón Cerrar Sesión (Separado adecuadamente) */}
        <Button
          mode="outlined"
          textColor="#d32f2f"
          icon="logout"
          onPress={logout}
          style={styles.btnCerrarSesion}
          contentStyle={{ paddingVertical: 4 }}
        >
          Cerrar Sesión
        </Button>

        {/* Footer Version Stitch */}
        <View style={styles.footerVersion}>
          <Text variant="bodySmall" style={{ color: colors.textSecondary, textAlign: 'center' }}>
            FiaYa v{APP_VERSION} • Build {APP_BUILD_DATE.replace(/[- :]/g, '').substring(0, 8)}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  storeNameHeader: {
    color: '#6200ee',
    fontWeight: 'bold',
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  titulo: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  divider: {
    marginVertical: 10,
  },
  input: {
    marginBottom: 10,
    borderRadius: 8,
  },
  btnGuardar: {
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 14,
  },
  btnCerrarSesion: {
    borderRadius: 12,
    borderColor: '#d32f2f',
    marginBottom: 16,
  },
  footerVersion: {
    marginTop: 20,
    alignItems: 'center',
  },
});
