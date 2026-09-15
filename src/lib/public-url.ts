/** Root-relative public file, including the GitHub Pages base path. */
export function publicUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
