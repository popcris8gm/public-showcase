import { Router, Request, Response } from 'express';
import {
	HTTPMiddleware,
	HTTPRequestMiddlewareHandler,
	HTTPResponseMiddlewareHandler,
	LifecycleError,
	LifecycleSuccessResponse,
	LifecycleErrorResponse
} from 'seed-of-rain';
import { chroma } from 'chroma-skin';

import { URLRouteOptions } from '../model/url-route-options.model';
import { IStaticRouteOptions } from '../model/static-route-options.model';
import { RouteMap } from '../enforcer/route-map.enforcer';

import { MethodType } from '../model/enum/method-type.enum';

import * as Express from 'express';

export abstract class AbstractRouter {
	protected router: Router;
	private readonly routeMap: RouteMap;

	constructor(routeMap: RouteMap) {
		this.routeMap = routeMap;
	}

	/**
	 * Configure GET request.
	 */
	protected get(options: URLRouteOptions): void {
		const handlers: Array<any> = this.decorateRequestCallback(MethodType.GET, options);
		this.router.get.apply(this.router, [options.url, ...handlers]);
	}

	/**
	 * Configure POST request.
	 */
	protected post(options: URLRouteOptions): void {
		const handlers: Array<any> = this.decorateRequestCallback(MethodType.POST, options);
		this.router.post.apply(this.router, [options.url, ...handlers]);
	}

	/**
	 * Configure PUT request.
	 */
	protected put(options: URLRouteOptions): void {
		const handlers: Array<any> = this.decorateRequestCallback(MethodType.PUT, options);
		this.router.put.apply(this.router, [options.url, ...handlers]);
	}

	/**
	 * Configure DELETE request.
	 */
	protected delete(options: URLRouteOptions): void {
		const handlers: Array<any> = this.decorateRequestCallback(MethodType.DELETE, options);
		this.router.delete.apply(this.router, [options.url, ...handlers]);
	}

	// @Deprecated
	protected use(options: IStaticRouteOptions): void {
		if (options.folder) {
			this.router.use('/', Express.static(options.folder));
		} else if (options.file) {
			chroma.redLight('TODO: Waterfall-Gata - add middleware vaidators to static routes.')
			this.router.use(options.url, (request: Request, response: Response) => {
				response.sendfile(options.file);
			});
		} else {
			chroma.yellow('Waterfall-Gata .use function used without folder and file attributes. At least one must be provided.')
		}
	}

	public init(router: Router) {
		this.router = router;
		this.initRoutes();
	}

	protected abstract initRoutes(): void;

	private decorateRequestCallback(methodType: MethodType, options: URLRouteOptions): Array<HTTPRequestMiddlewareHandler> {
		this.routeMap.addRouteRule(methodType, options.url);

		let handlers: Array<HTTPRequestMiddlewareHandler> = new Array<HTTPRequestMiddlewareHandler>();

		// handlers.push(Express.json({ limit: `${config.sizeLimit}mb` }));
		handlers.push(Express.json());
		// TODO: Validators
		handlers = this.decorateRequestMiddleware(handlers, options);
		handlers = this.decorateRequestHandler(handlers, options);

		return handlers;
	}

	private decorateRequestMiddleware(handlers: Array<HTTPRequestMiddlewareHandler>, options: URLRouteOptions): Array<HTTPRequestMiddlewareHandler> {
		if (options.middleware) {
			options.middleware.forEach((middleware: HTTPMiddleware) => {
				if (middleware.getRequestMiddleware) {
					const middlewareHandler: HTTPRequestMiddlewareHandler | Array<HTTPRequestMiddlewareHandler> = middleware.getRequestMiddleware();

					if (Array.isArray(middlewareHandler)) {
						handlers = handlers.concat(middlewareHandler);
					} else {
						handlers.push(middlewareHandler);
					}
				}
			});
		}

		return handlers;
	}

	private decorateRequestHandler(handlers: Array<HTTPRequestMiddlewareHandler>, options: URLRouteOptions): Array<HTTPRequestMiddlewareHandler> {
		const responseHandlers: Array<HTTPResponseMiddlewareHandler> = this.decorateResponseMiddleware(options);
		const handler: HTTPRequestMiddlewareHandler = (request: Request, response: Response) => {
			try {
				const promise: Promise<any> = options.callback(request);
				promise.then(this.replySuccess(request, response, responseHandlers), this.replyFail(request, response, responseHandlers));
			} catch (error) {
				this.replayError(response, error);
			}
		};

		handlers.push(handler);

		return handlers;
	}

	private decorateResponseMiddleware(options: URLRouteOptions): Array<HTTPResponseMiddlewareHandler> {
		const handlers: Array<HTTPResponseMiddlewareHandler> = new Array<HTTPResponseMiddlewareHandler>();

		if (options.middleware) {
			options.middleware.forEach((middleware: HTTPMiddleware) => {
				if (middleware.getResponseMiddleware) {
					handlers.push(middleware.getResponseMiddleware());
				}
			});
		}

		return handlers;
	}

	private replySuccess(request, response: Response, handlers: Array<HTTPResponseMiddlewareHandler>) {
		return (data: any) => {
			let result = data;

			if (handlers) {
				if (result.success === true && result.result) {
					handlers.forEach((handler: HTTPResponseMiddlewareHandler) => {
						result = handler(result, response, request);
					});
				} else {
					handlers.forEach((handler: HTTPResponseMiddlewareHandler) => {
						result = handler(result, response, request);
					});
				}
			}

			response.status(200).json(result);

			// if (data instanceof HeaderResponse) {
			// 	let allowedHeaders = '';

			// 	(data as HeaderResponse).headers.forEach((header: HeaderResponseItem) => {
			// 		allowedHeaders += `${header.key},`;
			// 		response.setHeader(header.key, header.value);
			// 	});

			// 	response.setHeader('Access-Control-Expose-Headers', allowedHeaders);
			// 	result = data.data;
			// }

			// // const date: Date = new Date();
			// // date.setSeconds(date.getSeconds() + 10);

			// // response.cookie('magic2', 'magic-value', {
			// // 	httpOnly: true,
			// // 	// secure: true,
			// // 	// maxAge: 10000,
			// // 	expires: date
			// // });
			// response.status(options.successStatusCode || 200).json(returnData);

			// this.performanceService.stop();
		}
	}

	private replyFail(request, response: Response, handlers: Array<HTTPResponseMiddlewareHandler>) {
		return (data: any) => {
			let result = data;

			if (handlers) {
				handlers.forEach((handler: HTTPResponseMiddlewareHandler) => {
					result = handler(result, response, request);
				});
			}

			response.status(500).json(result);
			// let returnData = data;

			// if (data instanceof HeaderResponse) {
			// 	let allowedHeaders = '';

			// 	(data as HeaderResponse).headers.forEach((header: HeaderResponseItem) => {
			// 		allowedHeaders += `${header.key},`;
			// 		response.setHeader(header.key, header.value);
			// 	});

			// 	response.setHeader('Access-Control-Expose-Headers', allowedHeaders);
			// 	returnData = data.data;
			// }
			
			// response.status(options.errorStatusCode || 500).json(returnData);
		}
	}

	private replayError(response: Response, error: LifecycleError) {
		const result: LifecycleErrorResponse = {
			success: false,
			error: {
				code: error.code,
				message: error.message
			}
		};

		response.status(200).json(result);
	}
}
