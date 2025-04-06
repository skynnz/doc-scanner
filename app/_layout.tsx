import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // Personalizar la animación de transición
        animation: 'slide_from_right',
      }}
    >
      {/* Puedes definir pantallas específicas y sus opciones */}
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Inicio' 
        }} 
      />
      <Stack.Screen 
        name="camera" 
        options={{ 
          title: 'Cámara' 
        }} 
      />
    </Stack>
  );
}
