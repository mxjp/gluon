
/**
 * Normalize a path:
 * + Empty paths are represented as an empty string.
 * + Non-empty paths start with a slash.
 *
 * @param path The path to normalize.
 * @param preserveDir True to keep trailing slashes.
 * @returns The normalized path.
 */
export function normalize(path: string, preserveDir = true) {
	if (path === "/" || path === "") {
		return "";
	}
	if (!preserveDir && path.endsWith("/")) {
		path = path.slice(0, path.length - 1);
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
 * @param preserveDir True to keep trailing slashes from the child path.
 * @returns A {@link normalize normalized} path.
 */
export function join(parent: string, child: string, preserveDir = true): string {
	parent = normalize(parent);
	if (parent.endsWith("/")) {
		parent = parent.slice(0, -1);
	}
	return parent + normalize(child, preserveDir);
}
