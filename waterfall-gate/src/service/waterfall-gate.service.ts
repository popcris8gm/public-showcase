import { chroma } from 'chroma-skin';
import { AbstractProvider, SandStormService } from 'sandstorm-trade';
import {HTTPPlatform, HTTPPlatformIdentifier} from 'seed-of-rain';

import { createServer } from 'http';
import * as https from 'https';
import { readFileSync } from 'fs';
import * as Express from 'express';

import { AbstractRouter } from '../router/abstract.router';

import { RouteMap } from '../enforcer/route-map.enforcer';
import { ServerConnectionConfig } from '../config/server-connection-config.model';

export class WaterfallGateService extends AbstractProvider implements HTTPPlatform {
	private static instance: WaterfallGateService;

	private readonly routeMap: RouteMap;

	private app: Express.Application;
	private cleanConfig: ServerConnectionConfig;
	private routers: Array<AbstractRouter>;

	public sharedServer: any;
	// private middlewares: Array<GlobalMiddlewareHandler>;

	private constructor() {
		super();
		this.routeMap = new RouteMap();
		this.routers = new Array<AbstractRouter>();
		// this.middlewares = new Array<GlobalMiddlewareHandler>();
	}

	public init(config: ServerConnectionConfig, shared: boolean = false) {
		this.cleanConfig = this.createCleanServerConnectionConfig(config);

		this.createApp();
		this.initRouters();
		this.startApp(config, shared);
	}

	public updateHost(host: string | Array<string>) {
		if (this.cleanConfig) {
			this.cleanConfig = {
				...this.cleanConfig,
				host
			}
		}
	}

	/**
	 * Register an instance of the AbstractRouter to be used once the server starts.
	 */
	public registerRouter(router: any): void {
		const instance: AbstractRouter = new router(this.routeMap);

		if (this.app) {
			this.initRouter(instance);
		} else {
			this.routers.push(instance);
		}
	}

	/**
	 * Get the app instance.
	 */
	public getServer(): any {
		return this.app;
	}

	/**
	 * Create a clean version of the config with all the missing values defaulted.
	 */
	private createCleanServerConnectionConfig(config: ServerConnectionConfig): ServerConnectionConfig {
		const cleanConfig: ServerConnectionConfig = {
			port: config.port,
			host: config.host || '*',
			sizeLimit: config.sizeLimit || 50,
			ssl: config.ssl
		};

		return cleanConfig;
	}

	/**
	 * Create the Express server with the default handlers required.
	 */
	private createApp(): void {
		this.app = Express();

		// this.app.use(Express.json({ limit: `${config.sizeLimit}mb` }));
		this.app.use(Express.urlencoded({ extended: true }));
		this.app.use((req, res, next) => {
			if (Array.isArray(this.cleanConfig.host)) {
				if (this.cleanConfig.host.includes(req.headers.origin)) {
					res.header('Access-Control-Allow-Origin', req.headers.origin);
				}
			} else {
				res.header('Access-Control-Allow-Origin', this.cleanConfig.host);
			}

            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
			chroma.red('Remove hardcoded headers');
			res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Royal-Flame, Royal-Time, Mobile-Header, Story');
			res.header('Access-Control-Allow-Credentials', "true");
            next();
        });
	}

	/**
	 * Start the server based on the configuration.
	 */
	private startApp(config: ServerConnectionConfig, shared: boolean): void {
		if (shared) {
			if (config.ssl) {
				chroma.red(`There is no support for secure and shared servers at this time.`);
			} else {
				this.startSharedApp(config);
			}
		} else {
			if (config.ssl) {
				this.startSecureApp(config);
			} else {
				this.startDefaultApp(config);
			}
		}
	}

	/**
	 * Start the server on the provided port.
	 */
	private startDefaultApp(config: ServerConnectionConfig): void {
		this.app.listen(config.port, () => {
			console.log(`Listening on port ${config.port}`);
		});
	}

	/**
	 * Start the server with HTTPS using the provided SSL key and cert.
	 */
	private startSecureApp(config: ServerConnectionConfig): void {
		try {
			const key = readFileSync(config.ssl.keyPath);
			const cert = readFileSync(config.ssl.certPath);
			const server = https.createServer({ key: key, cert: cert }, this.app);

			server.listen(config.port, () => {
				console.log(`Listening on port ${config.port}`);
			});
		} catch(e) {
			chroma.red('Wrong SSL keyPath or certPath');
			throw e;
		}
	}

	/**
	 * Start the server on the provided port with capability of reusing it with multiple
	 * handshakes. E.g. websockets
	 */
	private startSharedApp(config: ServerConnectionConfig): void {
		this.sharedServer = createServer(this.app);

		this.sharedServer.listen(config.port, () => {
			console.log(`Listening on port ${config.port}`);
		});
	}

	public addMiddleware(middleware: any): void {
		chroma.red(`@Syforce - This version of WaterfallGate is still in progress and doesn't support global middleware.`);
		return;
		if (this.app) {
			chroma.red(`Error adding the middleware as the server and routers have been already created.`);
		} else {
			// this.middlewares.push(middleware);
		}
	}

	/**
	 * Initialize all the registered routers.
	 */
	private initRouters(): void {
		this.routers.forEach((router: AbstractRouter) => {
			this.initRouter(router);
		});
	}

	/**
	 * Initialize the provided router.
	 */
	private initRouter(router: AbstractRouter) {
		router.init(this.app);
	}

	private static createInstance(): void {
		if (!WaterfallGateService.instance) {
			const sandStormService: SandStormService = SandStormService.getInstance();
			const instance: WaterfallGateService = sandStormService.getProvider(HTTPPlatformIdentifier.WATERFALL_GATE) as WaterfallGateService;

			if (instance) {
				WaterfallGateService.instance = instance;
			} else {
				WaterfallGateService.instance = new WaterfallGateService();
				sandStormService.setProvider(WaterfallGateService.instance, HTTPPlatformIdentifier.WATERFALL_GATE);
			}
		}
	}

	public static getInstance(): WaterfallGateService {
		this.createInstance();
		return this.instance;
	}
}
