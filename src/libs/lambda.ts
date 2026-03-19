import middy from '@middy/core';
import { withRequestTracking } from '@leanstacks/lambda-utils';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { logger } from '@/utils/logger';

/**
 * Standard API Gateway Lambda handler signature.
 */
export type ApiGatewayHandler = (
  event: APIGatewayProxyEvent,
  context: Context,
) => Promise<APIGatewayProxyResult>;

type ApiGatewayMiddleware<TEvent extends APIGatewayProxyEvent> = middy.MiddlewareObj<TEvent, APIGatewayProxyResult>;

/**
 * Creates a Middy middleware that adds request tracking and entry logging.
 *
 * @param handlerName The logical handler name for structured logging.
 * @returns Middy middleware object.
 */
const requestTrackingMiddleware = (
  handlerName: string,
): ApiGatewayMiddleware<APIGatewayProxyEvent> => ({
  before: async (request): Promise<void> => {
    withRequestTracking(request.event, request.context);
    logger.info({ event: request.event, context: request.context }, `[${handlerName}] > handler`);
  },
});

/**
 * Wrap a Lambda handler with Middy and common middleware.
 *
 * @param handlerName The logical handler name for structured logging.
 * @param lambdaHandler The core Lambda handler implementation.
 * @returns Middy-wrapped handler.
 */
export const middyfy = <TEvent extends APIGatewayProxyEvent = APIGatewayProxyEvent>(
  handlerName: string,
  lambdaHandler: (event: TEvent, context: Context) => Promise<APIGatewayProxyResult>,
  middlewares: ApiGatewayMiddleware<TEvent>[] = [],
): ((event: TEvent, context: Context) => Promise<APIGatewayProxyResult>) => {
  const middyHandler = middy<TEvent, APIGatewayProxyResult>()
    .use(requestTrackingMiddleware(handlerName) as ApiGatewayMiddleware<TEvent>);

  middlewares.forEach((middleware) => {
    middyHandler.use(middleware);
  });

  return middyHandler.handler(lambdaHandler);
};
