import experience from "../assets/Experience.json";
import { fetchAlbums } from "./gallery";
import { itemSlug } from "./deepLinks";
import { getDesktopState } from "./desktopState";

// What Izak AI is told about the site with each message: what's on screen plus
// the live contents of the Projects/Internships/Photography windows, so its
// answers and link buttons never drift from what the site actually shows.

const toItem = ({ name, category, date, tags, info }) => ({
  slug: itemSlug(name),
  name,
  category: category || null,
  date: date || null,
  tags: tags ?? [],
  info: info ? info.slice(0, 1500) : null,
});

const projects = experience.projects.map(toItem);
const internships = experience.internships.map(toItem);

let albumsPromise = null;
// Published albums as { slug, name, date }, fetched once and shared (chat
// site context, the Photography menu, Spotlight).
export const loadAlbums = () => {
  albumsPromise ??= fetchAlbums()
    .then((albums) => albums.map((a) => ({ slug: itemSlug(a.name), name: a.name, date: a.date_taken || null })))
    .catch(() => {
      albumsPromise = null; // retry next message
      return [];
    });
  return albumsPromise;
};

export async function buildSiteContext() {
  const { open, focused } = getDesktopState();
  return {
    open_windows: open,
    focused,
    projects,
    internships,
    albums: await loadAlbums(),
  };
}
