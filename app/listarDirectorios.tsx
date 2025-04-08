import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import Ionicons from '@expo/vector-icons/Ionicons';
import WebView from 'react-native-webview';

interface ArchivoInfo {
    nombre: string;
    fechaCreacion: Date;
}

export default function ListarDirectorios() {
    const [archivos, setArchivos] = useState<ArchivoInfo[]>([]);
    const [pdfVisible, setPdfVisible] = useState(false);
    const [pdfUri, setPdfUri] = useState('');

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
            backgroundColor: '#fff',
        },
        titulo: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
        },
        item: {
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
        },
        nombreArchivo: {
            fontSize: 16,
            fontWeight: 'bold',
        },
        fechaCreacion: {
            fontSize: 12,
            color: '#666',
            marginTop: 5,
        },
        itemHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        itemInfo: {
            flex: 1,
        },
        boton: {
            backgroundColor: '#023c69',
            padding: 5,
            borderRadius: 5,
            marginTop: 10,
        },
        textoBoton: {
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
        },
        sinArchivos: {
            textAlign: 'center',
            marginTop: 20,
            fontSize: 16,
            color: '#666',
        },
        botonesContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10
        },
        modalContainer: {
            flex: 1,
            backgroundColor: 'white',
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            padding: 10,
            backgroundColor: '#f5f5f5',
        },
        webview: {
            flex: 1,
        },
    });

    const cargarArchivos = async () => {
        try {
            const directorio = `${FileSystem.documentDirectory}EscaneosDocApp/`;
            const dirInfo = await FileSystem.getInfoAsync(directorio);
            
            if (dirInfo.exists) {
                const archivos = await FileSystem.readDirectoryAsync(directorio);
                const archivosPDF = archivos.filter(archivo => archivo.endsWith('.pdf'));
                
                const archivosConInfo = await Promise.all(
                    archivosPDF.map(async (archivo) => {
                        const info = await FileSystem.getInfoAsync(`${directorio}${archivo}`);
                        if (info.exists && !info.isDirectory) {
                            return {
                                nombre: archivo,
                                fechaCreacion: new Date(info.modificationTime)
                            };
                        }
                        return {
                            nombre: archivo,
                            fechaCreacion: new Date()
                        };
                    })
                );

                // Ordenar por fecha de creación (más reciente primero)
                archivosConInfo.sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
                
                setArchivos(archivosConInfo);
            } else {
                setArchivos([]);
            }
        } catch (error) {
            console.error('Error al cargar archivos:', error);
            Alert.alert('Error', 'No se pudieron cargar los archivos');
        }
    };

    const compartirArchivo = async (nombreArchivo: string) => {
        try {
            const rutaArchivo = `${FileSystem.documentDirectory}EscaneosDocApp/${nombreArchivo}`;
            await shareAsync(rutaArchivo, {
                dialogTitle: "Compartir PDF",
                mimeType: 'application/pdf',
                UTI: 'com.adobe.pdf'
            });
        } catch (error) {
            console.error('Error al compartir archivo:', error);
            Alert.alert('Error', 'No se pudo compartir el archivo');
        }
    };

    const eliminarArchivo = async (nombreArchivo: string) => {
        try {
            Alert.alert(
                "Confirmar eliminación",
                "¿Estás seguro de que deseas eliminar este archivo?",
                [
                    {
                        text: "Cancelar",
                        style: "cancel"
                    },
                    {
                        text: "Eliminar",
                        onPress: async () => {
                            const rutaArchivo = `${FileSystem.documentDirectory}EscaneosDocApp/${nombreArchivo}`;
                            await FileSystem.deleteAsync(rutaArchivo);
                            cargarArchivos(); // Recargar la lista
                            Alert.alert("Éxito", "Archivo eliminado correctamente");
                        },
                        style: "destructive"
                    }
                ]
            );
        } catch (error) {
            console.error('Error al eliminar archivo:', error);
            Alert.alert('Error', 'No se pudo eliminar el archivo');
        }
    };

    const verPDF = async (nombreArchivo: string) => {
        try {
            const rutaArchivo = `${FileSystem.documentDirectory}EscaneosDocApp/${nombreArchivo}`;
            // Convertir el archivo a base64
            const base64 = await FileSystem.readAsStringAsync(rutaArchivo, {
                encoding: FileSystem.EncodingType.Base64,
            });
            // Crear una URL de datos
            setPdfUri(`data:application/pdf;base64,${base64}`);
            setPdfVisible(true);
        } catch (error) {
            console.error('Error al abrir el PDF:', error);
            Alert.alert('Error', 'No se pudo abrir el archivo');
        }
    };

    const formatearFecha = (fecha: Date) => {
        return fecha.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    useEffect(() => {
        cargarArchivos();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Documentos Escaneados</Text>
            {archivos.length === 0 ? (
                <Text style={styles.sinArchivos}>No hay documentos escaneados</Text>
            ) : (
                <FlatList
                    data={archivos}
                    keyExtractor={(item) => item.nombre}
                    renderItem={({ item }) => (
                        <View style={styles.item}>
                            <View style={styles.itemHeader}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.nombreArchivo}>{item.nombre}</Text>
                                    <Text style={styles.fechaCreacion}>
                                        Creado: {formatearFecha(item.fechaCreacion)}
                                    </Text>
                                </View>
                                <View style={styles.botonesContainer}>
                                    <TouchableOpacity
                                        onPress={() => verPDF(item.nombre)}
                                    >
                                        <Ionicons name="eye-outline" size={32} color="#023c69"/>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => compartirArchivo(item.nombre)}
                                    >
                                        <Ionicons name="share-outline" size={32} color="black"/>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => eliminarArchivo(item.nombre)}
                                    >
                                        <Ionicons name="trash-outline" size={32} color="red"/>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                />
            )}

            <Modal
                visible={pdfVisible}
                animationType="slide"
                onRequestClose={() => setPdfVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setPdfVisible(false)}>
                            <Ionicons name="close" size={32} color="black"/>
                        </TouchableOpacity>
                    </View>
                    <WebView
                        style={styles.webview}
                        source={{ uri: pdfUri }}
                    />
                </View>
            </Modal>
        </View>
    );
}
