---
description: Build and install on iPad using Mac with free Apple ID
---

# Free Provisioning: Mac → iPad

Build and install directly to iPad using a free Apple ID (no paid developer account).

## Prerequisites

- macOS computer (physical, cloud, or borrowed)
- Xcode 15+ installed
- iPad connected via USB
- Free Apple ID

## Steps

1. **Clone project to Mac:**

```bash
git clone <your-repo-url>
cd newsprint-sudoku
npm install
```

2. **Generate native iOS project:**

```bash
npx expo prebuild --platform ios
```

3. **Open in Xcode:**

```bash
open ios/newsprintsudoku.xcworkspace
```

4. **Configure Signing:**
   - Click the project in left sidebar
   - Select "Signing & Capabilities" tab
   - Check "Automatically manage signing"
   - Team: Select your Personal Team (Apple ID)
   - If prompted about bundle ID, let it fix automatically

5. **Select your iPad:**
   - Connect iPad via USB
   - Trust the computer on iPad when prompted
   - Select your iPad from device dropdown (top left)

6. **Build & Run:**
   - Click ▶️ Play button (or Cmd+R)
   - First time: Go to iPad Settings → General → Device Management → Trust your developer profile
   - App installs and runs!

## Limitations

- App expires after **7 days** (rebuild to refresh)
- Maximum **3 apps** per device with free account
- Cannot use push notifications or certain APIs

## Testing Apple Pencil

Once app is running on iPad:

1. Navigate to "Test Handwriting" screen
2. Use Apple Pencil to draw digits
3. Test OCR recognition

## Tips

- Keep the Mac available - you'll need it every 7 days
- Cloud Mac services: MacinCloud, MacStadium, AWS EC2 Mac
