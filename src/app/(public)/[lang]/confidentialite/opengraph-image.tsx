/**
 * Next resolves `opengraph-image` per route segment and a nested segment does
 * not inherit its parent's, so each public page re-exports the same card
 * rather than shipping a link with no preview.
 */
export {
  default,
  size,
  contentType,
  alt,
} from "../opengraph-image";
