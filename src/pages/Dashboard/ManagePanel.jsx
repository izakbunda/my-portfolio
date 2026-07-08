import { useEffect, useState } from "react";
import {
  createCategory,
  deleteAlbum,
  deleteCategory,
  deletePhoto,
  fetchAlbums,
  fetchCategories,
  fetchPhotos,
  thumbUrl,
  monthInputValue,
  monthInputToDate,
  publishAllPhotos,
  reorderAlbums,
  reorderCategories,
  reorderPhotos,
  setAlbumCategory,
  updateAlbum,
  updateCategory,
  updatePhoto,
} from "../../lib/gallery";
import "./ManagePanel.css";

function useDragReorder(items, onReordered) {
  const [dragIndex, setDragIndex] = useState(null);

  const onDragStart = (index) => setDragIndex(index);

  const onDragOver = (index, e) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(index);
    onReordered(next);
  };

  const onDragEnd = () => setDragIndex(null);

  return { onDragStart, onDragOver, onDragEnd };
}

function PhotoRow({ photo, isCover, onSetCover, onTogglePublish, onDelete, onCaptionChange, drag, index }) {
  return (
    <div
      className="manage-photo-row"
      draggable
      onDragStart={() => drag.onDragStart(index)}
      onDragOver={(e) => drag.onDragOver(index, e)}
      onDragEnd={drag.onDragEnd}
    >
      <span className="manage-drag-handle">⠿</span>
      <img className="manage-photo-thumb" src={thumbUrl(photo)} alt="" />
      <input
        type="text"
        className="manage-photo-caption"
        placeholder="Caption (optional)"
        defaultValue={photo.caption || ""}
        onBlur={(e) => onCaptionChange(photo.id, e.target.value)}
      />
      <button
        className={`manage-cover-btn${isCover ? " active" : ""}`}
        onClick={() => onSetCover(photo.id)}
        title={isCover ? "Album cover" : "Set as album cover"}
      >
        {isCover ? "★" : "☆"}
      </button>
      <input
        type="checkbox"
        className="manage-publish-checkbox"
        checked={photo.published}
        onChange={(e) => onTogglePublish(photo.id, e.target.checked)}
        title={photo.published ? "Published" : "Not published"}
      />
      <button className="manage-delete-btn" onClick={() => onDelete(photo.id)}>
        Delete
      </button>
    </div>
  );
}

function AlbumPhotos({ album, onAlbumPatched }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setPhotos(await fetchPhotos(album.id));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album.id]);

  const drag = useDragReorder(photos, setPhotos);

  const persistOrder = async (next) => {
    await reorderPhotos(next.map((p) => p.id));
  };

  const handleDragEnd = async () => {
    drag.onDragEnd();
    await persistOrder(photos);
  };

  const handleSetCover = async (photoId) => {
    await updateAlbum(album.id, { cover_photo_id: photoId });
    const photo = photos.find((p) => p.id === photoId);
    onAlbumPatched(album.id, {
      cover_photo_id: photoId,
      cover_photo: photo ? { storage_path: photo.storage_path, thumb_path: photo.thumb_path } : null,
    });
  };

  const handleTogglePublish = async (photoId, published) => {
    await updatePhoto(photoId, { published });
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, published } : p)));
  };

  const handleCaptionChange = async (photoId, caption) => {
    await updatePhoto(photoId, { caption: caption || null });
  };

  const handleDelete = async (photoId) => {
    await deletePhoto(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handlePublishAll = async () => {
    await publishAllPhotos(album.id);
    setPhotos((prev) => prev.map((p) => ({ ...p, published: true })));
  };

  if (loading) return <div className="manage-loading">Loading photos…</div>;
  if (photos.length === 0) return <div className="manage-empty">No photos in this album yet.</div>;

  const allPublished = photos.every((p) => p.published);

  return (
    <div className="manage-photo-list">
      <div className="manage-photo-list-actions">
        <button onClick={handlePublishAll} disabled={allPublished}>
          Publish all
        </button>
      </div>
      {photos.map((photo, index) => (
        <PhotoRow
          key={photo.id}
          photo={photo}
          index={index}
          isCover={album.cover_photo_id === photo.id}
          onSetCover={handleSetCover}
          onTogglePublish={handleTogglePublish}
          onCaptionChange={handleCaptionChange}
          onDelete={handleDelete}
          drag={{ ...drag, onDragEnd: handleDragEnd }}
        />
      ))}
    </div>
  );
}

function AlbumRow({
  album,
  categories,
  index,
  expanded,
  onToggleExpand,
  onTogglePublish,
  onDelete,
  onAlbumPatched,
  onRename,
  onMoveCategory,
  onDateChange,
  drag,
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(album.name);

  const saveName = async () => {
    setEditingName(false);
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === album.name) {
      setNameDraft(album.name);
      return;
    }
    await onRename(album.id, trimmed);
  };

  return (
    <div className="manage-album-block">
      <div
        className="manage-album-row"
        draggable={!editingName}
        onDragStart={() => drag.onDragStart(index)}
        onDragOver={(e) => drag.onDragOver(index, e)}
        onDragEnd={drag.onDragEnd}
      >
        <span className="manage-drag-handle">⠿</span>
        {album.cover_photo?.storage_path ? (
          <img className="manage-album-thumb" src={thumbUrl(album.cover_photo)} alt="" />
        ) : (
          <div className="manage-album-thumb manage-album-thumb-empty" />
        )}
        {editingName ? (
          <input
            className="manage-album-name-input"
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.target.blur();
              if (e.key === "Escape") {
                setNameDraft(album.name);
                setEditingName(false);
              }
            }}
          />
        ) : (
          <button className="manage-album-name" onClick={() => onToggleExpand(album.id)}>
            {album.name}
          </button>
        )}
        <button
          className="manage-edit-btn"
          onClick={() => setEditingName(true)}
          title="Rename album"
        >
          ✎
        </button>
        <select
          className="manage-category-select"
          value={album.category_id ?? ""}
          onChange={(e) => onMoveCategory(album.id, e.target.value || null)}
        >
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="month"
          className="manage-date-input"
          value={monthInputValue(album.date_taken)}
          onChange={(e) => onDateChange(album.id, monthInputToDate(e.target.value))}
          title="Month/year taken"
        />
        <button
          className={`manage-publish-album-btn${album.published ? " active" : ""}`}
          onClick={() => onTogglePublish(album.id, !album.published)}
        >
          {album.published ? "Unpublish album" : "Publish album"}
        </button>
        <button className="manage-delete-btn" onClick={() => onDelete(album.id)}>
          Delete
        </button>
      </div>
      {expanded && <AlbumPhotos album={album} onAlbumPatched={onAlbumPatched} />}
    </div>
  );
}

function CategoryGroup({
  category,
  albums,
  categories,
  index,
  categoryDrag,
  onRenameCategory,
  onDeleteCategory,
  expandedId,
  onToggleExpand,
  onTogglePublish,
  onDeleteAlbum,
  onAlbumPatched,
  onRenameAlbum,
  onMoveCategory,
  onDateChange,
  onAlbumsReordered,
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(category?.name ?? "");

  const albumDrag = useDragReorder(albums, (reordered) =>
    onAlbumsReordered(category?.id ?? null, reordered)
  );

  const handleAlbumDragEnd = async () => {
    albumDrag.onDragEnd();
    await reorderAlbums(albums.map((a) => a.id));
  };

  const saveName = async () => {
    setEditingName(false);
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === category.name) {
      setNameDraft(category.name);
      return;
    }
    await onRenameCategory(category.id, trimmed);
  };

  return (
    <div className="manage-category-block">
      <div
        className="manage-category-header"
        draggable={category ? !editingName : false}
        onDragStart={() => category && categoryDrag.onDragStart(index)}
        onDragOver={(e) => category && categoryDrag.onDragOver(index, e)}
        onDragEnd={() => category && categoryDrag.onDragEnd()}
      >
        {category ? (
          <>
            <span className="manage-drag-handle">⠿</span>
            {editingName ? (
              <input
                className="manage-category-name-input"
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.target.blur();
                  if (e.key === "Escape") {
                    setNameDraft(category.name);
                    setEditingName(false);
                  }
                }}
              />
            ) : (
              <h3 className="manage-category-name">{category.name}</h3>
            )}
            <button
              className="manage-edit-btn"
              onClick={() => setEditingName(true)}
              title="Rename category"
            >
              ✎
            </button>
            <button
              className="manage-delete-btn"
              onClick={() => onDeleteCategory(category.id)}
            >
              Delete category
            </button>
          </>
        ) : (
          <h3 className="manage-category-name manage-category-name-uncategorized">Uncategorized</h3>
        )}
      </div>
      {albums.length === 0 ? (
        <div className="manage-empty">No albums here yet.</div>
      ) : (
        albums.map((album, i) => (
          <AlbumRow
            key={album.id}
            album={album}
            categories={categories}
            index={i}
            expanded={expandedId === album.id}
            onToggleExpand={onToggleExpand}
            onTogglePublish={onTogglePublish}
            onDelete={onDeleteAlbum}
            onAlbumPatched={onAlbumPatched}
            onRename={onRenameAlbum}
            onMoveCategory={onMoveCategory}
            onDateChange={onDateChange}
            drag={{ ...albumDrag, onDragEnd: handleAlbumDragEnd }}
          />
        ))
      )}
    </div>
  );
}

function ManagePanel() {
  const [categories, setCategories] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const load = async () => {
    setLoading(true);
    const [cats, albs] = await Promise.all([fetchCategories(), fetchAlbums()]);
    setCategories(cats);
    setAlbums(albs);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const categoryDrag = useDragReorder(categories, setCategories);
  const handleCategoryDragEnd = async () => {
    categoryDrag.onDragEnd();
    await reorderCategories(categories.map((c) => c.id));
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const category = await createCategory(name);
    setCategories((prev) => [...prev, category]);
    setNewCategoryName("");
  };

  const handleRenameCategory = async (id, name) => {
    await updateCategory(id, { name });
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const handleDeleteCategory = async (id) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setAlbums((prev) => prev.map((a) => (a.category_id === id ? { ...a, category_id: null } : a)));
  };

  const handleToggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const handleTogglePublish = async (id, published) => {
    await updateAlbum(id, { published });
    setAlbums((prev) => prev.map((a) => (a.id === id ? { ...a, published } : a)));
  };

  const handleDeleteAlbum = async (id) => {
    await deleteAlbum(id);
    setAlbums((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAlbumPatched = (id, patch) =>
    setAlbums((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const handleRenameAlbum = async (id, name) => {
    await updateAlbum(id, { name });
    setAlbums((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)));
  };

  const handleMoveCategory = async (albumId, categoryId) => {
    await setAlbumCategory(albumId, categoryId);
    await load();
  };

  const handleDateChange = async (albumId, dateTaken) => {
    await updateAlbum(albumId, { date_taken: dateTaken });
    setAlbums((prev) => prev.map((a) => (a.id === albumId ? { ...a, date_taken: dateTaken } : a)));
  };

  const handleAlbumsReordered = (categoryId, reordered) => {
    const orderMap = new Map(reordered.map((a, i) => [a.id, i]));
    setAlbums((prev) =>
      prev.map((a) => (orderMap.has(a.id) ? { ...a, display_order: orderMap.get(a.id) } : a))
    );
  };

  if (loading) return <div className="manage-loading">Loading albums…</div>;
  if (albums.length === 0 && categories.length === 0)
    return <div className="manage-empty">No albums yet. Upload some photos first.</div>;

  const byCategory = (categoryId) =>
    albums
      .filter((a) => (a.category_id ?? null) === categoryId)
      .sort((a, b) => a.display_order - b.display_order);

  const uncategorized = byCategory(null);

  return (
    <div className="manage-panel">
      <div className="manage-new-category">
        <input
          type="text"
          placeholder="New category name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
        />
        <button onClick={handleCreateCategory}>+ Add category</button>
      </div>

      {categories.map((category, index) => (
        <CategoryGroup
          key={category.id}
          category={category}
          albums={byCategory(category.id)}
          categories={categories}
          index={index}
          categoryDrag={{ ...categoryDrag, onDragEnd: handleCategoryDragEnd }}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
          expandedId={expandedId}
          onToggleExpand={handleToggleExpand}
          onTogglePublish={handleTogglePublish}
          onDeleteAlbum={handleDeleteAlbum}
          onAlbumPatched={handleAlbumPatched}
          onRenameAlbum={handleRenameAlbum}
          onMoveCategory={handleMoveCategory}
          onDateChange={handleDateChange}
          onAlbumsReordered={handleAlbumsReordered}
        />
      ))}

      {uncategorized.length > 0 && (
        <CategoryGroup
          category={null}
          albums={uncategorized}
          categories={categories}
          index={-1}
          categoryDrag={categoryDrag}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
          expandedId={expandedId}
          onToggleExpand={handleToggleExpand}
          onTogglePublish={handleTogglePublish}
          onDeleteAlbum={handleDeleteAlbum}
          onAlbumPatched={handleAlbumPatched}
          onRenameAlbum={handleRenameAlbum}
          onMoveCategory={handleMoveCategory}
          onDateChange={handleDateChange}
          onAlbumsReordered={handleAlbumsReordered}
        />
      )}
    </div>
  );
}

export default ManagePanel;
