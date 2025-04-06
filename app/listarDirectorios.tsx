import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';

type FileItem = {
    uri: string;
    name: string;
    isDirectory: boolean;
    size?: number;
    modificationTime?: number;
    exists: boolean;
};

export default function ListarDirectorios() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [currentPath, setCurrentPath] = useState(FileSystem.documentDirectory || '');
    const router = useRouter();

    useEffect(() => {
        loadFiles(currentPath);
    }, [currentPath]);

    const loadFiles = async (path: string) => {
        try {
            const files = await FileSystem.readDirectoryAsync(path);
            const fileDetails = await Promise.all(
                files.map(async (file) => {
                    const filePath = `${path}${file}`;
                    const info = await FileSystem.getInfoAsync(filePath);
                    return {
                        uri: filePath,
                        name: file,
                        isDirectory: info.isDirectory,
                        size: info.exists ? info.size : undefined,
                        modificationTime: info.exists ? info.modificationTime : undefined,
                        exists: info.exists,
                    };
                })
            );
            setFiles(fileDetails);
        } catch (error) {
            console.error('Error al cargar archivos:', error);
            Alert.alert('Error', 'No se pudieron cargar los archivos');
        }
    };

    const handleNavigate = (file: FileItem) => {
        if (file.isDirectory) {
            setCurrentPath(file.uri + '/');
        }
    };

    const handleGoBack = () => {
        if (currentPath !== FileSystem.documentDirectory) {
            const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/', currentPath.length - 2)) + '/';
            setCurrentPath(parentPath);
        }
    };

    const handleDelete = async (file: FileItem) => {
        try {
            if (file.isDirectory) {
                await FileSystem.deleteAsync(file.uri, { idempotent: true });
            } else {
                await FileSystem.deleteAsync(file.uri);
            }
            Alert.alert('Éxito', 'Archivo eliminado correctamente');
            loadFiles(currentPath);
        } catch (error) {
            console.error('Error al eliminar:', error);
            Alert.alert('Error', 'No se pudo eliminar el archivo');
        }
    };

    const formatSize = (bytes?: number) => {
        if (!bytes) return 'N/A';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
    };

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={handleGoBack}
                    disabled={currentPath === FileSystem.documentDirectory}
                >
                    <Text style={styles.backButtonText}>↑ Subir</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.pathText}>Ruta actual: {currentPath}</Text>

            <FlatList
                data={files}
                keyExtractor={(item) => item.uri}
                renderItem={({ item }) => (
                    <View style={styles.itemContainer}>
                        <TouchableOpacity 
                            style={styles.itemContent}
                            onPress={() => handleNavigate(item)}
                        >
                            <Text style={styles.itemText}>
                                {item.isDirectory ? '📁 ' : '📄 '}
                                {item.name}
                            </Text>
                            <View style={styles.itemDetails}>
                                <Text style={styles.detailText}>
                                    {formatSize(item.size)}
                                </Text>
                                <Text style={styles.detailText}>
                                    {formatDate(item.modificationTime)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => handleDelete(item)}
                        >
                            <Text style={styles.actionButtonText}>Eliminar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    pathText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    backButton: {
        padding: 10,
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemContent: {
        flex: 1,
    },
    itemText: {
        fontSize: 16,
        marginBottom: 5,
    },
    itemDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailText: {
        fontSize: 12,
        color: '#666',
    },
    actionButton: {
        padding: 10,
        borderRadius: 5,
        marginLeft: 10,
        backgroundColor: '#FF3B30',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
    },
});
