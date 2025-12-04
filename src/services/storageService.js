import { supabase } from './supabase';

/**
 * Upload an image to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's ID
 * @param {string} type - 'profile' or 'gallery'
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadImage(file, userId, type = 'profile') {
  try {
    // Validate file
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP.' };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'File too large. Maximum size is 5MB.' };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${type}_${timestamp}.${fileExt}`;

    console.log('📤 Uploading image:', fileName);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('user-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-photos')
      .getPublicUrl(fileName);

    console.log('✅ Image uploaded successfully:', publicUrl);

    return {
      success: true,
      url: publicUrl,
      path: fileName
    };
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete an image from Supabase Storage
 * @param {string} filePath - The file path in storage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteImage(filePath) {
  try {
    if (!filePath) {
      return { success: false, error: 'No file path provided' };
    }

    console.log('🗑️ Deleting image:', filePath);

    const { error } = await supabase.storage
      .from('user-photos')
      .remove([filePath]);

    if (error) {
      console.error('❌ Delete error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Image deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update user's profile picture
 * @param {string} userId - User's ID
 * @param {string} avatarUrl - New avatar URL
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateProfilePicture(userId, avatarUrl) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Add a photo to user's gallery
 * @param {string} userId - User's ID
 * @param {string} photoUrl - Photo URL to add
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function addPhotoToGallery(userId, photoUrl) {
  try {
    // Get current photos
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('photos')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const currentPhotos = profile?.photos || [];
    const updatedPhotos = [...currentPhotos, photoUrl];

    // Update photos array
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photos: updatedPhotos })
      .eq('id', userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, photos: updatedPhotos };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Remove a photo from user's gallery
 * @param {string} userId - User's ID
 * @param {string} photoUrl - Photo URL to remove
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function removePhotoFromGallery(userId, photoUrl) {
  try {
    // Get current photos
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('photos')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const currentPhotos = profile?.photos || [];
    const updatedPhotos = currentPhotos.filter(url => url !== photoUrl);

    // Update photos array
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photos: updatedPhotos })
      .eq('id', userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, photos: updatedPhotos };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get all photos for a user
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, photos?: string[], error?: string}>}
 */
export async function getUserPhotos(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('photos, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      photos: data?.photos || [],
      avatarUrl: data?.avatar_url
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

