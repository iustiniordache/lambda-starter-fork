import { badRequest } from '@leanstacks/lambda-utils';
import type middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { ZodType } from 'zod';

import { defaultResponseHeaders } from '@/utils/constants';
import { logger } from '@/utils/logger';

/**
 * API Gateway event augmented with a parsed and validated request body.
 */
export type ParsedBodyEvent<TBody> = APIGatewayProxyEvent & {
  parsedBody: TBody;
};

type RequireJsonBodyOptions<TBody, TEvent extends APIGatewayProxyEvent> = {
  handlerName: string;
  schema: ZodType<TBody>;
  assignToEvent: (event: TEvent, value: TBody) => void;
};

/**
 * Creates middleware that parses JSON request bodies and validates them with Zod.
 *
 * @param options Middleware configuration.
 * @returns Middy middleware object.
 */
export const requireJsonBody = <TBody, TEvent extends APIGatewayProxyEvent = ParsedBodyEvent<TBody>>(
  options: RequireJsonBodyOptions<TBody, TEvent>,
): middy.MiddlewareObj<TEvent, APIGatewayProxyResult> => ({
  before: async (request): Promise<APIGatewayProxyResult | void> => {
    const { event } = request;

    if (!event.body) {
      logger.warn(`[${options.handlerName}] < handler - missing request body`);
      request.response = badRequest('Request body is required', defaultResponseHeaders);
      return request.response;
    }

    let requestBody: unknown;
    try {
      requestBody = JSON.parse(event.body);
    } catch (_error) {
      logger.warn(`[${options.handlerName}] < handler - invalid JSON in request body`);
      request.response = badRequest('Invalid JSON in request body', defaultResponseHeaders);
      return request.response;
    }

    const parsedResult = options.schema.safeParse(requestBody);

    if (!parsedResult.success) {
      const errorMessages = parsedResult.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      logger.warn(
        {
          errors: parsedResult.error.issues,
        },
        `[${options.handlerName}] < handler - validation error`,
      );
      request.response = badRequest(`Validation failed: ${errorMessages}`, defaultResponseHeaders);
      return request.response;
    }

    options.assignToEvent(request.event, parsedResult.data);
  },
});
