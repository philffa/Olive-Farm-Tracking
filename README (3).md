# 🫒 Olive Farm Tracking
## Setup Guide — Plain English Version

This guide will walk you through getting the app running online, step by step.
No technical experience required. Each step says exactly what to click and type.

Estimated total time: **45–60 minutes**, mostly waiting for things to load.

---

## What the app does

Once set up, you'll have a private website you can open on any device — phone, tablet, or computer — that gives you five sections:

| Tab | What it's for |
|---|---|
| **📅 Calendar** | Plan and track all farm tasks. Weekly and monthly views. Weather forecast overlaid on every day. Recurring tasks, legal deadline reminders, and a "didn't do this today" button that logs a reason and reschedules. |
| **📋 Records** | Logbook for every enterprise — olive grove, eggs, honey, hemp, aquaponics, waterfowl, goats, BSFL, rhizomes, high-value crops, macadamia grafting, water quality, chemical register, and more. |
| **💰 Finance** | Photograph or upload a receipt or invoice — the app reads it automatically and pulls out the supplier name, ABN, amount, GST, and suggests the right ATO tax category. Saves everything for your accountant. |
| **🐐 Assets** | Register of every animal, hive, paddock, plant, and piece of equipment on the property. Tasks on the calendar can be linked directly to a specific asset (e.g. "Hive 3", "Goat 04"). |
| **🌱 Crop Plan** | Your full crop catalogue — 55 crops rated as Active, Trial, Viable, Watch list, Too hard, or Illegal. Filterable and searchable. Click any crop to see its zone on the property, setup cost, time to income, and weather notes. One button adds it directly to your Assets. |

---

## What you'll be setting up

| Service | What it does | Cost |
|---|---|---|
| **GitHub** | Stores your app's code online | Free |
| **Supabase** | Your private database — all farm data lives here | Free |
| **Vercel** | Hosts the app online so you can open it anywhere | Free |
| **Anthropic** | The AI that reads your receipts and invoices | ~$5–20/month depending on use |
| **Cloudinary** | Stores photos you take or upload | Free |

---

## PART 1 — Put your code on GitHub

GitHub is like a USB drive on the internet for your code. You need it so Vercel can read your app.

### Step 1.1 — Create a GitHub account
1. Go to **github.com**
2. Click **Sign up**
3. Use your email and create a password
4. Verify your email address

### Step 1.2 — Create a new repository (this is just a folder for your code)
1. Once logged in, click the **+** button in the top right
2. Click **New repository**
3. Name it: `olive-farm-tracking`
4. Leave everything else as default
5. Click **Create repository**

### Step 1.3 — Upload your files
1. On the repository page, click **uploading an existing file**
2. Drag the entire `olive-farm-tracking-v2` folder onto the page
   (or click "choose your files" and select all files inside the folder)
3. Scroll down and click **Commit changes**

✅ Your code is now on GitHub.

---

## PART 2 — Set up your database (Supabase)

Supabase is where all your farm data is stored. It's private — only you can access it.

### Step 2.1 — Create a Supabase account
1. Go to **supabase.com**
2. Click **Start your project**
3. Sign up with GitHub (easiest — uses the account you just made)

### Step 2.2 — Create a new project
1. Click **New project**
2. Name it: `olive-farm-tracking`
3. **Create a database password** — write this down somewhere safe (you won't need it often but don't lose it)
4. Choose region: **Southeast Asia (Singapore)** — this is the closest available region to Queensland
5. Click **Create new project**
6. Wait about 2 minutes for it to finish setting up

### Step 2.3 — Run the database schema
This creates all the tables your app needs to store data. You only need to do this once.

1. In your Supabase project, click **SQL Editor** in the left menu
2. Click **New query**
3. Open the file called `supabase_schema.sql` from your olive-farm-tracking folder on your computer
4. Select all the text in that file (Ctrl+A or Cmd+A) and copy it
5. Paste it into the SQL Editor box in Supabase
6. Click the green **Run** button
7. You should see "Success. No rows returned" at the bottom — that means it worked ✅

> **Note:** The schema includes a `crop_plan_status` table. This is where the app saves any notes or planting dates you add to crops in the Crop Plan tab. It's created automatically when you run the schema — nothing extra to do.

### Step 2.4 — Enable Google login
This lets you sign into the app with your Google account.

1. In Supabase, click **Authentication** in the left menu
2. Click **Providers**
3. Find **Google** in the list and click it
4. Toggle it **on** — you'll see two fields appear: Client ID and Client Secret
5. Leave this page open — you'll come back to it in a moment

To get the Google Client ID and Secret:
1. Go to **console.cloud.google.com** and sign in with your Google account
2. Click **Create Project**, name it "Olive Farm Tracking", click Create
3. Click **APIs & Services** in the left menu, then **OAuth consent screen**
4. Choose **External**, click Create
5. Fill in App name: "Olive Farm Tracking" and your email address for the support field
6. Click **Save and Continue** through the remaining screens — you can skip any optional fields
7. Go to **Credentials** in the left menu → **Create Credentials** → **OAuth client ID**
8. Under Application type, choose **Web application**
9. Under Authorised redirect URIs, add:
   `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
   (Replace YOUR_PROJECT_ID with the string of letters in your Supabase project's URL — visible in your browser address bar when you're in the project)
10. Click Create — a popup shows your **Client ID** and **Client Secret**
11. Copy each one back into the Supabase Google provider fields and click Save

### Step 2.5 — Get your Supabase keys (you'll need these in Part 5)
1. In Supabase, click **Project Settings** (the gear icon at the very bottom of the left menu)
2. Click **API**
3. Copy and save these two things in a notepad or document:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — a very long string starting with `eyJ...`

---

## PART 3 — Set up photo storage (Cloudinary)

Cloudinary stores photos you take of receipts, animals, crops, or anything else on the farm.

### Step 3.1 — Create an account
1. Go to **cloudinary.com**
2. Click **Sign up for free**
3. Sign up with your email

### Step 3.2 — Find your Cloud Name
1. Once logged in you'll see your Dashboard
2. Your **Cloud Name** is shown near the top — it looks something like `dxyz1234ab`
3. Copy it and save it somewhere

### Step 3.3 — Create an upload preset
This tells Cloudinary to accept photo uploads from your app.

1. Click the **Settings** gear icon in the top right
2. Click **Upload** in the settings menu
3. Scroll down to the section called **Upload presets**
4. Click **Add upload preset**
5. Set **Signing Mode** to **Unsigned**
6. In the Preset name field, type exactly: `olive_farm_photos`
7. Click **Save**

---

## PART 4 — Get your Anthropic API key (for receipt scanning)

This is the AI that automatically reads your receipts and invoices. Each scan costs less than 2 cents.

1. Go to **console.anthropic.com**
2. Click **Sign up** and create an account with your email
3. Once logged in, click **API Keys** in the left menu
4. Click **Create Key**
5. Give it a name like "Olive Farm"
6. Copy the key that appears — it starts with `sk-ant-...`
7. **Save it somewhere safe right now** — Anthropic only shows it to you once

To add credit so you can use it:
1. Click **Billing** in the left menu
2. Click **Add payment method** and enter your credit card
3. Add a small amount — $20 AUD will last a very long time at less than 2 cents per scan

---

## PART 5 — Deploy the app (Vercel)

Vercel puts your app on the internet so you can open it from any device.

### Step 5.1 — Create a Vercel account
1. Go to **vercel.com**
2. Click **Sign up**
3. Click **Continue with GitHub** — this links Vercel to your GitHub account automatically

### Step 5.2 — Import your project
1. Once logged in, click **Add New Project**
2. You'll see a list of your GitHub repositories — find `olive-farm-tracking` and click **Import**
3. Leave all the settings as they are
4. **Do not click Deploy yet** — you need to add your secret keys first

### Step 5.3 — Add your environment variables
This is how you give the app your private keys without them being visible to anyone else. Think of it like putting your passwords in a locked safe that only the app can open.

Click **Environment Variables** and add each of the following, one at a time. For each one: type the Name in the left box, paste your Value in the right box, then click **Add**.

| Name | Value |
|---|---|
| `REACT_APP_SUPABASE_URL` | Your Supabase Project URL (from Step 2.5) |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anon public key (from Step 2.5) |
| `REACT_APP_ANTHROPIC_API_KEY` | Your Anthropic key (from Part 4) |
| `REACT_APP_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name (from Step 3.2) |
| `REACT_APP_CLOUDINARY_UPLOAD_PRESET` | `olive_farm_photos` |

You should have 5 variables total. Double-check there are no extra spaces before or after any of the values.

### Step 5.4 — Deploy
1. Click **Deploy**
2. Wait 2–3 minutes while it builds — you'll see a progress log scrolling past
3. When it finishes you'll see a green "Congratulations!" screen
4. Click **Visit** — your app is live! 🎉

Your app will be at a URL like: `olive-farm-tracking.vercel.app`

Bookmark this on your phone and computer.

---

## PART 6 — First login

1. Go to your app URL
2. Click **Sign in with Google**
3. Choose your Google account from the list
4. The app automatically creates your farm profile
5. You're in — you'll land on the Calendar

---

## PART 7 — Weather is already set up

Your valley's exact coordinates are already built into the app:
**-27.7708°, 152.2533° — Lockyer Valley / Marburg**

Weather forecasts from Open-Meteo will show on every day in the calendar using this exact location. No account or key needed — it's completely free and works straight away.

Each day shows the weather icon, maximum temperature, and a blue dot if rain is likely. Tasks you've marked as weather-sensitive will show a warning flag 🌧 on days when conditions aren't suitable for them.

---

## After setup: What to do first

Work through these in order — it takes about 15 minutes and sets the app up properly.

### 1. Browse your Crop Plan
Go to the **🌱 Crop Plan** tab. Your full 55-crop catalogue is already loaded — all the research from your trial plan document is built in.

The crops are grouped by status:
- **In plan** — olives, eggs, honey, hemp, aquaponics — your current active enterprises
- **Trial crops** — nasturtium, finger lime, vanilla, wasabi — the four phased trials
- **Viable** — 30+ crops assessed as ready to start when the time is right
- **Watch list** — crops to revisit later (mushrooms once the shed is built, moringa, bamboo, etc.)
- **Too hard** — durian, blueberries, cherries — climate or soil barriers noted
- **Illegal** — listed for reference with the relevant Queensland/Australian law cited

Click any card to expand it and see the zone on your property, setup cost, time to income, weather sensitivity, and notes. For each active or trial crop, click **+ Add to Assets** to register it.

### 2. Register your individual assets
Go to the **🐐 Assets** tab. Add your specific animals, hives, and plots one by one — for example "Hive 1", "Hive 2", "Hive 3" as separate entries rather than a single "Bees" entry. This lets you link calendar tasks to a specific asset, so you can write "check Hive 3 for varroa" rather than just "check hives".

Asset types available: Animal, Hive, Paddock, Plant, Equipment.

### 3. Add your first calendar tasks
Go to the **📅 Calendar** tab. Click any day to create a task. Suggested first tasks:

- **Daily egg collection** — recurrence: daily, category: Eggs, link to your poultry paddock asset
- **Weekly hive inspection** — recurrence: weekly, mark as weather-sensitive (dry weather), link to each hive
- **Monthly aquaponics water test** — recurrence: monthly, link to your aquaponics asset
- **Hemp DAF licence renewal** — set priority to **Legal / compliance** so you get a 14-day advance reminder

For legal and compliance deadlines always use the Legal / compliance priority — this triggers the advance reminder system.

### 4. Try the invoice scanner
Go to the **💰 Finance** tab. Take a photo of any receipt on your phone — or drag a PDF invoice onto the drop zone. The app reads it and fills in the supplier name, ABN, invoice number, amount, GST, ATO tax category, enterprise, and BAS quarter. Check the details and tap **Confirm & save**. It also creates a matching entry in your finance records automatically.

---

## How the Records tab works

The **📋 Records** tab is your farm logbook. Sections are grouped down the left side by enterprise:

**Core enterprises**
- Olive grove — tree register, harvest log, organic transition spray diary, table olive curing batch
- Eggs — production and flock log
- Honey / bees — European and native hive records
- Hemp — crop log with DAF licence number field
- Aquaponics — jade perch stock log, grow bed harvest log, water quality log (ammonia, nitrite, nitrate, pH, dissolved oxygen, temperature)

**Livestock & animals**
- Waterfowl / geese — flock log, eggs, condition
- Goats — individual animal records
- BSFL — batch log, colony health, substrate supply, product sales
- Animal health — vet visits, treatments, withholding periods
- Livestock movement — NLIS/PIC-compliant movement records

**Plants & crops**
- High-value crops — nasturtium, finger lime, vanilla, wasabi records
- Rhizomes — ginger/turmeric/galangal crop log with biosecurity certificate number field
- Fruit trees, macadamia / grafting and propagation log, vege garden, propagation nursery

**Property**
- Pasture, water & irrigation, chemical register (APVMA-compliant spray records), machinery, infrastructure

**Sales & finance**
- Market / stall sales log, restaurant / wholesale sales log

Full template entry forms for all sections are being added in Phase 2. In the meantime, records from your existing farm_records_v4 app can be viewed and added in basic form.

---

## Keeping your app updated

When updated app files are provided to you:
1. Go to your GitHub repository at github.com
2. Click **Add file** → **Upload files**
3. Upload the new or changed files — they replace the old ones automatically
4. Vercel detects the change and rebuilds the app, usually within 2 minutes
5. Refresh your browser — the update is live

---

## If something goes wrong

**App won't load / shows a blank white screen**
→ The most common cause is a typo in one of the environment variables in Vercel
→ Go to Vercel → your project → **Settings** → **Environment Variables** and check each one carefully for extra spaces or missing characters
→ After fixing, go to **Deployments** → click the three dots next to the latest deployment → **Redeploy**

**"Could not load your farm profile" error after logging in**
→ The database schema may not have run completely
→ Go to Supabase → SQL Editor → paste the contents of `supabase_schema.sql` again and run it
→ It's safe to run more than once — it won't delete any data

**Receipt scanner says "API key not set"**
→ Check that `REACT_APP_ANTHROPIC_API_KEY` is in your Vercel environment variables
→ Make sure there are no spaces at the start or end of the key value

**Receipt scanner runs but gets details wrong**
→ Try a clearer photo — flat on a hard surface, good lighting, no shadows across the text
→ PDF invoices give better results than photos if you have the option

**Can't sign in with Google / bounces back to login screen**
→ Double-check the redirect URI in Google Console matches your Supabase URL exactly, including `https://` at the start and `/auth/v1/callback` at the end with no trailing space

**Weather isn't showing on the calendar**
→ Open-Meteo needs no account and is free — if it's not showing, the service may be briefly unavailable
→ It usually recovers within a few minutes. Try refreshing.

**Crop Plan "Add to Assets" fails**
→ Check your Supabase URL and anon key are correct in Vercel environment variables

---

## Credentials checklist

Keep this somewhere safe — don't share it with anyone. Fill it in as you complete each part.

```
GitHub
  Username: ________________________________
  Password: ________________________________  (store in your password manager)

Supabase
  Project URL: ________________________________
  Anon public key: ________________________________
  Database password: ________________________________

Google (for login)
  Client ID: ________________________________
  Client Secret: ________________________________

Cloudinary
  Cloud name: ________________________________
  Upload preset name: olive_farm_photos

Anthropic
  API key: sk-ant-________________________________
  (only shown once — save immediately)

Vercel
  App URL: ________________________________.vercel.app
```

---

## What's coming in Phase 2

- Full record entry forms for all templates (olive spray diary, aquaponics water quality log, BSFL batch log, macadamia grafting log, rhizome biosecurity log, etc.)
- "Mark done" on a calendar task → automatically opens the matching record form, pre-filled with the date and linked asset
- Google Calendar two-way sync — farm tasks appear in your Google Calendar and events you add there appear here
- Financial dashboard — income vs expenses by enterprise, BAS quarter summary, CSV export for your accountant
- Team members — add up to 5 people with different access levels, assign tasks to individuals
- Personal weather station — if you install a station on the property, one settings change connects it and replaces the forecast with live on-site readings

---

*Built for 658 Lefthand Branch Road — Lockyer Valley, QLD 4343*
*Weather powered by Open-Meteo at coordinates -27.7708°, 152.2533°*
*Version 2 — April 2026*
