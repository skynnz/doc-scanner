import { useState, useRef } from "react";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, Alert, ScrollView, TextInput } from 'react-native';
import { CameraCapturedPicture } from 'expo-camera';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import Ionicons  from '@expo/vector-icons/Ionicons';



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
        dialogoContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
        },
        dialogo: {
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
            width: '80%',
        },
        input: {
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 5,
            padding: 10,
            marginBottom: 10,
        },
        botonesDialogo: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
        },
        botonDialogo: {
            marginLeft: 10,
            padding: 10,
        },
        textoBotonDialogo: {
            color: '#023c69',
            fontWeight: 'bold',
        },
    });

    const [facing , setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [photos, setPhotos] = useState<CameraCapturedPicture[]>([]);
    const [currentPhoto, setCurrentPhoto] = useState<CameraCapturedPicture | null>(null);
    const [nombreArchivo, setNombreArchivo] = useState('');
    const [mostrarDialogo, setMostrarDialogo] = useState(false);

    const ensureDirectoryExists = async () => {
        const directory = `${FileSystem.documentDirectory}EscaneosDocApp/`;
        const dirInfo = await FileSystem.getInfoAsync(directory);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        }
        return directory;
    };

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
                    imageType: "jpg",
                    skipProcessing: false,
                    exif: true
                });
                
                if (foto) {
                    setPhotos(prev => [...prev, foto]);
                    setCurrentPhoto(foto);
                }
            } catch(error) {
                console.error("Error al tomar la foto:", error);
                Alert.alert(
                    "Error",
                    "No se pudo tomar la foto. Por favor, intente nuevamente.",
                    [{ text: "OK" }]
                );
            }
        }
    };

    const retakePicture = () => {
        setPhotos(prev => {
            const newPhotos = [...prev];
            newPhotos.pop();
            return newPhotos;
        });
        setCurrentPhoto(null);
    };

    const createPDF = async () => {
        if (photos.length === 0) {
            Alert.alert("Error", "No hay fotos para crear el PDF");
            return;
        }
        setMostrarDialogo(true);
    };

    const guardarPDF = async () => {
        if (!nombreArchivo) {
            Alert.alert("Error", "Debe ingresar un nombre para el archivo");
            return;
        }
        
        try {
            // Limpiar el nombre de caracteres no permitidos
            const nombreLimpio = nombreArchivo.replace(/[^a-zA-Z0-9-_]/g, '_');
            const filename = `${nombreLimpio}.pdf`;

            const html = `
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                        <style>
                            body { margin: 0; padding: 0; }
                            .page-break { page-break-after: always; }
                            .last-page { page-break-after: avoid; }
                        </style>
                    </head>
                    <body>
                        ${photos.map((photo, index) => `
                            <div class="${index === photos.length - 1 ? 'last-page' : 'page-break'}">
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

            // Asegurar que el directorio existe
            const directory = await ensureDirectoryExists();
            const newUri = `${directory}${filename}`;
            
            // Mover el archivo al directorio de escaneos
            await FileSystem.moveAsync({
                from: uri,
                to: newUri
            });
    
            setPhotos([]);
            setCurrentPhoto(null);
            setNombreArchivo('');
            setMostrarDialogo(false);
            Alert.alert("Éxito", "Archivo creado exitosamente!", [{ text:"OK" }]);
        } catch (error: any) {
            console.error("Error al crear PDF:", error);
            Alert.alert(
                "Error",
                "No se pudo crear el PDF. Error: " + (error.message || "Desconocido"),
                [{ text: "OK" }]
            );
        }
    };

    if (mostrarDialogo) {
        return (
            <View style={styles.dialogoContainer}>
                <View style={styles.dialogo}>
                    <Text style={{ marginBottom: 10, fontSize: 16 }}>Ingrese un nombre para el archivo PDF:</Text>
                    <TextInput
                        style={styles.input}
                        value={nombreArchivo}
                        onChangeText={setNombreArchivo}
                        placeholder="Nombre del documento"
                        autoFocus
                    />
                    <View style={styles.botonesDialogo}>
                        <TouchableOpacity 
                            style={styles.botonDialogo}
                            onPress={() => {
                                setMostrarDialogo(false);
                                setNombreArchivo('');
                            }}
                        >
                            <Text style={styles.textoBotonDialogo}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.botonDialogo}
                            onPress={guardarPDF}
                        >
                            <Text style={styles.textoBotonDialogo}>Guardar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

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
                        <Ionicons name="trash-outline" size={32} color={"white"}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => {
                        setCurrentPhoto(null);
                        takePicture();
                    }}>
                        <Ionicons name="add-outline" size={32} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={createPDF}>
                        <Ionicons name="document-outline" size={32} color="white" />
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
                zoom={0}
                ratio="4:3"
            >
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                        <Ionicons name="sync-outline" size={32} color={"white"}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={takePicture}>
                        <Ionicons name="camera" size={32} color="white" />
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
}