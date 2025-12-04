import { useState, useRef, useEffect } from 'react';
import './ImageUpload.css';

/**
 * ImageUpload Component - For uploading a single profile picture
 */
function ImageUpload({ currentImage, onImageUpload, uploading, label = "Profile Picture" }) {
  const [preview, setPreview] = useState(currentImage || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Update preview when currentImage prop changes (e.g., after reload)
  useEffect(() => {
    console.log('🖼️ ImageUpload - currentImage changed:', currentImage);
    setPreview(currentImage || null);
  }, [currentImage]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Call parent upload handler
    if (onImageUpload) {
      onImageUpload(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-container">
      <label className="image-upload-label">{label}</label>
      
      <div
        className={`image-upload-zone ${dragActive ? 'drag-active' : ''} ${preview ? 'has-image' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!preview ? handleButtonClick : undefined}
      >
        {preview ? (
          <div className="image-preview">
            <img src={preview} alt="Preview" className="preview-image" />
            <div className="image-overlay">
              <button
                type="button"
                className="btn-change-image"
                onClick={(e) => {
                  e.stopPropagation();
                  handleButtonClick();
                }}
                disabled={uploading}
              >
                {uploading ? '⏳ Uploading...' : '📷 Change Photo'}
              </button>
              <button
                type="button"
                className="btn-remove-image"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                disabled={uploading}
              >
                🗑️ Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📷</div>
            <p className="upload-text">
              Drag & drop or click to upload
            </p>
            <p className="upload-hint">
              JPEG, PNG, GIF, or WebP (max 5MB)
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="file-input-hidden"
        disabled={uploading}
      />
    </div>
  );
}

export default ImageUpload;

