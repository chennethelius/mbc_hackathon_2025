import { useState, useRef } from 'react';
import './PhotoGallery.css';

/**
 * PhotoGallery Component - For managing multiple profile photos
 */
function PhotoGallery({ photos = [], onAddPhoto, onRemovePhoto, uploading, maxPhotos = 6 }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file && onAddPhoto) {
      onAddPhoto(file);
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
      if (onAddPhoto) {
        onAddPhoto(e.dataTransfer.files[0]);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="photo-gallery-container">
      <div className="photo-gallery-header">
        <label className="photo-gallery-label">
          Photo Gallery
          <span className="photo-count"> ({photos.length}/{maxPhotos})</span>
        </label>
        <p className="photo-gallery-hint">
          Add up to {maxPhotos} photos to showcase yourself
        </p>
      </div>

      <div className="photo-gallery-grid">
        {photos.map((photoUrl, index) => (
          <div key={index} className="photo-gallery-item">
            <img src={photoUrl} alt={`Photo ${index + 1}`} className="gallery-photo" />
            <div className="photo-overlay">
              <button
                type="button"
                className="btn-remove-photo"
                onClick={() => onRemovePhoto && onRemovePhoto(photoUrl)}
                disabled={uploading}
                title="Remove photo"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        {canAddMore && (
          <div
            className={`photo-gallery-add ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleButtonClick}
          >
            <div className="add-photo-content">
              <div className="add-icon">+</div>
              <p className="add-text">
                {uploading ? '⏳ Uploading...' : 'Add Photo'}
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="file-input-hidden"
        disabled={uploading || !canAddMore}
      />

      {!canAddMore && (
        <p className="max-photos-message">
          ✓ Maximum of {maxPhotos} photos reached
        </p>
      )}
    </div>
  );
}

export default PhotoGallery;

