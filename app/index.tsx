import { Text, View } from "react-native";
import { useState } from "react";
import { Link } from "expo-router";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import Camara from "./camera";


export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();

  const handleCameraPress = async () => {
    if (!permission?.granted) {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        return; // No navegar si no hay permisos
      }
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Link href="/camera" onPress={handleCameraPress}>
        {permission?.granted ? "Ir a la Cámara" : "Permitir Cámara"}
      </Link>
      <Link href="/listarDirectorios">Directorio</Link>
    </View>
  );
}
