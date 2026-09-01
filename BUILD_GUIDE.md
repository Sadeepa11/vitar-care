# VitaCare Apps - Safe Prebuild & Build Guide

## Current State (Both Apps)

| Item | Value |
|------|-------|
| versionCode | **3** |
| versionName | **3.0.0** |
| Driver Keystore | `android/app/driver-release.keystore` ✅ |
| Nurse Keystore | `android/app/nurse-release.keystore` ✅ |
| Signing Config | `build.gradle` ෙකහිදී (manual section) ✅ |

---

## ඇයි Prebuild ඕනෑ?

`android/` directory දෙකෙහිම **නව changes නැහැ**:

- `ACCESS_BACKGROUND_LOCATION` permission → missing
- `FOREGROUND_SERVICE` permission → missing
- `expo-task-manager` native linking → missing

---

## Safe Prebuild Procedure

### ⚠️ IMPORTANT: `--clean` **නොදාන්න**

`--clean` flag දාන ගමන් **android/ directory delete** වෙලා fresh හදනවා.  
Keystore files, signing config, custom changes **සියල්ල නැති** වෙනවා.

### ✅ Correct Command

```bash
npx expo prebuild --platform android
```

`--clean` නැතිව:
- `@generated` sections (AndroidManifest permissions, plugin changes) → **update** වෙනවා ✅
- `signingConfigs` block (keystore config) → **preserve** වෙනවා ✅
- `versionCode 3` → **preserve** වෙනවා ✅ (app.json ෙකහිදී sync කළා)
- Keystore files → **untouched** ✅

---

## Step-by-Step Commands

### Driver App Prebuild
```bash
cd D:\NurcingCenter\expo-driver-app
npx expo prebuild --platform android
```

### Nurse App Prebuild
```bash
cd D:\NurcingCenter\expo-nurse-app
npx expo prebuild --platform android
```

Prebuild ෙකහිදී prompts ආවොත්:
- **"Would you like to continue?"** → `y`
- Existing android directory modify කරන ගැන warnings → OK to proceed

---

## Prebuild Verify

Prebuild run කළාට පස්සේ check:

```bash
# Driver - new permissions check
grep -E "BACKGROUND_LOCATION|FOREGROUND_SERVICE" expo-driver-app/android/app/src/main/AndroidManifest.xml

# Nurse - new permissions check
grep -E "BACKGROUND_LOCATION|FOREGROUND_SERVICE" expo-nurse-app/android/app/src/main/AndroidManifest.xml
```

Expected:
```
android.permission.ACCESS_BACKGROUND_LOCATION
android.permission.FOREGROUND_SERVICE
android.permission.FOREGROUND_SERVICE_LOCATION
```

```bash
# Signing config still there check
grep -E "driver-release.keystore|vitacare123" expo-driver-app/android/app/build.gradle
grep -E "nurse-release.keystore|vitacare123" expo-nurse-app/android/app/build.gradle
```

```bash
# versionCode check
grep "versionCode" expo-driver-app/android/app/build.gradle
grep "versionCode" expo-nurse-app/android/app/build.gradle
# Expected: versionCode 3
```

---

## APK / AAB Build

Prebuild complete වුනාට පස්සේ:

### Release APK
```bash
# Driver
cd D:\NurcingCenter\expo-driver-app\android
./gradlew assembleRelease

# Nurse
cd D:\NurcingCenter\expo-nurse-app\android
./gradlew assembleRelease
```

**Output:**
- Driver: `expo-driver-app/android/app/build/outputs/apk/release/app-release.apk`
- Nurse: `expo-nurse-app/android/app/build/outputs/apk/release/app-release.apk`

### Release AAB (Play Store)
```bash
# Driver
cd D:\NurcingCenter\expo-driver-app\android
./gradlew bundleRelease

# Nurse
cd D:\NurcingCenter\expo-nurse-app\android
./gradlew bundleRelease
```

**Output:**
- Driver: `expo-driver-app/android/app/build/outputs/bundle/release/app-release.aab`
- Nurse: `expo-nurse-app/android/app/build/outputs/bundle/release/app-release.aab`

---

## Future Version Update කරන්නේ කෙසේද?

**app.json ෙකහිදී** change කරන්නනම් (prebuild automatically apply කරනවා):
```json
// expo-driver-app/app.json සහ expo-nurse-app/app.json
{
  "expo": {
    "version": "4.0.0",        // versionName
    "android": {
      "versionCode": 4,         // versionCode (Play Store ෙකහිදී unique ඕනෑ)
    }
  }
}
```

ඉන් පස්සේ prebuild + build.

---

## Keystore Safety Note

Keystore files project ෙකහිදී track නොකරන්නේ හොඳයි. `.gitignore` ෙකහිදී add:

```
# .gitignore
expo-driver-app/android/app/driver-release.keystore
expo-nurse-app/android/app/nurse-release.keystore
```

Keystore backup separately safe ෙකහිදී store කරන්න (ඒ file නැති වුනොත් Play Store ෙකහිදී app update **කළේ නැහැ**).
