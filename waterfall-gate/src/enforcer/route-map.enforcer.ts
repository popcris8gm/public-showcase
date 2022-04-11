import { chroma } from 'chroma-skin';
import { pathToRegexp } from 'path-to-regexp';

import { URLRegexp } from '../model/enforcer/url-regexp.model';

import { MethodType } from '../model/enum/method-type.enum';

export class RouteMap {
    private map: Record<MethodType, Array<URLRegexp>> = {
        [MethodType.GET]: new Array<URLRegexp>(),
        [MethodType.POST]: new Array<URLRegexp>(),
        [MethodType.PUT]: new Array<URLRegexp>(),
        [MethodType.DELETE]: new Array<URLRegexp>()
    };

    public addRouteRule(methodType: MethodType, url: string) {
        const list: Array<URLRegexp> = this.map[methodType];

        for (let i = 0; i < list.length; i++) {
            if (list[i].regex.test(url)) {
                chroma.yellow(`Warning: Route ${url} of type ${MethodType[methodType]} matched with ${list[i].url}`);
                break;
            }
        }

        list.push({
            url: url,
            regex: pathToRegexp(url)
        });
    }
}