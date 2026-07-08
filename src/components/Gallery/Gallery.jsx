import { useEffect, useRef, useState } from "react";
import {
  fetchAlbums,
  fetchCategories,
  fetchPhotos,
  formatMonthYear,
  photoUrl,
  thumbUrl,
} from "../../lib/gallery";
import "./Gallery.css";

const PAGE_SIZE = 30;

function AlbumRow({ title, albums, onSelect }) {
  return (
    <div className="gallery-album-row">
      {title && <h3 className="gallery-row-title">{title}</h3>}
      <div className="gallery-album-strip">
        {albums.map((album) => (
          <button key={album.id} className="gallery-album-card" onClick={() => onSelect(album)}>
            {album.cover_photo ? (
              <img src={thumbUrl(album.cover_photo)} alt="" className="gallery-album-cover" />
            ) : (
              <div className="gallery-album-cover gallery-album-cover-empty" />
            )}
            <span className="gallery-album-name">{album.name}</span>
            {album.date_taken && (
              <span className="gallery-album-date">{formatMonthYear(album.date_taken)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function AlbumRows({ categories, albums, onSelect }) {
  if (albums.length === 0) {
    return <div className="gallery-empty">No albums yet.</div>;
  }
  const byCategory = (categoryId) =>
    albums
      .filter((a) => (a.category_id ?? null) === categoryId)
      .sort((a, b) => a.display_order - b.display_order);

  const rows = categories
    .map((c) => ({ id: c.id, title: c.name, albums: byCategory(c.id) }))
    .filter((row) => row.albums.length > 0);

  const uncategorized = byCategory(null);
  if (uncategorized.length > 0) {
    rows.push({ id: "uncategorized", title: null, albums: uncategorized });
  }

  return (
    <div className="gallery-rows">
      {rows.map((row) => (
        <AlbumRow key={row.id} title={row.title} albums={row.albums} onSelect={onSelect} />
      ))}
    </div>
  );
}

function PhotoGrid({ photos, visibleCount, onLoadMore, onOpen }) {
  const visible = photos.slice(0, visibleCount);
  if (photos.length === 0) {
    return <div className="gallery-empty">No photos in this album yet.</div>;
  }
  return (
    <>
      <div className="gallery-photo-grid">
        {visible.map((photo, index) => (
          <button key={photo.id} className="gallery-photo-tile" onClick={() => onOpen(index)}>
            <img
              src={thumbUrl(photo)}
              alt={photo.caption || ""}
              loading="lazy"
              style={
                photo.width && photo.height
                  ? { aspectRatio: `${photo.width} / ${photo.height}` }
                  : undefined
              }
            />
          </button>
        ))}
      </div>
      {visibleCount < photos.length && (
        <button className="gallery-load-more" onClick={onLoadMore}>
          Load more
        </button>
      )}
    </>
  );
}

function Lightbox({ photos, index, onClose, onNav }) {
  const photo = photos[index];
  const touchStartX = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onNav(-1);
      else if (e.key === "ArrowRight") onNav(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onNav]);

  if (!photo) return null;

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) onNav(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <div
      className="gallery-lightbox"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button className="gallery-lightbox-close" onClick={onClose}>
        ×
      </button>
      <button
        className="gallery-lightbox-nav gallery-lightbox-prev"
        onClick={(e) => {
          e.stopPropagation();
          onNav(-1);
        }}
      >
        ‹
      </button>
      <img
        className="gallery-lightbox-image"
        src={photoUrl(photo.storage_path)}
        alt={photo.caption || ""}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="gallery-lightbox-nav gallery-lightbox-next"
        onClick={(e) => {
          e.stopPropagation();
          onNav(1);
        }}
      >
        ›
      </button>
      {photo.caption && <div className="gallery-lightbox-caption">{photo.caption}</div>}
    </div>
  );
}

function Gallery() {
  const [albums, setAlbums] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    Promise.all([fetchAlbums(), fetchCategories()]).then(([albumData, categoryData]) => {
      setAlbums(albumData);
      setCategories(categoryData);
      setLoading(false);
    });
  }, []);

  const handleSelectAlbum = (album) => {
    setSelectedAlbum(album);
    setVisibleCount(PAGE_SIZE);
    setPhotosLoading(true);
    fetchPhotos(album.id).then((data) => {
      setPhotos(data);
      setPhotosLoading(false);
    });
  };

  const handleBack = () => {
    setSelectedAlbum(null);
    setPhotos([]);
    setLightboxIndex(null);
  };

  const handleNav = (delta) => {
    setLightboxIndex((prev) => {
      if (prev === null || photos.length === 0) return prev;
      return (prev + delta + photos.length) % photos.length;
    });
  };

  if (loading) return <div className="gallery-root gallery-loading">Loading…</div>;

  return (
    <div className="gallery-root">
      {selectedAlbum ? (
        <>
          <div className="gallery-album-header">
            <button className="gallery-back-btn" onClick={handleBack}>
              ‹ Albums
            </button>
            <span className="gallery-album-title">{selectedAlbum.name}</span>
            {selectedAlbum.date_taken && (
              <span className="gallery-album-title-date">
                {formatMonthYear(selectedAlbum.date_taken)}
              </span>
            )}
          </div>
          {photosLoading ? (
            <div className="gallery-loading">Loading…</div>
          ) : (
            <PhotoGrid
              photos={photos}
              visibleCount={visibleCount}
              onLoadMore={() => setVisibleCount((c) => c + PAGE_SIZE)}
              onOpen={setLightboxIndex}
            />
          )}
          {lightboxIndex !== null && (
            <Lightbox
              photos={photos}
              index={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
              onNav={handleNav}
            />
          )}
        </>
      ) : (
        <AlbumRows categories={categories} albums={albums} onSelect={handleSelectAlbum} />
      )}
    </div>
  );
}

export default Gallery;
