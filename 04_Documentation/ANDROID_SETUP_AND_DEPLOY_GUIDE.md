# Android-Only Setup, Supabase Connection & Cloud APK Build Guide

This guide is designed so every step can be completed directly from your Android phone browser and [Acode](https://play.google.com/store/apps/details?id=com.foxdebug.acodefree&hl=en_IN)—no PC or Android Studio required.

## Step 1: Test the Modular App on Your Phone
1. Extract `HIT-Connect.zip` using your Android File Manager into `Documents/HIT-Connect/`.
2. Open `02_Development/index.html` in [Acode](https://acode.app/about) and tap the Play/Preview button (or open it in Chrome).
3. Verify that Demo Mode login works for Student (`720826104001`), Faculty (`faculty.demo@example.com`), and Administrator (`admin.demo@example.com`).

## Step 2: Set Up Your Supabase Database (Browser)
1. Open [Supabase](https://supabase.com/) in Chrome on your phone and create a free project.
2. In your Supabase project, open **SQL Editor** and run the three files from `03_Database/` in exact order:
   1. `01_schema.sql` — Creates all 12 relational tables and indexes.
   2. `02_rls_policies.sql` — Enables Row Level Security for Student, Faculty, and Administrator roles.
   3. `03_seed_demo_data.sql` — Inserts starter demonstration records.
3. Open **Project Settings → API** and copy:
   - **Project URL** (`https://<your-ref>.supabase.co`)
   - **anon / public key** (Never copy or paste the `service_role` secret key into frontend code.)
4. Open `02_Development/js/config.js` in Acode and paste those two values into `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

## Step 3: Build Your Android `.apk` in the Cloud with GitHub Actions
1. Create a free account on [GitHub](https://github.com/) and create a new repository named `HIT-Connect`.
2. Upload the contents of your `HIT-Connect/` folder (including the hidden `.github/workflows/android-build.yml` file) to the `main` branch. You can use [GitHub Codespaces](https://github.com/features/codespaces) in Chrome if your mobile browser hides dotfiles during upload.
3. Open the **Actions** tab in your GitHub repository and select **Build HIT Connect Android APK** → **Run workflow**.
4. Wait ~3–5 minutes for the cloud runner to finish `npm install`, [Capacitor](https://capacitorjs.com/docs/android) sync, and Gradle `assembleDebug`.
5. Tap the completed run, scroll to **Artifacts**, download `HIT-Connect-debug-apk`, unzip it, save the `.apk` in `05_Android_Builds/`, and tap to install on your Android phone (enable "Install unknown apps" for your browser/file manager if prompted).
