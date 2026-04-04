# mar-e

React Native aplikacija razvijena uz Expo, sa Firebase bazom podataka.

## 🚀 Tehnologije

- **React Native** + **Expo** (SDK 55) — razvoj za Android i iOS
- **Firebase Authentication** — prijava i registracija korisnika
- **Cloud Firestore** — baza podataka
- **Firebase Storage** — pohrana fajlova/slika
- **React Navigation** — navigacija između ekrana
- **EAS Build** — izgradnja i objavljivanje na Google Play i App Store

---

## 📋 Preduvjeti

Instaliraj sljedeće prije početka:

- [Node.js](https://nodejs.org/) (v18+)
- [Expo Go](https://expo.dev/client) app na telefonu (za testiranje)
- [EAS CLI](https://docs.expo.dev/eas/) za izgradnju: `npm install -g eas-cli`

---

## ⚙️ Postavljanje Firebase projekta

1. Idi na [Firebase Console](https://console.firebase.google.com/)
2. Klikni **"Dodaj projekat"** i slijedi korake
3. Uključi sljedeće servise:
   - **Authentication** → Email/Password
   - **Firestore Database** → Kreiraj bazu (počni u test modu)
   - **Storage** (po potrebi)
4. Klikni na zupčanik ⚙️ → **Postavke projekta**
5. Pod sekcijom **"Vaše aplikacije"** klikni na **Web** ikonu (`</>`)
6. Kopiraj vrijednosti iz `firebaseConfig` objekta

### Postavljanje .env fajla (lokalni razvoj)

```bash
# Kopiraj šablon
cp .env.example .env
```

Otvori `.env` i zamijeni placeholder vrijednosti sa stvarnim ključevima iz Firebase Console:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=moj-projekat.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=moj-projekat
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=moj-projekat.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

> ⚠️ `.env` je u `.gitignore` — **nikad neće biti commitovan**. Dijeli ključeve sa saradnicima putem sigurnog kanala (npr. password manager).

### Postavljanje za EAS Build (Google Play / App Store)

Za cloud buildove (EAS), isti ključevi se postavljaju u Expo dashboardu:

1. Idi na [expo.dev](https://expo.dev) → tvoj projekat
2. **Settings** → **Environment variables**
3. Dodaj sve `EXPO_PUBLIC_FIREBASE_*` varijable

### Android (google-services.json)

1. U Firebase Console → Postavke projekta → dodaj **Android aplikaciju**
2. Unesi `package name` koji odgovara onom u `app.json` (`android.package`)
3. Preuzmi `google-services.json`
4. Postavi fajl u **root direktorij projekta**

### iOS (GoogleService-Info.plist)

1. U Firebase Console → Postavke projekta → dodaj **iOS aplikaciju**
2. Unesi `bundle ID` koji odgovara onom u `app.json` (`ios.bundleIdentifier`)
3. Preuzmi `GoogleService-Info.plist`
4. Postavi fajl u **root direktorij projekta**

---

## 🛠️ Pokretanje projekta

### Instalacija zavisnosti

```bash
npm install
```

### Pokretanje u Expo Go (razvoj)

```bash
# Pokreni Expo razvojni server
npm start

# Skeniraj QR kod Expo Go aplikacijom na telefonu
# ili odaberi platformu:
npm run android   # Android emulator ili uređaj
npm run ios       # iOS simulator (samo macOS)
```

### Pokretanje na Android emulatoru

1. Instaliraj [Android Studio](https://developer.android.com/studio)
2. Kreiraj virtualni uređaj (AVD)
3. Pokreni emulator pa:

```bash
npm run android
```

---

## 📦 Izgradnja i objavljivanje

Ovaj projekat koristi **EAS Build** za generisanje APK/AAB fajlova.

### Postavljanje EAS-a (prvi put)

```bash
# Prijavi se na Expo račun
npx eas-cli login

# Poveži projekat sa Expo računom
npx eas-cli init

# Zamijeni YOUR_EAS_PROJECT_ID u app.json sa dobijenim ID-om
```

### Izgradnja za Android

```bash
# Preview APK (za testiranje, dijeli direktno)
npm run build:android -- --profile preview

# Produkcija AAB (za Google Play)
npm run build:android -- --profile production
```

### Izgradnja za iOS

```bash
# Potreban je macOS i Apple Developer račun
npm run build:ios -- --profile production
```

### Objavljivanje na Google Play

1. Kreiraj aplikaciju u [Google Play Console](https://play.google.com/console)
2. Preuzmi `google-service-account.json` (Service Account sa API pristupom)
3. Postavi putanju u `eas.json` → `submit.production.android.serviceAccountKeyPath`
4. Pokreni:

```bash
npm run submit:android
```

### Objavljivanje na App Store

1. Potreban je [Apple Developer Program](https://developer.apple.com/programs/) račun ($99/god)
2. Popuni `appleId`, `ascAppId` i `appleTeamId` u `eas.json`
3. Pokreni:

```bash
npm run submit:ios
```

---

## 📁 Struktura projekta

```
mar-e/
├── assets/                  # Ikone i slike aplikacije
├── src/
│   ├── config/
│   │   └── firebase.js      # Firebase init — čita iz EXPO_PUBLIC_* env varijabli
│   ├── navigation/
│   │   └── AppNavigator.js  # Definicija navigacije
│   └── screens/
│       ├── LoginScreen.js   # Ekran za prijavu
│       ├── RegisterScreen.js# Ekran za registraciju
│       └── HomeScreen.js    # Početni ekran
├── App.js                   # Ulazna točka aplikacije
├── .env.example             # Šablon env varijabli ← kopiraj u .env i popuni
├── app.json                 # Expo konfiguracija
├── eas.json                 # EAS Build konfiguracija
├── babel.config.js          # Babel konfiguracija
└── package.json             # Zavisnosti projekta
```

---

## 🔒 Sigurnost

- **Nikad ne commituj** `.env`, `google-services.json` ni `GoogleService-Info.plist` — svi su u `.gitignore`
- Firebase API ključevi se čuvaju u `.env` lokalno, a na EAS buildu kao environment varijable u Expo dashboardu
- `.env.example` (bez stvarnih ključeva) **jeste** commitovan kao šablon za saradnike

---

## 📚 Korisni linkovi

- [Expo dokumentacija](https://docs.expo.dev/)
- [Firebase dokumentacija](https://firebase.google.com/docs)
- [React Navigation dokumentacija](https://reactnavigation.org/docs/getting-started)
- [EAS Build dokumentacija](https://docs.expo.dev/build/introduction/)
- [EAS Submit dokumentacija](https://docs.expo.dev/submit/introduction/)

