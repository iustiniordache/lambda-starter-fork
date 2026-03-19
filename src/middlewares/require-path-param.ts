import type middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { logger } from '@/utils/logger';

/**
 * API Gateway event augmented with a required path parameter mapped onto the event.
 */
export type PathParamEvent<TParamName extends string> = APIGatewayProxyEvent & {
  [K in TParamName]: string;
};

type ResponseFactory = () => APIGatewayProxyResult;

type RequirePathParamOptions<TEvent extends APIGatewayProxyEvent, TParamName extends string> = {
  handlerName: string;
  paramName: TParamName;
  missingLogMessage: string;
  responseFactory: ResponseFactory;
  assignToEvent: (event: TEvent, value: string) => void;
};

/**
 * Creates middleware that requires a path parameter and maps it onto the event.
 *
 * @param options Middleware configuration.
 * @returns Middy middleware object.
 */
export const requirePathParam = <TEvent extends APIGatewayProxyEvent, TParamName extends string>(
  options: RequirePathParamOptions<TEvent, TParamName>,
): middy.MiddlewareObj<TEvent, APIGatewayProxyResult> => ({
  before: async (request): Promise<APIGatewayProxyResult | void> => {
    const paramValue = request.event.pathParameters?.[options.paramName];

    if (!paramValue) {
      logger.warn(`[${options.handlerName}] < handler - ${options.missingLogMessage}`);
      request.response = options.responseFactory();
      return request.response;
    }

    options.assignToEvent(request.event, paramValue);
  },
});
