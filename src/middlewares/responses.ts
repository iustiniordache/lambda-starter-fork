import { badRequest, notFound } from '@leanstacks/lambda-utils';
import type { APIGatewayProxyResult } from 'aws-lambda';

import { defaultResponseHeaders } from '@/utils/constants';

/**
 * Convenience factory for 400 Bad Request responses used by middleware.
 *
 * @param message Error message.
 * @returns API Gateway proxy result.
 */
export const badRequestResponse = (message: string): APIGatewayProxyResult => {
  return badRequest(message, defaultResponseHeaders);
};

/**
 * Convenience factory for 404 Not Found responses used by middleware.
 *
 * @param message Error message.
 * @returns API Gateway proxy result.
 */
export const notFoundResponse = (message: string): APIGatewayProxyResult => {
  return notFound(message, defaultResponseHeaders);
};
