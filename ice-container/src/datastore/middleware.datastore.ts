import { DatastoreMiddleware } from 'seed-of-crystal';

export abstract class MiddlewareDatastore<T> {
    private middlewares: Array<DatastoreMiddleware<T>> = new Array<DatastoreMiddleware<T>>();

    protected runCreateMiddlewares(model: T): void {
        this.middlewares.forEach((middleware) => {
            middleware.onCreate(model);
        });
    }

    protected runPreCheckMiddleware(options) {
        const newOptions = {};

        this.middlewares.forEach((middleware) => {
            middleware.onPreCheck(options, newOptions);
        });

        return newOptions;
    }

    protected runPostCheckMiddleware(model: T, options): boolean {
        let verdict: boolean = true;

        this.middlewares.forEach((middleware) => {
            verdict = verdict && middleware.onPostCheck(model, options);
        });

        return verdict;
    }

    protected addMiddleware(middleware) {
        this.middlewares.push(middleware)
    }
}