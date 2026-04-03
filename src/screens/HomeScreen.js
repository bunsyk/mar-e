import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createAudioPlayer,
  requestRecordingPermissionsAsync,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  copyAssetToDeviceStorage,
  deleteStoredAsset,
  getBoardStorageKey,
  loadBoardButtons,
  saveBoardButtons,
} from '../utils/buttonBoardStorage';

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [buttons, setButtons] = useState([]);
  const [composerVisible, setComposerVisible] = useState(false);
  const [buttonLabel, setButtonLabel] = useState('');
  const [draftImageUri, setDraftImageUri] = useState('');
  const [draftAudioUri, setDraftAudioUri] = useState('');
  const [draftSaving, setDraftSaving] = useState(false);
  const [playingButtonId, setPlayingButtonId] = useState('');
  const [activePlayer, setActivePlayer] = useState(null);
  const [editingButton, setEditingButton] = useState(null);
  const [activeManageButtonId, setActiveManageButtonId] = useState('');

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const storageKey = getBoardStorageKey(auth.currentUser?.uid);

  useEffect(() => {
    const configureAudio = async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          interruptionMode: 'mixWithOthers',
        });
      } catch (error) {
        console.error('Greška pri konfiguraciji audio moda:', error);
      }
    };

    configureAudio();
  }, []);

  useEffect(() => {
    return () => {
      if (activePlayer) {
        try {
          activePlayer.pause();
          activePlayer.remove();
        } catch (_error) {
          // noop
        }
      }
    };
  }, [activePlayer]);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const storedButtons = await loadBoardButtons(storageKey);
        setButtons(storedButtons);
      } catch (error) {
        console.error('Greška pri učitavanju gumba:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [storageKey]);

  const persistButtons = async (nextButtons) => {
    setButtons(nextButtons);
    await saveBoardButtons(storageKey, nextButtons);
  };

  const openComposer = () => {
    setButtonLabel('');
    setDraftImageUri('');
    setDraftAudioUri('');
    setEditingButton(null);
    setComposerVisible(true);
  };

  const openEditComposer = (button) => {
    setButtonLabel(button.label);
    setDraftImageUri('');
    setDraftAudioUri('');
    setEditingButton(button);
    setComposerVisible(true);
  };

  const toggleManageForButton = (buttonId) => {
    Vibration.vibrate(20);
    setActiveManageButtonId((prev) => (prev === buttonId ? '' : buttonId));
  };

  const resetComposer = async (shouldDeleteDraftAssets = true) => {
    if (shouldDeleteDraftAssets) {
      await deleteStoredAsset(draftImageUri);
      await deleteStoredAsset(draftAudioUri);
    }

    setComposerVisible(false);
    setButtonLabel('');
    setDraftImageUri('');
    setDraftAudioUri('');
    setEditingButton(null);
    setDraftSaving(false);
  };

  const getComposerImageUri = () => draftImageUri || editingButton?.imageUri || '';
  const getComposerAudioUri = () => draftAudioUri || editingButton?.audioUri || '';

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Dozvola potrebna', 'Treba dozvola za pristup slikama.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const localImageUri = await copyAssetToDeviceStorage(
        result.assets[0].uri,
        'button-image',
        'jpg'
      );

      if (draftImageUri) {
        await deleteStoredAsset(draftImageUri);
      }

      setDraftImageUri(localImageUri);
    } catch (error) {
      console.error('Greška pri odabiru slike:', error);
      Alert.alert('Greška', 'Nije moguće odabrati sliku.');
    }
  };

  const startRecording = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Nije podržano', 'Snimanje glasa radi u Expo Go na mobitelu.');
      return;
    }

    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Dozvola potrebna', 'Treba dozvola za mikrofon.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      console.error('Greška pri pokretanju snimanja:', error);
      Alert.alert('Greška', 'Nije moguće pokrenuti snimanje.');
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();

      const recordingUri = recorder.uri;
      if (!recordingUri) {
        throw new Error('Nedostaje URI snimke.');
      }

      const localAudioUri = await copyAssetToDeviceStorage(
        recordingUri,
        'button-audio',
        'm4a'
      );

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
      });

      if (draftAudioUri) {
        await deleteStoredAsset(draftAudioUri);
      }

      setDraftAudioUri(localAudioUri);
    } catch (error) {
      console.error('Greška pri spremanju snimke:', error);
      Alert.alert('Greška', 'Nije moguće spremiti snimku.');
    }
  };

  const toggleRecording = async () => {
    if (recorderState.isRecording) {
      await stopRecording();
      return;
    }

    await startRecording();
  };

  const handleSaveButton = async () => {
    const trimmedLabel = buttonLabel.trim();
    const nextImageUri = getComposerImageUri();
    const nextAudioUri = getComposerAudioUri();

    if (!trimmedLabel) {
      Alert.alert('Greška', 'Unesite naziv gumba.');
      return;
    }

    if (!nextImageUri) {
      Alert.alert('Greška', 'Odaberite sliku za gumb.');
      return;
    }

    if (!nextAudioUri) {
      Alert.alert('Greška', 'Snimite glas za gumb.');
      return;
    }

    setDraftSaving(true);
    try {
      const originalButton = editingButton
        ? buttons.find((item) => item.id === editingButton.id)
        : null;

      const nextButtons = editingButton
        ? buttons.map((item) =>
            item.id === editingButton.id
              ? {
                  ...item,
                  label: trimmedLabel,
                  imageUri: nextImageUri,
                  audioUri: nextAudioUri,
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        : [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              label: trimmedLabel,
              imageUri: nextImageUri,
              audioUri: nextAudioUri,
              createdAt: new Date().toISOString(),
            },
            ...buttons,
          ];

      await persistButtons(nextButtons);

      if (editingButton && originalButton) {
        if (draftImageUri && originalButton.imageUri !== nextImageUri) {
          await deleteStoredAsset(originalButton.imageUri);
        }

        if (draftAudioUri && originalButton.audioUri !== nextAudioUri) {
          await deleteStoredAsset(originalButton.audioUri);
        }
      }

      await resetComposer(false);
    } catch (error) {
      console.error('Greška pri spremanju gumba:', error);
      Alert.alert('Greška', 'Nije moguće spremiti gumb.');
    } finally {
      setDraftSaving(false);
    }
  };

  const removeButton = async (buttonId) => {
    const targetButton = buttons.find((item) => item.id === buttonId);
    if (!targetButton) {
      return;
    }

    try {
      await deleteStoredAsset(targetButton.imageUri);
      await deleteStoredAsset(targetButton.audioUri);
      await persistButtons(buttons.filter((item) => item.id !== buttonId));
      setActiveManageButtonId((prev) => (prev === buttonId ? '' : prev));
    } catch (error) {
      console.error('Greška pri brisanju gumba:', error);
      Alert.alert('Greška', 'Nije moguće obrisati gumb.');
    }
  };

  const playButtonAudio = async (button) => {
    if (!button.audioUri) {
      Alert.alert('Nema zvuka', 'Ovaj gumb još nema snimljeni glas.');
      return;
    }

    try {
      setPlayingButtonId(button.id);

      if (activePlayer) {
        try {
          activePlayer.pause();
          activePlayer.remove();
        } catch (_error) {
          // noop
        }
      }

      let player;
      try {
        player = createAudioPlayer(button.audioUri);
      } catch (_sourceError) {
        player = createAudioPlayer({ uri: button.audioUri });
      }

      setActivePlayer(player);
      player.play();

      setTimeout(() => {
        setPlayingButtonId((prev) => (prev === button.id ? '' : prev));
      }, 2500);
    } catch (error) {
      console.error('Greška pri reprodukciji zvuka:', error);
      setPlayingButtonId('');
      Alert.alert('Greška', 'Nije moguće reproducirati zvuk.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error('Greška pri odjavi:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Lokalno na uređaju</Text>
          </View>
          <Text style={styles.email}>{auth.currentUser?.email}</Text>

          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={openComposer}>
              <Text style={styles.primaryButtonText}>Dodaj gumb</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
              <Text style={styles.secondaryButtonText}>Odjava</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Moji gumbi</Text>
          <Text style={styles.sectionCount}>{buttons.length} spremljeno</Text>
        </View>

        {buttons.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nema spremljenih gumba</Text>
            <Text style={styles.emptyText}>
              Napravi prvi gumb i odaberi sliku. Sve ostaje na ovom uređaju.
            </Text>
          </View>
        ) : (
          <FlatList
            data={buttons}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.card,
                  activeManageButtonId === item.id && styles.cardManageActive,
                ]}
                activeOpacity={0.9}
                onPress={() => {
                  if (activeManageButtonId === item.id) {
                    setActiveManageButtonId('');
                    return;
                  }
                  playButtonAudio(item);
                }}
                onLongPress={() => toggleManageForButton(item.id)}
                delayLongPress={700}
              >
                <Image source={{ uri: item.imageUri }} style={styles.cardImage} />
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.label}
                </Text>
                {activeManageButtonId === item.id ? (
                  <Text style={styles.cardHintText}>Uredivanje aktivno</Text>
                ) : null}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={[styles.cardActionButton, styles.playActionButton]}
                    onPress={() => playButtonAudio(item)}
                    accessibilityLabel="Pusti glas"
                  >
                    <Text style={styles.cardActionIcon}>
                      {playingButtonId === item.id ? '■' : '▶'}
                    </Text>
                  </TouchableOpacity>
                  {activeManageButtonId === item.id ? (
                    <>
                      <TouchableOpacity
                        style={[styles.cardActionButton, styles.editActionButton]}
                        onPress={() => {
                          setActiveManageButtonId('');
                          openEditComposer(item);
                        }}
                        accessibilityLabel="Uredi gumb"
                      >
                        <Text style={styles.cardActionIcon}>✎</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.cardActionButton, styles.deleteActionButton]}
                        onPress={() => removeButton(item.id)}
                        accessibilityLabel="Obriši gumb"
                      >
                        <Text style={styles.cardActionIcon}>×</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </ScrollView>

      <Modal
        visible={composerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => resetComposer()}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editingButton ? 'Uredi gumb' : 'Novi gumb'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {editingButton
                ? 'Ažuriraj naziv, sliku ili glas za odabrani gumb.'
                : 'Slika i glas će se spremiti lokalno na uređaj.'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Naziv gumba"
              value={buttonLabel}
              onChangeText={setButtonLabel}
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity style={styles.actionRow} onPress={handlePickImage}>
              <Text style={styles.actionRowTitle}>Odaberi sliku</Text>
              <Text style={styles.actionRowText}>
                {draftImageUri
                  ? 'Nova slika je dodana'
                  : editingButton?.imageUri
                    ? 'Trenutna slika je spremljena'
                    : 'Galerija / fotografije'}
              </Text>
            </TouchableOpacity>

            {getComposerImageUri() ? (
              <Image source={{ uri: getComposerImageUri() }} style={styles.previewImage} />
            ) : null}

            <View style={styles.actionRow}>
              <TouchableOpacity onPress={toggleRecording}>
                <Text style={styles.actionRowTitle}>
                  {recorderState.isRecording ? 'Zaustavi snimanje' : 'Snimi glas'}
                </Text>
                <Text style={styles.actionRowText}>
                  {draftAudioUri
                    ? 'Novi glas je snimljen'
                    : editingButton?.audioUri
                      ? 'Trenutni glas je spremljen'
                      : 'Dodaj glas za ovaj gumb'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.statusText}>
              {recorderState.isRecording
                ? 'Snimanje je u tijeku...'
                : getComposerAudioUri()
                  ? 'Glas je spreman.'
                  : 'Snimite glas, pa spremite gumb.'}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => resetComposer()}
                disabled={draftSaving}
              >
                <Text style={styles.modalSecondaryButtonText}>Odustani</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalPrimaryButton,
                  draftSaving && styles.modalPrimaryButtonDisabled,
                ]}
                onPress={handleSaveButton}
                disabled={draftSaving}
              >
                <Text style={styles.modalPrimaryButtonText}>
                  {draftSaving ? 'Spremam...' : 'Spremi gumb'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08111f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#08111f',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  hero: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    marginBottom: 12,
  },
  email: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 6,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1f2937',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  heroBadgeText: {
    color: '#fdba74',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#f97316',
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff7ed',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    color: '#94a3b8',
    fontSize: 13,
  },
  emptyState: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#94a3b8',
    lineHeight: 22,
    fontSize: 14,
  },
  gridRow: {
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    marginBottom: 12,
  },
  cardManageActive: {
    borderColor: '#60a5fa',
    shadowColor: '#60a5fa',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    marginBottom: 10,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  cardHintText: {
    marginTop: 6,
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  cardActionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playActionButton: {
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
  },
  editActionButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
  },
  deleteActionButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
  },
  cardActionIcon: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 18,
  },
  statusText: {
    color: '#cbd5e1',
    marginTop: 14,
    lineHeight: 20,
    minHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 17, 31, 0.72)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#334155',
    marginBottom: 18,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#94a3b8',
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#111827',
    color: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    fontSize: 16,
  },
  actionRow: {
    marginTop: 14,
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  actionRowTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  actionRowText: {
    color: '#94a3b8',
    marginTop: 6,
    fontSize: 13,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    marginTop: 12,
    backgroundColor: '#1e293b',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
  },
  modalPrimaryButton: {
    flex: 1,
    backgroundColor: '#f97316',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalPrimaryButtonDisabled: {
    opacity: 0.65,
  },
  modalPrimaryButtonText: {
    color: '#fff7ed',
    fontSize: 15,
    fontWeight: '700',
  },
});
