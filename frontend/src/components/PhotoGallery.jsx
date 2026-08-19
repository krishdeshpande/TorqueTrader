import { useState } from 'react';
import { Icons } from './Icons';

export default function PhotoGallery({ images = {}, title = "Motorcycle" }) {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Normalize image pool across tabs
  const heroImg = images.hero || "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1600&q=80";
  const walkaroundImgs = images.walkaround && images.walkaround.length > 0 ? images.walkaround : [heroImg];
  const cockpitImgs = images.cockpit && images.cockpit.length > 0 ? images.cockpit : [];
  const mechanicalsImgs = images.mechanicals && images.mechanicals.length > 0 ? images.mechanicals : [];
  const flawsImgs = images.flaws && images.flaws.length > 0 ? images.flaws : [];

  const getFilteredList = () => {
    switch (activeTab) {
      case 'walkaround':
        return walkaroundImgs;
      case 'cockpit':
        return cockpitImgs.length > 0 ? cockpitImgs : [heroImg];
      case 'mechanicals':
        return mechanicalsImgs.length > 0 ? mechanicalsImgs : [heroImg];
      case 'flaws':
        return flawsImgs;
      case 'all':
      default: {
        const set = [heroImg, ...walkaroundImgs, ...cockpitImgs, ...mechanicalsImgs, ...flawsImgs];
        return Array.from(new Set(set));
      }
    }
  };

  const currentList = getFilteredList();
  const activeImage = currentList[selectedIdx] || currentList[0] || heroImg;

  const handleNext = (e) => {
    e?.stopPropagation();
    setSelectedIdx((prev) => (prev + 1) % currentList.length);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setSelectedIdx((prev) => (prev - 1 + currentList.length) % currentList.length);
  };

  const openLightbox = (idx) => {
    setSelectedIdx(idx);
    setLightboxOpen(true);
  };

  return (
    <div className="photo-gallery-wrapper">
      {/* Category Filter Tabs */}
      <div className="gallery-tab-bar">
        <button
          type="button"
          className={`gallery-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => { setActiveTab('all'); setSelectedIdx(0); }}
        >
          All Photos ({Array.from(new Set([heroImg, ...walkaroundImgs, ...cockpitImgs, ...mechanicalsImgs, ...flawsImgs])).length})
        </button>
        <button
          type="button"
          className={`gallery-tab ${activeTab === 'walkaround' ? 'active' : ''}`}
          onClick={() => { setActiveTab('walkaround'); setSelectedIdx(0); }}
        >
          Exterior Walkaround ({walkaroundImgs.length})
        </button>
        {cockpitImgs.length > 0 && (
          <button
            type="button"
            className={`gallery-tab ${activeTab === 'cockpit' ? 'active' : ''}`}
            onClick={() => { setActiveTab('cockpit'); setSelectedIdx(0); }}
          >
            Cockpit & Odo ({cockpitImgs.length})
          </button>
        )}
        {mechanicalsImgs.length > 0 && (
          <button
            type="button"
            className={`gallery-tab ${activeTab === 'mechanicals' ? 'active' : ''}`}
            onClick={() => { setActiveTab('mechanicals'); setSelectedIdx(0); }}
          >
            Engine & Exhaust ({mechanicalsImgs.length})
          </button>
        )}
        {flawsImgs.length > 0 && (
          <button
            type="button"
            className={`gallery-tab ${activeTab === 'flaws' ? 'active' : ''}`}
            onClick={() => { setActiveTab('flaws'); setSelectedIdx(0); }}
          >
            Declared Flaws ({flawsImgs.length})
          </button>
        )}
      </div>

      {/* Main Feature Image */}
      <div className="gallery-main-frame" onClick={() => openLightbox(selectedIdx)}>
        <img
          src={activeImage}
          alt={`${title} - Photo ${selectedIdx + 1}`}
          className="gallery-main-img"
          loading="eager"
        />
        <div className="gallery-badge-overlay">
          <span className="gallery-counter">
            Photo {selectedIdx + 1} of {currentList.length}
          </span>
          <span className="gallery-expand-hint">
            {Icons.camera} View Full Screen
          </span>
        </div>

        {currentList.length > 1 && (
          <>
            <button className="gallery-nav-btn prev" onClick={handlePrev} aria-label="Previous photo">
              {Icons.arrowLeft}
            </button>
            <button className="gallery-nav-btn next" onClick={handleNext} aria-label="Next photo">
              {Icons.arrowRight}
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {currentList.length > 1 && (
        <div className="gallery-thumb-strip">
          {currentList.map((src, i) => (
            <button
              key={i}
              type="button"
              className={`gallery-thumb-btn ${i === selectedIdx ? 'selected' : ''}`}
              onClick={() => setSelectedIdx(i)}
            >
              <img src={src} alt={`Thumbnail ${i + 1}`} className="gallery-thumb-img" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Full-Screen Lightbox */}
      {lightboxOpen && (
        <div className="lightbox-backdrop" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-top-bar">
              <span className="lightbox-info">
                {title} — Photo {selectedIdx + 1} of {currentList.length}
              </span>
              <button className="lightbox-close-btn" onClick={() => setLightboxOpen(false)} aria-label="Close Lightbox">
                {Icons.close}
              </button>
            </div>

            <div className="lightbox-viewport">
              <img src={activeImage} alt={title} className="lightbox-img" />
              {currentList.length > 1 && (
                <>
                  <button className="lightbox-nav-btn prev" onClick={handlePrev} aria-label="Previous">
                    {Icons.arrowLeft}
                  </button>
                  <button className="lightbox-nav-btn next" onClick={handleNext} aria-label="Next">
                    {Icons.arrowRight}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
