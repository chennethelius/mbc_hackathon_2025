# 📸 Profile Photos & Tinder-Style Profile Setup Guide

This guide will help you set up profile picture uploads, photo galleries, and extended Tinder-style profile fields.

## ✨ What's Been Added

### New Features:
1. **Profile Picture Upload** - Drag & drop or click to upload main profile photo
2. **Photo Gallery** - Upload up to 6 photos (like Tinder)
3. **Extended Profile Fields**:
   - Age, Gender, Interested In, Height
   - Interests & Hobbies
   - Looking For (relationship type)
   - Occupation, Company
   - Education Level

### New Components:
- `ImageUpload.jsx` - Profile picture upload with preview
- `PhotoGallery.jsx` - Multi-photo gallery manager
- `storageService.js` - Supabase Storage integration

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

1. Go to your **Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open `photo_gallery_migration.sql` from your project root
6. Copy and paste the contents into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)

This will:
- Add `photos` array column to profiles table
- Add Tinder-style fields (age, gender, height, interests, etc.)
- Create `user-photos` storage bucket
- Set up storage policies for image uploads

### Step 2: Verify Storage Bucket

After running the migration, verify the storage bucket was created:

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. You should see a bucket named `user-photos`
3. The bucket should be **public** (for profile viewing)

If the bucket doesn't exist, create it manually:
- Click **New bucket**
- Name: `user-photos`
- Public bucket: ✓ **Yes**
- Click **Create bucket**

### Step 3: Test the Profile Upload Flow

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Login to your app** and navigate to **Settings**

3. **Upload Profile Picture**:
   - Click or drag & drop an image to the profile picture area
   - You should see a preview immediately
   - Click "Save Profile" to persist changes
   - Check browser console for upload logs

4. **Add Photos to Gallery**:
   - Click the "+" button in the photo gallery
   - Upload up to 6 photos
   - Each photo is saved immediately to database
   - Hover over photos to see remove button

5. **Fill in Extended Profile Fields**:
   - Age, gender, height, interests
   - Occupation, company, education
   - All saved when you click "Save Profile"

---

## 🗄️ Database Schema Updates

### New Columns in `profiles` Table:

```sql
photos TEXT[]                -- Array of photo URLs
age INTEGER                  -- User's age
gender TEXT                  -- Male, Female, Non-binary, etc.
interested_in TEXT           -- Men, Women, Everyone
height TEXT                  -- e.g., "5'10" or "178cm"
interests TEXT[]             -- Array of interests/hobbies
looking_for TEXT             -- relationship, casual, friends
occupation TEXT              -- Job title
company TEXT                 -- Employer/organization
education_level TEXT         -- Bachelor's, Master's, PhD, etc.
```

---

## 📁 File Upload Details

### Supported Formats:
- JPEG / JPG
- PNG
- GIF
- WebP

### Size Limit:
- Maximum 5MB per image

### Storage Path:
- Images stored at: `user-photos/{userId}/{type}_{timestamp}.{ext}`
- Example: `user-photos/did:privy:xyz/profile_1234567890.jpg`

### Public URLs:
- All uploaded images get public URLs automatically
- URLs stored in database for easy retrieval
- No authentication required to view profile photos

---

## 🎨 UI Components Reference

### ImageUpload Component

```jsx
<ImageUpload
  currentImage={profileData.avatar_url}
  onImageUpload={handleProfilePictureUpload}
  uploading={uploadingImage}
  label="Profile Picture"
/>
```

**Props:**
- `currentImage` - Current profile picture URL
- `onImageUpload` - Callback function when file is selected
- `uploading` - Boolean to show loading state
- `label` - Custom label text

### PhotoGallery Component

```jsx
<PhotoGallery
  photos={profileData.photos}
  onAddPhoto={handleGalleryPhotoUpload}
  onRemovePhoto={handleRemoveGalleryPhoto}
  uploading={uploadingImage}
  maxPhotos={6}
/>
```

**Props:**
- `photos` - Array of photo URLs
- `onAddPhoto` - Callback when adding photo
- `onRemovePhoto` - Callback when removing photo
- `uploading` - Boolean to show loading state
- `maxPhotos` - Maximum number of photos (default: 6)

---

## 🔧 Storage Service API

### Upload Image

```javascript
import { uploadImage } from '../services/storageService';

const result = await uploadImage(file, userId, 'profile');
// Returns: { success: true, url: "...", path: "..." }
```

### Add Photo to Gallery

```javascript
import { addPhotoToGallery } from '../services/storageService';

const result = await addPhotoToGallery(userId, photoUrl);
// Returns: { success: true, photos: [...] }
```

### Remove Photo from Gallery

```javascript
import { removePhotoFromGallery } from '../services/storageService';

const result = await removePhotoFromGallery(userId, photoUrl);
// Returns: { success: true, photos: [...] }
```

### Delete Image from Storage

```javascript
import { deleteImage } from '../services/storageService';

const result = await deleteImage(filePath);
// Returns: { success: true }
```

---

## 🐛 Troubleshooting

### Issue: "Upload failed - No bucket found"

**Solution:**
1. Go to Supabase Storage
2. Create bucket named `user-photos`
3. Make it public
4. Retry upload

### Issue: "RLS policy error"

**Solution:**
Run these commands in Supabase SQL Editor:

```sql
-- Allow anyone to upload
CREATE POLICY "Users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user-photos');

-- Allow anyone to view
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-photos');
```

### Issue: "File too large"

**Solution:**
- Check file size (max 5MB)
- Compress image before uploading
- Update size limit in `storageService.js` if needed

### Issue: Photos not displaying

**Check:**
1. Bucket is public in Supabase
2. URLs are valid in database
3. Browser console for CORS errors
4. Storage policies are correct

---

## 🎯 Testing Checklist

- [ ] Database migration completed successfully
- [ ] Storage bucket `user-photos` exists and is public
- [ ] Can upload profile picture
- [ ] Profile picture displays correctly
- [ ] Can add photos to gallery (up to 6)
- [ ] Can remove photos from gallery
- [ ] Extended profile fields save correctly
- [ ] Interests parse from comma-separated input
- [ ] Mobile responsive layout works
- [ ] Image drag & drop works
- [ ] Upload loading states display correctly

---

## 🚀 Next Steps

Now that profiles support photos, you can:

1. **Create User Profile Display Page** - Show off the photos in a Tinder-style card
2. **Build Discover/Browse Page** - Grid of user cards with main profile photo
3. **Add Profile Privacy Settings** - Control who can see photos
4. **Implement Image Optimization** - Resize/compress on upload
5. **Add Photo Verification** - Badge for users with verified photos

---

## 📊 Storage Usage Monitoring

To monitor storage usage in Supabase:

1. Go to **Storage** → **user-photos**
2. View total size and file count
3. Set up alerts for storage limits
4. Consider implementing cleanup for deleted users

**Free Tier Limits:**
- 1GB storage
- 2GB bandwidth per month

---

## 🎨 Customization Options

### Change Max Photos Limit

In `Settings.jsx`:
```jsx
<PhotoGallery maxPhotos={9} />  // Change from 6 to 9
```

### Change File Size Limit

In `storageService.js`:
```javascript
const maxSize = 10 * 1024 * 1024; // Change to 10MB
```

### Add More Image Formats

In `storageService.js`:
```javascript
const validTypes = [
  'image/jpeg', 'image/jpg', 'image/png', 
  'image/gif', 'image/webp', 'image/svg+xml'
];
```

---

## ✅ Success!

Your app now has:
- ✅ Profile picture uploads with drag & drop
- ✅ Photo gallery (up to 6 photos)
- ✅ Tinder-style extended profile fields
- ✅ Supabase Storage integration
- ✅ Beautiful, responsive UI

Ready to build dating features! 🎉

