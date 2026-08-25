import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon, Text } from 'react-native-paper';
import { InicioScreen } from '../screens/InicioScreen';
import { ClientesScreen } from '../screens/ClientesScreen';
import { DetalleClienteScreen } from '../screens/DetalleClienteScreen';
import { ConfiguracionScreen } from '../screens/ConfiguracionScreen';
import { useAppTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();
const ClientesStack = createNativeStackNavigator();

function CustomStitchTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDarkMode } = useAppTheme();

  return (
    <View
      style={[
        styles.tabContainer,
        {
          backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
          borderTopColor: isDarkMode ? '#333333' : '#e0e0e0',
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let label = 'Tab';
        let iconName = 'square';
        if (route.name === 'InicioTab') {
          label = 'Dashboard';
          iconName = 'view-dashboard-outline';
        } else if (route.name === 'ClientesTab') {
          label = 'Directorio';
          iconName = 'account-group-outline';
        } else if (route.name === 'ConfiguracionTab') {
          label = 'Ajustes';
          iconName = 'cog-outline';
        }

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.8}
            onPress={onPress}
            style={styles.tabButton}
          >
            {isFocused ? (
              <View style={[styles.activePill, { backgroundColor: '#81c784' }]}>
                <Icon source={iconName} size={20} color="#1b5e20" />
                <Text style={styles.activeLabel}>{label}</Text>
              </View>
            ) : (
              <View style={styles.inactiveCol}>
                <Icon source={iconName} size={22} color={isDarkMode ? '#888888' : '#666666'} />
                <Text style={[styles.inactiveLabel, { color: isDarkMode ? '#888888' : '#666666' }]}>
                  {label}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ClientesStackScreen() {
  const { isDarkMode } = useAppTheme();

  return (
    <ClientesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' },
        headerTintColor: isDarkMode ? '#ffffff' : '#1c1b1f',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <ClientesStack.Screen
        name="ClientesLista"
        component={ClientesScreen}
        options={{ headerShown: false }}
      />
      <ClientesStack.Screen
        name="DetalleCliente"
        component={DetalleClienteScreen}
        options={{ headerShown: false }}
      />
    </ClientesStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomStitchTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="InicioTab" component={InicioScreen} />
      <Tab.Screen name="ClientesTab" component={ClientesStackScreen} />
      <Tab.Screen name="ConfiguracionTab" component={ConfiguracionScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    height: 65,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeLabel: {
    color: '#1b5e20',
    fontWeight: 'bold',
    fontSize: 13,
  },
  inactiveCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  inactiveLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
