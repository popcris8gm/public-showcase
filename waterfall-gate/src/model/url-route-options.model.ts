import { Request, Response } from 'express';
import { HTTPMiddleware } from 'seed-of-rain';

import { URLOptions } from './url-options.model';

export interface URLRouteOptions extends URLOptions {
    callback: (request: Request) => Promise<any>;
	middleware?: Array<HTTPMiddleware>;
	successStatusCode?: number;
	errorStatusCode?: number
}