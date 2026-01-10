# Vectors - Couple's Task Manager

A dead-simple mobile app for couples to manage shared tasks. Built with React Native + Expo + Supabase.

## Features (v1)
- ✅ Real-time task sync between devices
- ✅ Add/delete/complete tasks
- ✅ Simple authentication
- 🚧 Task assignment (me/you/us) - coming next
- 🚧 Voice input - coming soon
- 🚧 Location reminders - coming soon

## Setup Instructions

### 1. Install Dependencies
```bash
cd vectors
npm install
```

### 2. Set Up Supabase Database

Go to your Supabase project (https://eddnrkrvbbrbuzwxlgfc.supabase.co) and run this SQL:

```sql
-- Create tasks table
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to TEXT DEFAULT 'me', -- 'me', 'you', 'us'
  due_date TIMESTAMPTZ,
  recurring TEXT -- 'daily', 'weekly', etc.
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all tasks (shared between couple)
CREATE POLICY "Anyone can view tasks" ON tasks
  FOR SELECT USING (true);

-- Policy: Authenticated users can insert tasks
CREATE POLICY "Authenticated users can insert tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update any task (couples share everything)
CREATE POLICY "Anyone can update tasks" ON tasks
  FOR UPDATE USING (true);

-- Policy: Users can delete any task
CREATE POLICY "Anyone can delete tasks" ON tasks
  FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
```

To run this SQL:
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Paste the SQL above
4. Click "Run" (or press Cmd/Ctrl + Enter)

### 3. Run the App

```bash
npm start
```

This will start the Expo dev server. You'll see a QR code in your terminal.

### 4. Open on Your Phone

**Option A: Expo Go App (easiest)**
1. Download "Expo Go" from App Store (iPhone) or Play Store (Android)
2. Open Expo Go
3. Scan the QR code from your terminal

**Option B: Development Build**
- For iOS: `npm run ios` (requires Xcode)
- For Android: `npm run android` (requires Android Studio)

## First Use

1. Open the app on your phone
2. Tap "Sign Up" and create an account with your email
3. Check your email and click the confirmation link
4. Sign in with your email/password
5. Have your wife do the same
6. Both of you will see the same tasks in real-time!

## Testing Real-Time Sync

1. Open the app on two devices (or use Expo Go on phone + web browser)
2. Add a task on one device
3. Watch it appear instantly on the other device
4. Complete/delete tasks - changes sync immediately

## Development Notes

- Environment variables are in `.env` (already configured)
- Supabase client is in `lib/supabase.js`
- Screens are in `screens/` folder
- Real-time subscription is set up in TaskListScreen

## Next Steps

Week 1 priorities:
- [x] Basic task CRUD
- [x] Real-time sync
- [ ] Task assignment (me/you/us)
- [ ] Better UI/styling
- [ ] Quick add button

Week 2:
- [ ] Voice input
- [ ] Recurring tasks
- [ ] Push notifications

## Troubleshooting

**App won't load?**
- Make sure `npm install` completed successfully
- Check that Node.js is installed: `node --version`
- Try clearing cache: `expo start -c`

**Can't see tasks?**
- Verify you ran the SQL to create the `tasks` table
- Check Supabase → Table Editor to see if table exists
- Make sure you're signed in with confirmed email

**Real-time not working?**
- Verify you ran the `ALTER PUBLICATION` SQL command
- Check Supabase → Database → Replication to ensure tasks table is enabled

Need help? Message in this chat!
