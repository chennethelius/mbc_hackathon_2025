# 🚀 Quick Start: Profile Photos in 3 Steps

## Step 1: Database Setup (2 minutes)

1. Open Supabase Dashboard: https://app.supabase.com
2. Go to **SQL Editor** → **New Query**
3. Copy contents of `photo_gallery_migration.sql`
4. Paste and click **Run**
5. Go to **Storage** → Verify `user-photos` bucket exists

✅ Done! Database is ready.

---

## Step 2: Start Your App (30 seconds)

```bash
npm run dev
```

Open browser to `http://localhost:5173`

---

## Step 3: Test Upload (1 minute)

1. **Login** to your app
2. Go to **Settings** (⚙️ icon)
3. Click **Profile** tab
4. **Upload profile picture:**
   - Drag & drop an image OR
   - Click the upload area
5. **Add gallery photos:**
   - Click the "+" button
   - Add up to 6 photos
6. **Fill in profile fields:**
   - Age, gender, height
   - Interests (comma-separated)
   - Bio
7. Click **Save Profile**

✅ Done! Your profile now has photos.

---

## 🎯 What You Can Do Now

### View Your Profile Data:
```sql
-- In Supabase SQL Editor:
SELECT * FROM profiles WHERE id = 'your-user-id';
```

### Check Uploaded Photos:
- Go to Supabase → Storage → user-photos
- See your uploaded images

### View in App:
- Settings page shows all your photos
- Profile picture appears in navbar (implement next)
- Gallery shows all 6 photos

---

## 🐛 Quick Troubleshooting

**Upload fails?**
- Check Supabase credentials in `.env`
- Verify storage bucket is public
- Check browser console for errors

**Photos not showing?**
- Refresh the page
- Check database has photo URLs
- Verify storage bucket policies

**Database error?**
- Re-run `photo_gallery_migration.sql`
- Check Supabase project is active

---

## 📁 File Reference

### Migration:
- `photo_gallery_migration.sql` - Run in Supabase SQL Editor

### Components:
- `src/components/ImageUpload.jsx` - Profile picture
- `src/components/PhotoGallery.jsx` - Gallery

### Service:
- `src/services/storageService.js` - Upload logic

### UI:
- `src/pages/Settings.jsx` - Profile settings page

---

## 🎨 What It Looks Like

### Profile Tab in Settings:

```
┌─────────────────────────────────────┐
│  Profile Picture                     │
│  ┌─────────────────┐                │
│  │                 │                │
│  │  Drag & Drop    │                │
│  │  or Click       │                │
│  │                 │                │
│  └─────────────────┘                │
│                                      │
│  Photo Gallery (3/6)                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐           │
│  │ 📷│ │ 📷│ │ 📷│ │ + │           │
│  └───┘ └───┘ └───┘ └───┘           │
│                                      │
│  Basic Information                   │
│  Username: [________]  Name: [_____]│
│  Age: [__]  Gender: [_____]         │
│                                      │
│  Education & Career                  │
│  University: [______________]        │
│  Occupation: [______________]        │
│                                      │
│  About You                           │
│  Interests: [hiking, coding, music]  │
│  Bio: [Tell us about yourself...]    │
│                                      │
│  [Save Profile]                      │
└─────────────────────────────────────┘
```

---

## ✅ You're All Set!

Your dating/betting app now has:
- ✅ Profile picture uploads
- ✅ Photo galleries (up to 6 photos)
- ✅ Extended Tinder-style profiles
- ✅ Age, gender, interests, height
- ✅ Drag & drop image uploads
- ✅ Mobile responsive design

**Ready to build the fun stuff!** 🎉

Next: Build user discovery, friend system, or betting features.

