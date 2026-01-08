import type { ResponseSchema, RouterContext } from '@rocket.chat/http-router';
import { Router } from '@rocket.chat/http-router';

import type { TypedOptions } from './definition';

declare module 'hono' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ContextVariableMap {
		'route': string;
		'bodyParams-override'?: Record<string, any>;
	}
}

export type APIActionContext = {
	requestIp: string;
	urlParams: Record<string, string>;
	queryParams: Record<string, any>;
	bodyParams: Record<string, any>;
	request: Request;
	path: string;
	response: any;
	route: string;
};

export type APIActionHandler = (this: APIActionContext, request: Request) => Promise<ResponseSchema<TypedOptions>>;

export class RocketChatAPIRouter<
	TBasePath extends string,
	TOperations extends {
		[x: string]: unknown;
	} = NonNullable<unknown>,
> extends Router<TBasePath, TOperations, APIActionHandler> {
	protected override convertActionToHandler<TOptions extends TypedOptions>(
		action: APIActionHandler,
		_options: TOptions,
	): (c: RouterContext) => Promise<ResponseSchema<TOptions>> {
		return async (c: RouterContext): Promise<ResponseSchema<TOptions>> => {
			const request = c.req.raw.clone();

			const context: APIActionContext = {
				requestIp: c.get('remoteAddress'),
				urlParams: c.req.param(),
				queryParams: c.get('queryParams'),
				bodyParams: c.get('bodyParams'),
				request,
				path: c.req.path,
				response: c.res,
				route: c.req.routePath,
			};

			return action.apply(context, [request]) as Promise<ResponseSchema<TOptions>>;
		};
	}
}

export type ExtractRouterEndpoints<TRoute extends RocketChatAPIRouter<any, any>> =
	TRoute extends RocketChatAPIRouter<any, infer TOperations> ? TOperations : never;
