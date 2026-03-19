import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { internalServerError, notFound, ok } from '@leanstacks/lambda-utils';

import { defaultResponseHeaders } from '@/utils/constants';
import { getTask } from '@/services/task-service';
import { logger } from '@/utils/logger';
import { middyfy } from '@/libs/lambda';
import { notFoundResponse, PathParamEvent, requirePathParam } from '@/middlewares';

type GetTaskEvent = PathParamEvent<'taskId'>;

/**
 * Lambda handler for retrieving a task by ID
 * Handles GET requests from API Gateway to retrieve a specific task from DynamoDB
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result with task or error message
 */
const baseHandler = async (event: GetTaskEvent, _context: Context): Promise<APIGatewayProxyResult> => {
  try {
    // Retrieve the task
    const task = await getTask(event.taskId);

    // Check if the task was found
    if (!task) {
      logger.info({ taskId: event.taskId }, '[GetTaskHandler] < handler - task not found');
      return notFound('Task not found', defaultResponseHeaders);
    }

    // Return ok response with the task
    logger.info({ taskId: event.taskId }, '[GetTaskHandler] < handler - successfully retrieved task');
    return ok(task, defaultResponseHeaders);
  } catch (error) {
    // Handle unexpected errors
    logger.error({ error }, '[GetTaskHandler] < handler - failed to get task');
    return internalServerError('Failed to retrieve task', defaultResponseHeaders);
  }
};

export const handler = middyfy('GetTaskHandler', baseHandler, [
  requirePathParam<GetTaskEvent, 'taskId'>({
    handlerName: 'GetTaskHandler',
    paramName: 'taskId',
    missingLogMessage: 'missing taskId path parameter',
    responseFactory: () => notFoundResponse('Task not found'),
    assignToEvent: (event, value) => {
      event.taskId = value;
    },
  }),
]);
