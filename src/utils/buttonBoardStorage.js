import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const ASSET_DIRECTORY_NAME = 'mar-e-assets';

function getStorageDirectory() {
  if (!FileSystem.documentDirectory) {
    return null;
  }

  return `${FileSystem.documentDirectory}${ASSET_DIRECTORY_NAME}/`;
}

async function ensureStorageDirectory() {
  const directory = getStorageDirectory();

  if (!directory) {
    return null;
  }

  const info = await FileSystem.getInfoAsync(directory);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  }

  return directory;
}

function getFileExtension(uri, fallback = 'bin') {
  const cleanUri = uri.split('?')[0].split('#')[0];
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1] || fallback;
}

function buildStoragePath(prefix, sourceUri, fallbackExtension) {
  const extension = getFileExtension(sourceUri, fallbackExtension);
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${uniqueId}.${extension}`;
}

export function getBoardStorageKey(userId) {
  return `mar-e.sound-buttons.${userId || 'guest'}`;
}

export async function loadBoardButtons(storageKey) {
  const rawValue = await AsyncStorage.getItem(storageKey);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Neispravan lokalni zapis gumba:', error);
    return [];
  }
}

export async function saveBoardButtons(storageKey, buttons) {
  await AsyncStorage.setItem(storageKey, JSON.stringify(buttons));
}

export async function copyAssetToDeviceStorage(sourceUri, prefix, fallbackExtension) {
  if (!sourceUri) {
    return '';
  }

  const directory = await ensureStorageDirectory();
  if (!directory) {
    return sourceUri;
  }

  const fileName = buildStoragePath(prefix, sourceUri, fallbackExtension);
  const targetUri = `${directory}${fileName}`;
  await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
  return targetUri;
}

export async function deleteStoredAsset(assetUri) {
  const directory = getStorageDirectory();

  if (!directory || !assetUri || !assetUri.startsWith(directory)) {
    return;
  }

  await FileSystem.deleteAsync(assetUri, { idempotent: true });
}