import { URLOptions } from './url-options.model';

export interface IStaticRouteOptions extends URLOptions {
    folder?: string;
    file?: string;
}