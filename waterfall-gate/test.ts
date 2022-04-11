import { AbstractRouter, ServerConnectionConfig, WaterfallGateService } from './index';

const connection: ServerConnectionConfig = {
    port: 1234,
    ssl: {
        keyPath: '../key.pem',
        certPath: '../cert.pem'
    }
};

class Router extends AbstractRouter {
    initRoutes() {
        this.get({
            url: '/api/test',
            callback: this.test.bind(this)
        });
    }

    private test() {
        return Promise.resolve('ok');
    }
}

const instance: WaterfallGateService = WaterfallGateService.getInstance();

instance.registerRouter(Router);
instance.init(connection);