# 🚀 QUICK START GUIDE

Follow these steps to get Vectors running on your phone TODAY.

## Step 1: Navigate to Project (30 seconds)

Open Terminal and run:
```bash
cd ~/vectors
```

If you get "No such file or directory", the project is in your Downloads. Try:
```bash
cd ~/Downloads/vectors
```

## Step 2: Install Dependencies (2-3 minutes)

```bash
npm install
```

This downloads all the code libraries. Grab coffee while it runs.

## Step 3: Set Up Database (2 minutes)

1. Open browser: https://supabase.com/dashboard/project/eddnrkrvbbrbuzwxlgfc
2. Click "SQL Editor" in left sidebar
3. Click "New Query"
4. Copy-paste this entire block:

```sql
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to TEXT DEFAULT 'me',
  due_date TIMESTAMPTZ,
  recurring TEXT
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tasks" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can update tasks" ON tasks
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete tasks" ON tasks
  FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
```

5. Click "Run" (or press Cmd+Enter)
6. You should see "Success. No rows returned"

## Step 4: Start the App (30 seconds)

Back in Terminal:
```bash
npm start
```

You'll see a QR code appear.

## Step 5: Open on Your Phone (1 minute)

### iPhone:
1. Download "Expo Go" from App Store
2. Open Expo Go app
3. Tap "Scan QR Code"
4. Point camera at QR code in Terminal

### Android:
1. Download "Expo Go" from Play Store
2. Open Expo Go app
3. Tap "Scan QR code"
4. Point camera at QR code in Terminal

## Step 6: Create Account (1 minute)

1. App opens on your phone
2. Tap "Sign Up"
3. Enter your email and password
4. Check your email for confirmation link
5. Click the link
6. Go back to app and sign in

## Step 7: Add Your First Task! (10 seconds)

1. Type "Buy milk" in the input box
2. Tap the + button
3. ✨ Your first task appears!

## Test Real-Time Sync

1. Have your wife install Expo Go and scan the same QR code
2. She creates an account and signs in
3. Add a task on your phone
4. Watch it appear on her phone instantly! 🎯

---

## Troubleshooting

**"npm: command not found"**
→ Node.js isn't installed. Download from https://nodejs.org

**QR code won't scan**
→ Make sure phone and computer are on same WiFi

**Can't sign in**
→ Check email for confirmation link first

**Tasks don't appear**
→ Make sure you ran the SQL in Step 3

**Need help?**
→ Message in the Claude chat!
