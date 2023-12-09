
/**
 * Normalize a path:
 * + Empty paths are represented as an empty string.
 * + Non-empty paths start with a slash.
 *
 * @param path The path to normalize.
 * @returns The normalized path.
 */
export function normalize(path: string) {
	if (path === "/" || path === "") {
		return "";
	}
	if (path.startsWith("/")) {
		return path;
	}
	return "/" + path;
}

/**
 * Join two paths.
 *
 * @param parent The parent path.
 * @param child The child path.
 * @returns A {@link normalize normalized} path.
 */
export function join(parent: string, child: string): string {
	parent = normalize(parent);
	if (parent.endsWith("/")) {
		parent = parent.slice(0, -1);
	}
	return parent + normalize(child);
}
