import { extract, inject } from "../core/context.js";
import { Expression, Signal, get, sig, watch } from "../core/signals.js";
import { View, nest } from "../core/view.js";
import { ChildRouter } from "./child-router.js";
import { normalize } from "./path.js";
import { ROUTER } from "./router.js";

export interface RouteMatchFn {
	(path: string): string | [string, unknown] | undefined;
}

export interface Route {
	/**
	 * The paths this route matches.
	 */
	path?: string | RegExp | RouteMatchFn;
}

export interface ParentRouteMatch<T extends Route> {
	route: T;
	path: string;
	params: unknown;
}

export interface RouteMatch<T extends Route> extends ParentRouteMatch<T> {
	rest: string;
}

/**
 * Find the first matching route.
 *
 * @param path The {@link normalize normalized} path to match against. Non normalized paths result in undefined behavior.
 * @param routes The routes to test in order.
 * @returns A match or undefined if none of the routes matched.
 */
export function matchRoute<T extends Route>(path: string, routes: T[]): RouteMatch<T> | undefined {
	for (let i = 0; i < routes.length; i++) {
		const route = routes[i];
		if (typeof route.path === "string") {
			const test = route.path === "/" ? "" : route.path;
			if (test.endsWith("/")) {
				if (path.startsWith(test) || path === test.slice(0, -1)) {
					return {
						route,
						path: normalize(path.slice(0, test.length - 1)),
						params: undefined,
						rest: normalize(path.slice(test.length)),
					};
				}
			} else if (test === path) {
				return {
					route,
					path,
					params: undefined,
					rest: "",
				};
			}
		} else if (typeof route.path === "function") {
			const match = route.path(path);
			if (match !== undefined) {
				let matched: string;
				let params: unknown;
				if (Array.isArray(match)) {
					matched = normalize(match[0]);
					params = match[1];
				} else {
					matched = normalize(match);
					params = undefined;
				}
				let rest = path;
				if (path.startsWith(matched) && (path.length === matched.length || path[matched.length] === "/")) {
					rest = normalize(path.slice(matched.length));
				}
				return {
					route,
					path: matched,
					params,
					rest,
				};
			}
		} else if (route.path instanceof RegExp) {
			const match = route.path.exec(path);
			if (match !== null) {
				const matched = normalize(match[0], false);
				let rest = path;
				if (path.startsWith(matched) && (path.length === matched.length || path[matched.length] === "/")) {
					rest = normalize(path.slice(matched.length));
				}
				return {
					route,
					path: matched,
					params: match,
					rest,
				};
			}
		} else if (route.path === undefined) {
			return {
				route,
				path: "",
				params: undefined,
				rest: path,
			};
		} else {
			throw new Error("invalid path");
		}
	}
}

export class WatchedRoutes<T extends Route> {
	#match: Signal<ParentRouteMatch<T> | undefined>;
	#rest: Signal<string>;

	constructor(match: Signal<ParentRouteMatch<T> | undefined>, rest: Signal<string>) {
		this.#match = match;
		this.#rest = rest;
	}

	/**
	 * Access the route match.
	 */
	get match(): ParentRouteMatch<T> | undefined {
		return this.#match.value;
	}

	/**
	 * Access the rest path.
	 *
	 * This is set to an empty string if no route matched.
	 */
	get rest(): string {
		return this.#rest.value;
	}
}

/**
 * Watch and match routes against an expression.
 *
 * @param path The normalized path.
 * @param routes The routes to watch.
 */
export function watchRoutes<T extends Route>(path: Expression<string>, routes: T[]): WatchedRoutes<T> {
	const parent = sig<ParentRouteMatch<T> | undefined>(undefined);
	const rest = sig<string>(undefined!);
	watch(() => matchRoute(get(path), routes), match => {
		if (match) {
			if (!parent.value || parent.value.path !== match.path || parent.value.route !== match.route) {
				parent.value = match;
			}
			rest.value = match.rest;
		} else {
			parent.value = undefined;
			rest.value = "";
		}
	}, false);
	return new WatchedRoutes(parent, rest);
}

export interface ContentRoute extends Route {
	content: (params: unknown) => unknown;
}

export function routes(routes: ContentRoute[]): View {
	const router = extract(ROUTER);
	if (!router) {
		throw new Error("router not available");
	}
	const watched = watchRoutes(() => router.path, routes);
	return nest(() => {
		const match = watched.match;
		if (match) {
			return () => inject([ROUTER, new ChildRouter(router, match.path, () => watched.rest)], () => {
				return match.route.content(match.params);
			});
		}
	});
}
