import { extract, inject } from "../core/context.js";
import { nest } from "../core/view.js";
import { ChildRouter } from "./child-router.js";
import { Route, watchRoutes } from "./route.js";
import { ROUTER } from "./router.js";

export interface ComponentRoute extends Route {
	content: (props: { params: unknown }) => unknown;
}

export function Routes(props: {
	routes: ComponentRoute[];
}): unknown {
	const router = extract(ROUTER);
	if (!router) {
		throw new Error("router not available");
	}
	const watched = watchRoutes(() => router.path, props.routes);
	return nest(() => {
		const match = watched.match;
		if (match) {
			return () => inject(ROUTER, new ChildRouter(router, match.path, () => watched.rest), () => {
				return match.route.content({ params: match.params });
			});
		}
	});
}
