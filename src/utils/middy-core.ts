import type { Context } from 'aws-lambda';

type MiddlewareRequest<TEvent> = {
  event: TEvent;
  context: Context;
  response?: unknown;
};

type Middleware<TEvent, TResult> = {
  before?: (request: MiddlewareRequest<TEvent>) => Promise<TResult | void> | TResult | void;
};

type LambdaHandler<TEvent, TResult> = (event: TEvent, context: Context) => Promise<TResult> | TResult;

const middy = <TEvent, TResult>() => {
  const middlewares: Middleware<TEvent, TResult>[] = [];

  return {
    use(middleware: Middleware<TEvent, TResult>) {
      middlewares.push(middleware);
      return this;
    },
    handler(lambdaHandler: LambdaHandler<TEvent, TResult>) {
      return async (event: TEvent, context: Context): Promise<TResult> => {
        const request: MiddlewareRequest<TEvent> = { event, context };

        for (const middleware of middlewares) {
          const result = await middleware.before?.(request);

          if (result !== undefined) {
            request.response = result;
          }

          if (request.response !== undefined) {
            return request.response as TResult;
          }
        }

        return lambdaHandler(event, context);
      };
    },
  };
};

export default middy;
