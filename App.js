import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
  BackHandler,
} from 'react-native';

import { useState, useRef, useEffect } from 'react';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { StatusBar } from 'expo-status-bar';

import { CameraView, useCameraPermissions } from 'expo-camera';

import * as MediaLibrary from 'expo-media-library/legacy';

import * as ImagePicker from 'expo-image-picker';

export default function App() {
  return (
    <SafeAreaProvider>
      <Principal />
    </SafeAreaProvider>
  );
}

function Principal() {
  const [tela, setTela] = useState('inicio');
  const [fotoVista, setFotoVista] = useState(null);
  const [ultimaFoto, setUltimaFoto] = useState(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (fotoVista) {
        setFotoVista(null);
        return true;
      }
      if (tela === 'camera') {
        setTela('inicio');
        return true;
      }
      return false;
    });

    return () => sub.remove();
  }, [fotoVista, tela]);

  async function abrirGaleria() {
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (!resultado.canceled) {
        setFotoVista(resultado.assets[0].uri);
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', `Não foi possível abrir a galeria: ${error}`);
    }
  }

  if (fotoVista) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Image source={{ uri: fotoVista }} style={styles.fotoGrande} />

        <SafeAreaView style={styles.barraTopo} edges={['top']}>
          <TouchableOpacity
            style={styles.botaoRedondo}
            onPress={() => setFotoVista(null)}
            hitSlop={15}
          >
            <Text style={styles.icone}>✕</Text>
          </TouchableOpacity>
        </SafeAreaView>

        <SafeAreaView style={styles.barraBaixoCentro} edges={['bottom']}>
          <TouchableOpacity style={styles.botao} onPress={abrirGaleria}>
            <Text style={styles.botaoTexto}>🖼️ Escolher da galeria</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  if (tela === 'camera') {
    return (
      <TelaCamera
        ultimaFoto={ultimaFoto}
        aoTirarFoto={setUltimaFoto}
        aoFechar={() => setTela('inicio')}
        aoAbrirGaleria={abrirGaleria}
        aoVerFoto={setFotoVista}
      />
    );
  }

  return (
    <SafeAreaView style={styles.centro}>
      <StatusBar style="dark" />
      <Text style={styles.titulo}>📷</Text>
      <Text style={styles.texto}>Tire fotos e salve direto na galeria.</Text>

      <TouchableOpacity style={styles.botao} onPress={() => setTela('camera')}>
        <Text style={styles.botaoTexto}>📷 Abrir câmera</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botao} onPress={abrirGaleria}>
        <Text style={styles.botaoTexto}>🖼️ Abrir galeria</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function TelaCamera({ ultimaFoto, aoTirarFoto, aoFechar, aoAbrirGaleria, aoVerFoto }) {
  const [permissaoCamera, pedirPermissaoCamera] = useCameraPermissions();
  const [permissaoGaleria, pedirPermissaoGaleria] = MediaLibrary.usePermissions({ writeOnly: true });
  const [salvando, setSalvando] = useState(false);
  const [lado, setLado] = useState('back');
  const [flash, setFlash] = useState('off');
  const camera = useRef(null);

  if (!permissaoCamera || !permissaoGaleria) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#1e88e5" />
      </View>
    );
  }

  const temPermissao = permissaoCamera.granted && permissaoGaleria.granted;

  async function pedirPermissoes() {
    const bloqueada =
      (!permissaoCamera.granted && !permissaoCamera.canAskAgain) ||
      (!permissaoGaleria.granted && !permissaoGaleria.canAskAgain);

    if (bloqueada) {
      Linking.openSettings();
      return;
    }

    const cam = await pedirPermissaoCamera();

    if (cam.granted) {
      await pedirPermissaoGaleria();
    }
  }

  async function tirarFoto() {
    if (!camera.current || salvando) {
      return;
    }

    setSalvando(true);

    try {
      const foto = await camera.current.takePictureAsync({
        quality: 0.8,
      });

      await MediaLibrary.saveToLibraryAsync(foto.uri);

      aoTirarFoto(foto.uri);
      Alert.alert('Sucesso', 'Foto salva na galeria!');
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', `Erro ao salvar na galeria: ${error}`);
    } finally {
      setSalvando(false);
    }
  }

  function alternarCamera() {
    setLado((atual) => (atual === 'back' ? 'front' : 'back'));
  }

  function alternarFlash() {
    setFlash((atual) => (atual === 'off' ? 'on' : 'off'));
  }

  if (!temPermissao) {
    return (
      <SafeAreaView style={styles.centro}>
        <Text style={styles.titulo}>📷 Permissões necessárias</Text>
        <Text style={styles.texto}>
          É necessária a permissão da câmera e da galeria
        </Text>
        <TouchableOpacity style={styles.botao} onPress={pedirPermissoes}>
          <Text style={styles.botaoTexto}>Conceder permissões</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.botao, styles.botaoCinza]} onPress={aoFechar}>
          <Text style={styles.botaoTexto}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing={lado}
        flash={flash}
      />

      <SafeAreaView style={[styles.barraTopo, styles.barraTopoEspaco]} edges={['top']}>
        <TouchableOpacity style={styles.botaoRedondo} onPress={aoFechar} hitSlop={15}>
          <Text style={styles.icone}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoRedondo} onPress={alternarFlash} hitSlop={15}>
          <Text style={styles.icone}>{flash === 'on' ? '⚡' : '🚫'}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <SafeAreaView style={styles.barraBaixo} edges={['bottom']}>
        <View style={styles.lado}>
          <TouchableOpacity
            hitSlop={15}
            onPress={ultimaFoto ? () => aoVerFoto(ultimaFoto) : aoAbrirGaleria}
          >
            {ultimaFoto ? (
              <Image source={{ uri: ultimaFoto }} style={styles.miniatura} />
            ) : (
              <View style={styles.botaoRedondo}>
                <Text style={styles.icone}>🖼️</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.disparoExterno}
          onPress={tirarFoto}
          disabled={salvando}
        >
          {salvando ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <View style={styles.disparoInterno} />
          )}
        </TouchableOpacity>

        <View style={styles.lado}>
          <TouchableOpacity style={styles.botaoRedondo} onPress={alternarCamera} hitSlop={15}>
            <Text style={styles.icone}>🔄</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  texto: {
    textAlign: 'center',
    color: '#444',
    marginBottom: 20,
  },
  botao: {
    backgroundColor: '#1e88e5',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginVertical: 6,
    minWidth: 220,
    alignItems: 'center',
  },
  botaoCinza: {
    backgroundColor: '#757575',
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fotoGrande: {
    flex: 1,
    resizeMode: 'contain',
  },
  barraTopo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
    elevation: 10,
  },
  barraTopoEspaco: {
    justifyContent: 'space-between',
  },
  barraBaixo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
    zIndex: 10,
    elevation: 10,
  },
  barraBaixoCentro: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 20,
    zIndex: 10,
    elevation: 10,
  },
  lado: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoRedondo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icone: {
    fontSize: 22,
    color: '#fff',
  },
  miniatura: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  disparoExterno: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disparoInterno: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});