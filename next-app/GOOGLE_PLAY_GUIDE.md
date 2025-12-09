# 🚀 How to Publish 'Bascavarat' to Google Play Store

## 1. Prerequisites
- **Google Play Developer Account**: You need to pay a one-time $25 fee. [Sign up here](https://play.google.com/console/signup).
- **Java Development Kit (JDK)**: Installed on your computer (which you likely have if you built the app).

## 2. Generate a Signed App Bundle (AAB)
Google Play requires an **Android App Bundle (.aab)**, not an APK.

### Step A: Generate a Keystore
Run this command in your terminal (keep the file safe!):
```bash
keytool -genkey -v -keystore bascavarat-release.keystore -alias bascavarat -keyalg RSA -keysize 2048 -validity 10000
```
*   Set a password and remember it.
*   Fill in the details (Name, Org, etc.).

### Step B: Build the Signed Bundle
1.  Open `android` folder in Android Studio (or use terminal).
2.  If using terminal:
    ```bash
    cd android
    ./gradlew bundleRelease
    ```
    *Note: By default, this creates an unsigned bundle. To sign it automatically, you need to configure `build.gradle` or sign it manually.*

**Easiest Way (Android Studio):**
1.  Open `android` folder in Android Studio.
2.  Go to **Build** > **Generate Signed Bundle / APK**.
3.  Select **Android App Bundle**.
4.  Select the keystore you created in Step A.
5.  Enter passwords.
6.  Select **Release** variant.
7.  Click **Finish**.
8.  The `.aab` file will be generated in `android/app/release/`.

## 3. Upload to Google Play Console

1.  **Create App:**
    *   Go to [Play Console](https://play.google.com/console).
    *   Click **Create App**.
    *   Name: `Bascavarat`.
    *   Language: English (or Arabic).
    *   App or Game: **App**.
    *   Free or Paid: **Free**.

2.  **Set up Store Listing:**
    *   **Short Description:** "Premium Phone Cases in Iraq."
    *   **Full Description:** Describe your store, delivery, and products.
    *   **Graphics:**
        *   **App Icon:** 512x512 PNG (Use `assets/icon.png`).
        *   **Feature Graphic:** 1024x500 PNG (Create a banner).
        *   **Screenshots:** Upload at least 2 screenshots for Phone.

3.  **Data Safety & Privacy:**
    *   **Privacy Policy URL:** You need a hosted privacy policy. You can create a page `/privacy` on your site.
    *   **Data Safety:**
        *   Does the app collect data? **Yes** (Name, Address, Phone for shipping).
        *   Is it encrypted? **Yes** (HTTPS).
        *   Can users delete data? **Yes** (Contact support).

4.  **Upload Bundle:**
    *   Go to **Production** (or Internal Testing first).
    *   Click **Create new release**.
    *   Upload the `.aab` file you generated.
    *   Review and Rollout.

## 4. Review Process
Google will review your app (usually takes 1-3 days). Once approved, it will be live on the Play Store!

---

### 💡 Tips
- **Update Version:** Every time you upload a new version, increment `versionCode` and `versionName` in `android/app/build.gradle`.
- **Testing:** Use "Internal Testing" track to test on your own device before public release.
