import { Tabs } from "expo-router";
import { useCameraPermissions } from 'expo-camera';
import Ionicons from '@expo/vector-icons/Ionicons';

interface TabIconProps {
  color: string;
  size: number;
}

export default function TabsLayout() {
  const [permission, requestPermission] = useCameraPermissions();

  const handleCameraPress = async () => {
    if (!permission?.granted) {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        return;
      }
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#023c69',
        tabBarInactiveTintColor: '#666666',
        headerStyle: {
          backgroundColor: '#023c69',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerTitle: "DocScanner"
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Escanear",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
          headerTitle: "Escanear Documento"
        }}
        listeners={{
          tabPress: async (e: { preventDefault: () => void }) => {
            await handleCameraPress();
          }
        }}
      />
      <Tabs.Screen
        name="listarDirectorios"
        options={{
          title: "Documentos",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="folder" size={size} color={color} />
          ),
          headerTitle: "Mis Documentos"
        }}
      />
    </Tabs>
  );
} 