# Setting up Android App Links

To make your links open the app **automatically** (without asking the user to choose between Chrome and the App), you must host a verification file on your website.

## 1. Create the verification file
Create a file at `public/.well-known/assetlinks.json` with this content:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.vitemonjager.app",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

## 2. Get your Fingeprint
To get your actual fingerprint, run this command in your terminal:
`keytool -list -v -keystore android/app/debug.keystore` (Password is usually `android`)

Copy the **SHA256** line and paste it into the JSON file above.

## 3. Deploy
Once you deploy this file to Vercel/Netlify, Android will verify the link and open the app instantly!
