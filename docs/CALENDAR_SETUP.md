# Google Calendar Setup Guide

This guide walks you through setting up Google Calendar integration for Remembro.

## 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it `remembro-calendar` → **Create**

## 2. Enable Calendar API

1. Go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click **Enable**

## 3. Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Name: `remembro-bot`
4. Click **Create and Continue** → **Done**

## 4. Generate Key File

1. Click on the service account email
2. Go to **Keys** tab → **Add Key** → **Create new key**
3. Select **JSON** → **Create**
4. Download the file

## 5. Configure Remembro

1. Move the JSON file to your project:
   ```bash
   mkdir -p credentials
   mv ~/Downloads/remembro-bot-*.json credentials/google-service-account.json
   ```

2. Add to your `.env`:
   ```
   GOOGLE_CALENDAR_KEY_FILE=./credentials/google-service-account.json
   GOOGLE_CALENDAR_ID=primary
   ```

## 6. Share Calendar with Bot

1. Open [Google Calendar](https://calendar.google.com/)
2. Click ⚙️ Settings → **Settings for my calendars**
3. Select your calendar → **Share with specific people**
4. Add the service account email (from the JSON file `client_email`)
5. Set permission to **See all event details**

## 7. Restart Bot

```bash
pm2 restart remembro-bot
```

## Usage

```
/today      - Today's events
/calendar   - Next 7 days
/calendar 14 - Next 14 days
```

## Troubleshooting

- **"Google Calendar not configured"** - Check GOOGLE_CALENDAR_KEY_FILE path
- **"Error: unauthorized_client"** - Share calendar with service account email
- **No events showing** - Verify calendar ID (use `primary` for main calendar)
