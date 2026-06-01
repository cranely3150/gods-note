# Firebase Sync Setup

GOD'S NOTE uses Firebase only for this app. It does not touch Supabase or any other app.

## 1. Create Firebase project

1. Open https://console.firebase.google.com/
2. Create a project named `gods-note`
3. Analytics can be off

## 2. Enable Google login

1. Open Authentication
2. Open Sign-in method
3. Enable Google
4. Add this authorized domain if it is not already there:

```text
cranely3150.github.io
```

## 3. Create Firestore

1. Open Firestore Database
2. Create database
3. Start in production mode
4. Choose a nearby region

## 4. Set Firestore rules

Paste these rules in Firestore Rules and publish them:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/backups/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 5. Add a Web app

1. Open Project settings
2. Add app
3. Choose Web
4. Confirm that the config in `app.js` matches this Firebase project

## 6. Use GOD'S NOTE

1. Open GOD'S NOTE
2. Open Settings
3. Press Google login
4. Press Sync now once

After this, records are saved to:

```text
users/{yourGoogleUid}/backups/state
```
