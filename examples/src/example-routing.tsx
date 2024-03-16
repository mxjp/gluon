import { Inject, extract, sig } from "@mxjp/gluon";
import { QueryInit, ROUTER, Router, Routes, normalize } from "@mxjp/gluon/router";
import { Box } from "./components/box";
import { Button } from "./components/button";
import { Row } from "./components/row";

let nextCycle = 0;

function ContextInfo() {
	const router = extract(ROUTER)!;
	const cycle = nextCycle++;
	return <div>path={() => router.path || "/"} cycle={cycle}</div>;
}

function Link(props: {
	path: string;
}) {
	const router = extract(ROUTER)!;
	return <Button action={() => {
		router.push(props.path);
	}}>
		{props.path ?? "/"}
	</Button>;
}

export function example() {
	return <Inject key={ROUTER} value={new CustomRouter()}>
		{() => <>
			<div>This example demonstrates gluon's standard routing using a custom router implementation.</div>
			<div>The green boxes indicate different routing contexts and the cycles indicate when elements are re-rendered.</div>
			<Box>
				<ContextInfo />
				<Row>
					<Link path="/" />
					<Link path="/foo" />
					<Link path="/bar" />
				</Row>
				<Box>
					<Routes routes={[
						{
							path: "/foo/",
							content: () => <>
								<ContextInfo />
								<Row>
									<Link path="/" />
									<Link path="/a" />
									<Link path="/b" />
								</Row>
							</>,
						},
						{
							path: "",
							content: () => <>
								Home
								<ContextInfo />
							</>,
						},
						{
							content: () => "Fallback",
						},
					]} />
				</Box>
			</Box>
		</>}
	</Inject>;
}

class CustomRouter implements Router {
	#path = sig("");

	get root(): Router {
		return this;
	}

	get parent(): Router | undefined {
		return undefined;
	}

	get path(): string {
		return this.#path.value;
	}

	get query(): URLSearchParams | undefined {
		return undefined;
	}

	push(path: string, query?: QueryInit): void {
		this.#path.value = normalize(path);
	}

	replace(path: string, query?: QueryInit): void {
		this.push(path, query);
	}
}
