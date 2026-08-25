import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Checkbox, IconButton, HelperText, Menu } from 'react-native-paper';
import { useAuth } from '../auth/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';

const CATEGORIAS_TIENDA = [
  'Supermercado / Abarrotes',
  'Granero / Tienda de Barrio',
  'Panadería / Pastelería',
  'Carnicería / Fruver',
  'Droguería / Farmacia',
  'Ferretería / Materiales',
  'Papelería / Variedades',
  'Restaurante / Cafetería',
  'Licorería / Cigarrería',
  'Otro Negocio',
];

export const RegistroTiendaScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDarkMode, colors } = useAppTheme();
  const { registrarTienda } = useAuth();

  const [nombreTienda, setNombreTienda] = useState('');
  const [nit, setNit] = useState('');
  const [categoria, setCategoria] = useState('Supermercado / Abarrotes');
  const [menuCategoriaVisible, setMenuCategoriaVisible] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleCrearTienda = async () => {
    if (!nombreTienda.trim()) {
      setErrorText('Por favor ingresa el nombre de tu tienda.');
      return;
    }
    if (!nit.trim()) {
      setErrorText('Por favor ingresa tu NIT o Cédula.');
      return;
    }
    if (password && password !== confirmPassword) {
      setErrorText('Las contraseñas no coinciden.');
      return;
    }
    if (!aceptaTerminos) {
      setErrorText('Debes aceptar los Términos y Condiciones.');
      return;
    }

    setCargando(true);
    setErrorText(null);
    try {
      await registrarTienda({
        nombre: nombreTienda.trim(),
        documentoPropietario: nit.trim(),
        categoria,
        direccion: direccion.trim(),
      });
      // El cambio en AuthContext redirigirá automáticamente al Dashboard
    } catch (e: any) {
      setErrorText(e.message || 'Error al crear la tienda.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Bar con Flecha Atrás */}
      <View style={[styles.topHeaderBar, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
        <IconButton
          icon="arrow-left"
          iconColor={colors.text}
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleMedium" style={styles.brandTitleHeader}>
          LedgerPro
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Título & Subtítulo */}
        <View style={styles.titleSection}>
          <Text variant="headlineMedium" style={[styles.pageTitle, { color: colors.text }]}>
            Crear Tienda
          </Text>
          <Text variant="bodyMedium" style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
            Configura tu perfil comercial para comenzar a gestionar tus finanzas y clientes de manera eficiente.
          </Text>
        </View>

        {/* Sección 1: Información del Negocio */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: colors.text }]}>
            Información del Negocio
          </Text>

          <TextInput
            label="Nombre de la tienda *"
            value={nombreTienda}
            onChangeText={(v) => {
              setNombreTienda(v);
              setErrorText(null);
            }}
            mode="outlined"
            activeOutlineColor={isDarkMode ? '#bb86fc' : '#6200ee'}
            outlineColor={colors.border}
            textColor={colors.text}
            contentStyle={{ color: colors.text }}
            style={[styles.input, { backgroundColor: colors.inputBackground }]}
            placeholder="Ej: Tienda Don Pedro"
            placeholderTextColor={colors.textSecondary}
          />

          <TextInput
            label="NIT o Cédula *"
            value={nit}
            onChangeText={(v) => {
              setNit(v);
              setErrorText(null);
            }}
            mode="outlined"
            activeOutlineColor={isDarkMode ? '#bb86fc' : '#6200ee'}
            outlineColor={colors.border}
            textColor={colors.text}
            contentStyle={{ color: colors.text }}
            style={[styles.input, { backgroundColor: colors.inputBackground }]}
            placeholder="Ej: 900123456-1"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Sección 2: Detalles Operativos */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: colors.text }]}>
            Detalles Operativos
          </Text>

          <Menu
            visible={menuCategoriaVisible}
            onDismiss={() => setMenuCategoriaVisible(false)}
            contentStyle={{ backgroundColor: colors.card }}
            anchor={
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMenuCategoriaVisible(true)}
              >
                <TextInput
                  label="Categoría del negocio *"
                  value={categoria}
                  editable={false}
                  pointerEvents="none"
                  mode="outlined"
                  activeOutlineColor={isDarkMode ? '#bb86fc' : '#6200ee'}
                  outlineColor={colors.border}
                  textColor={colors.text}
                  contentStyle={{ color: colors.text }}
                  style={[styles.input, { backgroundColor: colors.inputBackground }]}
                  right={
                    <TextInput.Icon
                      icon="chevron-down"
                      color={colors.textSecondary}
                      onPress={() => setMenuCategoriaVisible(true)}
                    />
                  }
                />
              </TouchableOpacity>
            }
          >
            {CATEGORIAS_TIENDA.map((cat) => (
              <Menu.Item
                key={cat}
                onPress={() => {
                  setCategoria(cat);
                  setMenuCategoriaVisible(false);
                }}
                title={cat}
                titleStyle={{ color: colors.text }}
              />
            ))}
          </Menu>

          <TextInput
            label="Dirección / Ubicación"
            value={direccion}
            onChangeText={setDireccion}
            mode="outlined"
            activeOutlineColor={isDarkMode ? '#bb86fc' : '#6200ee'}
            outlineColor={colors.border}
            textColor={colors.text}
            contentStyle={{ color: colors.text }}
            style={[styles.input, { backgroundColor: colors.inputBackground }]}
            placeholder="Ej: Carrera 15 # 45-20"
            placeholderTextColor={colors.textSecondary}
            left={<TextInput.Icon icon="map-marker-outline" color={colors.textSecondary} />}
          />

          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            activeOutlineColor={isDarkMode ? '#bb86fc' : '#6200ee'}
            outlineColor={colors.border}
            textColor={colors.text}
            contentStyle={{ color: colors.text }}
            style={[styles.input, { backgroundColor: colors.inputBackground }]}
            placeholder="••••••••"
            placeholderTextColor={colors.textSecondary}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                color={colors.textSecondary}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <TextInput
            label="Confirmar Contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            activeOutlineColor={isDarkMode ? '#bb86fc' : '#6200ee'}
            outlineColor={colors.border}
            textColor={colors.text}
            contentStyle={{ color: colors.text }}
            style={[styles.input, { backgroundColor: colors.inputBackground }]}
            placeholder="••••••••"
            placeholderTextColor={colors.textSecondary}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                color={colors.textSecondary}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
          />

          {/* Checkbox Términos y Condiciones */}
          <TouchableOpacity
            style={styles.termsBox}
            onPress={() => setAceptaTerminos(!aceptaTerminos)}
            activeOpacity={0.8}
          >
            <Checkbox.Android
              status={aceptaTerminos ? 'checked' : 'unchecked'}
              color={isDarkMode ? '#bb86fc' : '#6200ee'}
              onPress={() => setAceptaTerminos(!aceptaTerminos)}
            />
            <Text variant="bodySmall" style={{ flex: 1, color: colors.text, lineHeight: 16 }}>
              He leído y acepto los{' '}
              <Text style={{ color: isDarkMode ? '#bb86fc' : '#6200ee', fontWeight: 'bold' }}>
                Términos y Condiciones
              </Text>{' '}
              y la{' '}
              <Text style={{ color: isDarkMode ? '#bb86fc' : '#6200ee', fontWeight: 'bold' }}>
                Política de Privacidad
              </Text>{' '}
              de LedgerPro.
            </Text>
          </TouchableOpacity>
        </View>

        {errorText && (
          <HelperText type="error" visible={true} style={{ marginBottom: 10 }}>
            {errorText}
          </HelperText>
        )}

        {/* Botón Principal: Crear mi Tienda Digital */}
        <Button
          mode="contained"
          buttonColor={isDarkMode ? '#bb86fc' : '#6200ee'}
          textColor={isDarkMode ? '#000000' : '#ffffff'}
          icon="storefront-outline"
          loading={cargando}
          disabled={cargando}
          onPress={handleCrearTienda}
          style={styles.btnCrear}
          contentStyle={{ paddingVertical: 8 }}
        >
          Crear mi Tienda Digital
        </Button>

        {/* Botón Cancelar */}
        <Button
          mode="text"
          textColor={colors.textSecondary}
          onPress={() => navigation.goBack()}
          style={styles.btnCancelar}
        >
          Cancelar
        </Button>
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
    paddingHorizontal: 12,
    paddingTop: 36,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  brandTitleHeader: {
    color: '#6200ee',
    fontWeight: 'bold',
    fontSize: 18,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    maxWidth: 420,
  },
  pageTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pageSubtitle: {
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  sectionCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(98, 0, 238, 0.04)',
    padding: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  btnCrear: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    elevation: 3,
    marginBottom: 8,
  },
  btnCancelar: {
    marginBottom: 20,
  },
});
