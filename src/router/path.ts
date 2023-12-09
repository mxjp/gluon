
/**
 * Normalize a path:
 * + Empty paths are represented as an empty string.
 * + Non-empty paths start with a slash.
 *
 * @param path The path to normalize.
 * @returns The normalized path.
 */
export function normalizePath(path: string) {
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
 * @returns A {@link normalizePath normalized} path.
 */
export function joinPath(parent: string, child: string): string {
	parent = normalizePath(parent);
	if (parent.endsWith("/")) {
		parent = parent.slice(0, -1);
	}
	return parent + normalizePath(child);
}
