import { supabase } from "./supabase";

export async function fetchAlbums() {
  const { data, error } = await supabase
    .from("albums")
    .select("*, cover_photo:photos!albums_cover_photo_id_fkey(storage_path, thumb_path)")
    .eq("deleted", false)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function hasPublishedAlbum() {
  const { data, error } = await supabase
    .from("albums")
    .select("id")
    .eq("published", true)
    .eq("deleted", false)
    .limit(1);
  if (error) throw error;
  return data.length > 0;
}

export async function getNextAlbumOrder(categoryId) {
  let query = supabase
    .from("albums")
    .select("display_order")
    .eq("deleted", false)
    .order("display_order", { ascending: false })
    .limit(1);
  query = categoryId ? query.eq("category_id", categoryId) : query.is("category_id", null);
  const { data, error } = await query;
  if (error) throw error;
  return data.length ? data[0].display_order + 1 : 0;
}

export async function createAlbum(name) {
  const nextOrder = await getNextAlbumOrder(null);

  const { data, error } = await supabase
    .from("albums")
    .insert({ name, display_order: nextOrder, published: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setAlbumCategory(albumId, categoryId) {
  const order = await getNextAlbumOrder(categoryId);
  await updateAlbum(albumId, { category_id: categoryId, display_order: order });
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createCategory(name) {
  const { data: existing, error: fetchError } = await supabase
    .from("categories")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);
  if (fetchError) throw fetchError;
  const nextOrder = existing.length ? existing[0].display_order + 1 : 0;

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, display_order: nextOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, patch) {
  const { error } = await supabase.from("categories").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderCategories(orderedIds) {
  await Promise.all(
    orderedIds.map((id, index) => updateCategory(id, { display_order: index }))
  );
}

export async function getNextPhotoOrder(albumId) {
  const { data, error } = await supabase
    .from("photos")
    .select("display_order")
    .eq("album_id", albumId)
    .order("display_order", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data.length ? data[0].display_order + 1 : 0;
}

export async function uploadPhoto({ albumId, blob, thumbBlob, width, height, order, caption = "" }) {
  const id = crypto.randomUUID();
  const path = `${albumId}/${id}.jpg`;
  const thumbPath = `${albumId}/${id}_thumb.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(path, blob, { contentType: "image/jpeg" });
  if (uploadError) throw uploadError;

  const { error: thumbUploadError } = await supabase.storage
    .from("photos")
    .upload(thumbPath, thumbBlob, { contentType: "image/jpeg" });
  if (thumbUploadError) throw thumbUploadError;

  const { data, error } = await supabase
    .from("photos")
    .insert({
      album_id: albumId,
      storage_path: path,
      thumb_path: thumbPath,
      width,
      height,
      display_order: order,
      caption: caption || null,
      published: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function photoUrl(storagePath) {
  const { data } = supabase.storage.from("photos").getPublicUrl(storagePath);
  return data.publicUrl;
}

export function thumbUrl(photo) {
  return photoUrl(photo.thumb_path || photo.storage_path);
}

export async function fetchPhotos(albumId) {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("album_id", albumId)
    .eq("deleted", false)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateAlbum(id, patch) {
  const { error } = await supabase.from("albums").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updatePhoto(id, patch) {
  const { error } = await supabase.from("photos").update(patch).eq("id", id);
  if (error) throw error;
}

// Soft delete: marks the album (and cascades to all its photos) as deleted
// and unpublished, rather than removing rows. `deleted` hides them from the
// dashboard; rows and storage objects are kept, so this is reversible by
// clearing `deleted` directly in the database later if ever needed.
export async function deleteAlbum(id) {
  const { error: photosError } = await supabase
    .from("photos")
    .update({ published: false, deleted: true })
    .eq("album_id", id);
  if (photosError) throw photosError;
  await updateAlbum(id, { published: false, deleted: true });
}

export async function deletePhoto(id) {
  await updatePhoto(id, { published: false, deleted: true });
}

export async function publishAllPhotos(albumId) {
  const { error } = await supabase
    .from("photos")
    .update({ published: true })
    .eq("album_id", albumId)
    .eq("deleted", false);
  if (error) throw error;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Manual parsing avoids JS Date's UTC-vs-local timezone shift, which can
// silently roll a stored "2026-07-01" back to June when formatted locally.
export function formatMonthYear(dateTaken) {
  if (!dateTaken) return null;
  const [year, month] = dateTaken.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function monthInputValue(dateTaken) {
  return dateTaken ? dateTaken.slice(0, 7) : "";
}

export function monthInputToDate(value) {
  return value ? `${value}-01` : null;
}

export async function reorderAlbums(orderedIds) {
  await Promise.all(
    orderedIds.map((id, index) => updateAlbum(id, { display_order: index }))
  );
}

export async function reorderPhotos(orderedIds) {
  await Promise.all(
    orderedIds.map((id, index) => updatePhoto(id, { display_order: index }))
  );
}
