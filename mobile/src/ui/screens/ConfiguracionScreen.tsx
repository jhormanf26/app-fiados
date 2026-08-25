import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, Card, TextInput, Button, HelperText, ActivityIndicator, Divider, Switch } from 'react-native-paper';
import { tiendaRepository } from '../../core/repositories/tiendaRepository';
import { Tienda } from '../../core/types/database';
import { APP_VERSION, APP_BUILD_DATE } from '../../core/constants/version';
import { useAppTheme } from '../theme/ThemeContext';

export const ConfiguracionScreen: React.FC = () => {
  const { isDarkMode, toggleTheme, colors } = useAppTheme();
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
        setLimitePredeterminado(t.limiteCreditoPredeterminado.toString());
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

    const limiteVal = parseFloat(limitePredeterminado.replace(/[^0-9.]/g, ''));
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#bb86fc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={styles.titulo}>
          ⚙️ Ajustes de la Tienda
        </Text>
        <Text variant="bodySmall" style={styles.subtitulo}>
          Configura la información general y el límite de crédito por defecto para tus clientes.
        </Text>

        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Información de la Tienda
            </Text>
            <Divider style={styles.divider} />

            <TextInput
              label="Nombre de la Tienda *"
              value={nombre}
              onChangeText={setNombre}
              textColor="#ffffff"
              contentStyle={{ color: '#ffffff' }}
              activeOutlineColor="#bb86fc"
              outlineColor="#555555"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="store" color="#bb86fc" />}
            />

            <TextInput
              label="Nombre del Propietario *"
              value={nombrePropietario}
              onChangeText={setNombrePropietario}
              textColor="#ffffff"
              contentStyle={{ color: '#ffffff' }}
              activeOutlineColor="#bb86fc"
              outlineColor="#555555"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" color="#bb86fc" />}
            />

            <TextInput
              label="Documento del Propietario *"
              value={documentoPropietario}
              onChangeText={setDocumentoPropietario}
              keyboardType="numeric"
              textColor="#ffffff"
              contentStyle={{ color: '#ffffff' }}
              activeOutlineColor="#bb86fc"
              outlineColor="#555555"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="card-account-details" color="#bb86fc" />}
            />

            <TextInput
              label="Teléfono de Contacto *"
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
              textColor="#ffffff"
              contentStyle={{ color: '#ffffff' }}
              activeOutlineColor="#bb86fc"
              outlineColor="#555555"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="phone" color="#bb86fc" />}
            />

            <TextInput
              label="Correo de la Tienda *"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textColor="#ffffff"
              contentStyle={{ color: '#ffffff' }}
              activeOutlineColor="#bb86fc"
              outlineColor="#555555"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="email" color="#bb86fc" />}
            />

            <TextInput
              label="Dirección (opcional)"
              value={direccion}
              onChangeText={setDireccion}
              textColor="#ffffff"
              contentStyle={{ color: '#ffffff' }}
              activeOutlineColor="#bb86fc"
              outlineColor="#555555"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="map-marker" color="#bb86fc" />}
            />

            <TextInput
              label="Ciudad / Municipio (opcional)"
              value={ciudad}
              onChangeText={setCiudad}
              textColor="#ffffff"
              contentStyle={{ color: '#ffffff' }}
              activeOutlineColor="#bb86fc"
              outlineColor="#555555"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="city" color="#bb86fc" />}
            />
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: colors.card }]} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: colors.text }]}>
              Políticas de Crédito
            </Text>
            <Divider style={styles.divider} />

            <TextInput
              label="Límite de Crédito Predeterminado ($) *"
              value={limitePredeterminado}
              onChangeText={setLimitePredeterminado}
              keyboardType="numeric"
              textColor={colors.text}
              contentStyle={{ color: colors.text }}
              activeOutlineColor={colors.primary}
              outlineColor={colors.border}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.inputBackground }]}
              left={<TextInput.Icon icon="shield-alert-outline" color={colors.primary} />}
            />
            <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 4 }}>
              Este límite se aplicará a todos los clientes nuevos a menos que se defina un límite personalizado.
            </Text>
          </Card.Content>
        </Card>

        {/* Sección Tema Oscuro / Claro */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: colors.text }]}>
              Apariencia de la Aplicación
            </Text>
            <Divider style={styles.divider} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 22 }}>{isDarkMode ? '🌙' : '☀️'}</Text>
                <View>
                  <Text variant="bodyLarge" style={{ color: colors.text, fontWeight: '600' }}>
                    {isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}
                  </Text>
                  <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                    {isDarkMode ? 'Interfaz oscura relajante para la vista' : 'Interfaz clara de alto contraste'}
                  </Text>
                </View>
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
          buttonColor="#6200ee"
          icon="content-save"
          onPress={handleGuardar}
          loading={guardando}
          disabled={guardando}
          style={styles.btnGuardar}
        >
          Guardar Cambios
        </Button>

        <Card style={[styles.card, { backgroundColor: '#181818', marginTop: 10 }]} mode="outlined">
          <Card.Content style={{ alignItems: 'center' }}>
            <Text variant="labelLarge" style={{ color: '#bb86fc', fontWeight: 'bold' }}>
              Gestor Digital de Fiados — Versión {APP_VERSION}
            </Text>
            <Text variant="bodySmall" style={{ color: '#777', marginTop: 2 }}>
              Build: {APP_BUILD_DATE}
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  titulo: {
    color: '#bb86fc',
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#b0bec5',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1e1e1e',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#ffffff',
    fontWeight: '600',
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#333',
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#121212',
  },
  btnGuardar: {
    borderRadius: 8,
    paddingVertical: 4,
    marginBottom: 30,
  },
});
