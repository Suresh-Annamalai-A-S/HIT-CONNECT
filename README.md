# HIT Connect — Project Workspace

Academic prototype for **Hindusthan Institute of Technology, Coimbatore**.
Not officially affiliated with or connected to college servers; demonstration data is used during development.

## Folder Structure

- `01_Original/` — Untouched original single-file prototype (`HIT_Connect.html`). Never edit this file.
- `02_Development/` — Modularized HTML, CSS, and JavaScript application, plus `package.json` and `capacitor.config.json` ready for [Capacitor](https://capacitorjs.com/docs/android).
- `03_Database/` — Ready-to-run PostgreSQL schema (`01_schema.sql`), Row Level Security policies (`02_rls_policies.sql`), and demonstration seed data (`03_seed_demo_data.sql`) for [Supabase](https://supabase.com/).
- `04_Documentation/` — Stage 1 Project Audit and step-by-step Android-only setup & cloud APK build guide.
- `05_Android_Builds/` — Storage folder for downloaded `.apk` builds compiled via [GitHub Actions](https://github.com/features/actions).
- `.github/workflows/android-build.yml` — Automated cloud workflow that builds an Android Debug `.apk` without needing a PC or Android Studio.

## Quick Start on Android

1. Unzip `HIT-Connect.zip` into your phone's `Documents/` folder.
2. Open `02_Development/index.html` in [Acode](https://play.google.com/store/apps/details?id=com.foxdebug.acodefree&hl=en_IN) or Chrome to test the modular app immediately in Demo Mode.
3. Follow `04_Documentation/ANDROID_SETUP_AND_DEPLOY_GUIDE.md` to connect [Supabase](https://supabase.com/) and build your Android `.apk` using [GitHub Actions](https://github.com/features/actions).
