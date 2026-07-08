import { useEffect, useRef, useState } from "react";
import { createAlbum, fetchAlbums, getNextPhotoOrder, uploadPhoto } from "../../lib/gallery";
import { processImage } from "../../lib/imageProcessing";
import "./UploadPanel.css";

const CONCURRENCY = 3;
const STAGE_LABEL = {
  pending: "Waiting…",
  processing: "Converting…",
  uploading: "Uploading…",
  done: "Done",
  error: "Failed",
};
const STAGE_PERCENT = { pending: 0, processing: 33, uploading: 66, done: 100, error: 100 };

async function runWithConcurrency(items, limit, worker) {
  let idx = 0;
  async function next() {
    const i = idx++;
    if (i >= items.length) return;
    await worker(items[i], i);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
}

function UploadPanel({ onUploaded }) {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [newAlbumName, setNewAlbumName] = useState("");
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [batchError, setBatchError] = useState("");
  const fileInputRef = useRef(null);

  const loadAlbums = async () => {
    const data = await fetchAlbums();
    setAlbums(data);
    if (!selectedAlbumId && data.length === 0) setSelectedAlbumId("new");
  };

  useEffect(() => {
    loadAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (fileList) => {
    const picked = Array.from(fileList).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    setFiles((prev) => [
      ...prev,
      ...picked.map((file) => ({
        id: crypto.randomUUID(),
        file,
        caption: "",
        status: "pending",
        error: null,
      })),
    ]);
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const updateFileCaption = (id, caption) =>
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, caption } : f)));

  const updateFileStatus = (id, status, error = null) =>
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status, error } : f)));

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    setBatchError("");
    if (files.length === 0) return;

    let albumId = selectedAlbumId;
    if (albumId === "new") {
      if (!newAlbumName.trim()) {
        setBatchError("Enter a name for the new album.");
        return;
      }
    } else if (!albumId) {
      setBatchError("Choose an album.");
      return;
    }

    setBusy(true);
    try {
      if (selectedAlbumId === "new") {
        const album = await createAlbum(newAlbumName.trim());
        albumId = album.id;
      }

      const startOrder = await getNextPhotoOrder(albumId);
      const pending = files.filter((f) => f.status === "pending" || f.status === "error");

      await runWithConcurrency(pending, CONCURRENCY, async (item, index) => {
        try {
          updateFileStatus(item.id, "processing");
          const { blob, thumbBlob, width, height } = await processImage(item.file);
          updateFileStatus(item.id, "uploading");
          await uploadPhoto({
            albumId,
            blob,
            thumbBlob,
            width,
            height,
            order: startOrder + index,
            caption: item.caption,
          });
          updateFileStatus(item.id, "done");
        } catch (err) {
          updateFileStatus(item.id, "error", err.message || "Upload failed");
        }
      });

      setNewAlbumName("");
      setSelectedAlbumId(albumId);
      await loadAlbums();
      onUploaded?.();
    } catch (err) {
      setBatchError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const clearDone = () => setFiles((prev) => prev.filter((f) => f.status !== "done"));

  return (
    <div className="upload-panel">
      <div className="upload-album-picker">
        <label>
          Album
          <select
            value={selectedAlbumId}
            onChange={(e) => setSelectedAlbumId(e.target.value)}
            disabled={busy}
          >
            <option value="" disabled>
              Select an album…
            </option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {a.published ? "" : " (draft)"}
              </option>
            ))}
            <option value="new">+ New album</option>
          </select>
        </label>
        {selectedAlbumId === "new" && (
          <input
            type="text"
            placeholder="New album name"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            disabled={busy}
          />
        )}
      </div>

      <div
        className={`upload-dropzone${isDragging ? " dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        Drag photos here, or click to choose files
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="upload-file-list">
          {files.map((f) => (
            <div className="upload-file-row" key={f.id}>
              <span className="upload-file-name">{f.file.name}</span>
              <input
                type="text"
                className="upload-file-caption"
                placeholder="Caption (optional)"
                value={f.caption}
                onChange={(e) => updateFileCaption(f.id, e.target.value)}
                disabled={busy || f.status === "done"}
              />
              <div className="upload-file-progress">
                <div
                  className={`upload-file-progress-bar ${f.status}`}
                  style={{ width: `${STAGE_PERCENT[f.status]}%` }}
                />
              </div>
              <span className={`upload-file-status ${f.status}`}>
                {f.error || STAGE_LABEL[f.status]}
              </span>
              {f.status !== "processing" && f.status !== "uploading" && (
                <button className="upload-file-remove" onClick={() => removeFile(f.id)}>
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {batchError && <div className="upload-batch-error">{batchError}</div>}

      <div className="upload-actions">
        <button onClick={handleUpload} disabled={busy || files.length === 0}>
          {busy ? "Uploading…" : `Upload ${files.length || ""}`.trim()}
        </button>
        {files.some((f) => f.status === "done") && (
          <button className="upload-clear-done" onClick={clearDone} disabled={busy}>
            Clear finished
          </button>
        )}
      </div>
    </div>
  );
}

export default UploadPanel;
