import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { internalServerError, noContent, notFound } from '@leanstacks/lambda-utils';

import { defaultResponseHeaders } from '@/utils/constants';
import { deleteTask } from '@/services/task-service';
import { logger } from '@/utils/logger';
import { middyfy } from '@/libs/lambda';
import { notFoundResponse, PathParamEvent, requirePathParam } from '@/middlewares';

type DeleteTaskEvent = PathParamEvent<'taskId'>;

/**
 * Lambda handler for deleting a task by ID
 * Handles DELETE requests from API Gateway to delete a specific task from DynamoDB
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result with 204 status on success or error message
 */
const baseHandler = async (event: DeleteTaskEvent, _context: Context): Promise<APIGatewayProxyResult> => {
  try {
    // Delete the task
    const deleted = await deleteTask(event.taskId);

    // Check if the task was found and deleted
    if (!deleted) {
      logger.info({ taskId: event.taskId }, '[DeleteTaskHandler] < handler - task not found');
      return notFound('Task not found', defaultResponseHeaders);
    }

    // Return no content response
    logger.info({ taskId: event.taskId }, '[DeleteTaskHandler] < handler - successfully deleted task');
    return noContent(defaultResponseHeaders);
  } catch (error) {
    // Handle unexpected errors
    logger.error({ error }, '[DeleteTaskHandler] < handler - failed to delete task');
    return internalServerError('Failed to delete task', defaultResponseHeaders);
  }
};

export const handler = middyfy('DeleteTaskHandler', baseHandler, [
  requirePathParam<DeleteTaskEvent, 'taskId'>({
    handlerName: 'DeleteTaskHandler',
    paramName: 'taskId',
    missingLogMessage: 'missing taskId path parameter',
    responseFactory: () => notFoundResponse('Task not found'),
    assignToEvent: (event, value) => {
      event.taskId = value;
    },
  }),
]);
