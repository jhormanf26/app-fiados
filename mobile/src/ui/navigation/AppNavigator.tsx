import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import { InicioScreen } from '../screens/InicioScreen';
import { ClientesScreen } from '../screens/ClientesScreen';
import { DetalleClienteScreen } from '../screens/DetalleClienteScreen';
import { ConfiguracionScreen } from '../screens/ConfiguracionScreen';

const Tab = createBottomTabNavigator();
const ClientesStack = createNativeStackNavigator();

function ClientesStackScreen() {
  return (
    <ClientesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1e1e1e' },
        headerTintColor: '#ffffff',
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
        options={{ title: 'Detalle del Cliente' }}
      />
    </ClientesStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1e1e1e',
          borderTopColor: '#333333',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#bb86fc',
        tabBarInactiveTintColor: '#b0bec5',
      }}
    >
      <Tab.Screen
        name="InicioTab"
        component={InicioScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => <Icon source="storefront" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ClientesTab"
        component={ClientesStackScreen}
        options={{
          tabBarLabel: 'Clientes',
          tabBarIcon: ({ color, size }) => <Icon source="account-group" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ConfiguracionTab"
        component={ConfiguracionScreen}
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Icon source="cog" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
