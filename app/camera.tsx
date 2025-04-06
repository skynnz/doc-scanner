import { useState, useRef } from "react";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, Alert, ScrollView } from 'react-native';
import { CameraCapturedPicture } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';


export default function Camara() {

    const styles = StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
        },
        message: {
          textAlign: 'center',
          paddingBottom: 10,
        },
        camera: {
          flex: 1,
        },
        buttonContainer: {
          flex: 1,
          flexDirection: 'row',
          backgroundColor: 'transparent',
          margin: 64,
        },
        button: {
          flex: 1,
          alignSelf: 'flex-end',
          alignItems: 'center',
        },
        text: {
          fontSize: 24,
          fontWeight: 'bold',
          color: 'white',
        },
        preview: {
            flex: 1,
            width: '100%',
            height: '100%',
        },
        previewContainer: {
            flex: 1,
            width: '100%',
        },
        previewButtons: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            position: 'absolute',
            bottom: 20,
            width: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: 10,
        },
      });

    const [facing , setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [photos, setPhotos] = useState<CameraCapturedPicture[]>([]);
    const [currentPhoto, setCurrentPhoto] = useState<CameraCapturedPicture | null>(null);

    if (!permission) {
        return <View/>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Necesitamos permiso para utilizar la camara.</Text>
                <Button onPress={requestPermission} title="Permitir uso"/>
            </View>
        );
    }
    
    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const foto = await cameraRef.current?.takePictureAsync({
                    quality: 1,
                    base64: true,
                    imageType: "jpg"
                });
                if (foto) {
                    setPhotos(prev => [...prev, foto]);
                    setCurrentPhoto(foto);
                }
            } catch(error) {
                console.error("Error al tomar la foto:", error);
            }
        }
    };

    const retakePicture = () => {
        setCurrentPhoto(null);
    };

    const createPDF = async () => {
        if (photos.length === 0) {
            Alert.alert("Error", "No hay fotos para crear el PDF");
            return;
        }
    
        try {
            // const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            // const filename = `documento_${timestamp}.pdf`;

            const html = `
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    </head>
                    <body style="margin: 0; padding: 0;">
                        ${photos.map(photo => `
                            <div style="page-break-after: always;">
                                <img src="data:image/jpeg;base64,${photo.base64}" 
                                     style="width: 100%; height: auto;" />
                            </div>
                        `).join('')}
                    </body>
                </html>
            `;
    
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false,
            });
    
            // Compartir el PDF
            await shareAsync(uri, { 
                dialogTitle: "Compartir PDF",
                mimeType: 'application/pdf',
                UTI: 'com.adobe.pdf'
            });
    
            setPhotos([]);
            setCurrentPhoto(null);
        } catch (error: any) {
            console.error("Error al crear PDF:", error);
            Alert.alert(
                "Error",
                "No se pudo crear el PDF. Error: " + (error.message || "Desconocido"),
                [{ text: "OK" }]
            );
        }
    };

    if (currentPhoto) {
        return (
            <View style={styles.previewContainer}>
                <Image
                    source={{ uri: currentPhoto.uri }}
                    style={styles.preview}
                />
                <Text style={[styles.text, { position: 'absolute', top: 20 }]}>
                    Fotos tomadas: {photos.length}
                </Text>
                <View style={styles.previewButtons}>
                    <TouchableOpacity style={styles.button} onPress={retakePicture}>
                        <Text style={styles.text}>Volver a tomar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => {
                        setCurrentPhoto(null);
                        takePicture();
                    }}>
                        <Text style={styles.text}>Tomar otra foto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={createPDF}>
                        <Text style={styles.text}>Crear PDF</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView 
                ref={cameraRef}
                style={styles.camera} 
                facing={facing}
            >
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                        <Text style={styles.text}>Voltear cámara</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={takePicture}>
                        <Text style={styles.text}>📸</Text>
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
}