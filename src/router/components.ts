import { nest } from "../core/index.js";
import { ChildRouter } from "./child-router.js";
import { Route, watchRoutes } from "./route.js";
import { Router, getRouter, useRouter } from "./router.js";

export interface ComponentRoute extends Route {
	content: (props: { params: unknown }) => unknown;
}

export function Routes(props: {
	routes: ComponentRoute[];
}): unknown {
	const router = getRouter();
	const watched = watchRoutes(() => router.path, props.routes);
	return nest(() => {
		const match = watched.match;
		if (match) {
			return () => {
				return useRouter(new ChildRouter(router, match.path, () => watched.rest), () => {
					return match.route.content({ params: match.params });
				});
			};
		}
	});
}

export function UseRouter(props: {
	router: Router;
	children: () => unknown;
}): unknown {
	return useRouter(props.router, props.children);
}
