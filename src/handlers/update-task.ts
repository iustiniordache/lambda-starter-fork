import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { internalServerError, notFound, ok } from '@leanstacks/lambda-utils';

import { defaultResponseHeaders } from '@/utils/constants';
import { middyfy } from '@/libs/lambda';
import { UpdateTaskDto, UpdateTaskDtoSchema } from '@/models/update-task-dto';
import { updateTask } from '@/services/task-service';
import { logger } from '@/utils/logger';
import { ParsedBodyEvent, PathParamEvent, badRequestResponse, requireJsonBody, requirePathParam } from '@/middlewares';

type UpdateTaskEvent = ParsedBodyEvent<UpdateTaskDto> & PathParamEvent<'taskId'>;

/**
 * Lambda handler for updating an existing task
 * Handles PUT requests from API Gateway to update a task in DynamoDB
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result with updated task or error message
 */
const baseHandler = async (event: UpdateTaskEvent, _context: Context): Promise<APIGatewayProxyResult> => {
  try {
    // Update the task
    const task = await updateTask(event.taskId, event.parsedBody);

    // Check if the task was found
    if (!task) {
      logger.info({ taskId: event.taskId }, '[UpdateTaskHandler] < handler - task not found');
      return notFound('Task not found', defaultResponseHeaders);
    }

    // Return ok response with the updated task
    logger.info({ id: task.id }, '[UpdateTaskHandler] < handler - successfully updated task');
    return ok(task, defaultResponseHeaders);
  } catch (error) {
    // Handle other unexpected errors
    logger.error({ error }, '[UpdateTaskHandler] < handler - failed to update task');
    return internalServerError('Failed to update task', defaultResponseHeaders);
  }
};

export const handler = middyfy('UpdateTaskHandler', baseHandler, [
  requirePathParam<UpdateTaskEvent, 'taskId'>({
    handlerName: 'UpdateTaskHandler',
    paramName: 'taskId',
    missingLogMessage: 'missing taskId',
    responseFactory: () => badRequestResponse('Task ID is required'),
    assignToEvent: (event, value) => {
      event.taskId = value;
    },
  }),
  requireJsonBody<UpdateTaskDto, UpdateTaskEvent>({
    handlerName: 'UpdateTaskHandler',
    schema: UpdateTaskDtoSchema,
    assignToEvent: (event, value) => {
      event.parsedBody = value;
    },
  }),
]);
