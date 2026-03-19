import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { created, internalServerError } from '@leanstacks/lambda-utils';

import { defaultResponseHeaders } from '@/utils/constants';
import { middyfy } from '@/libs/lambda';
import { CreateTaskDto, CreateTaskDtoSchema } from '@/models/create-task-dto';
import { createTask } from '@/services/task-service';
import { logger } from '@/utils/logger';
import { ParsedBodyEvent, requireJsonBody } from '@/middlewares';

type CreateTaskEvent = ParsedBodyEvent<CreateTaskDto>;

/**
 * Lambda handler for creating a new task
 * Handles POST requests from API Gateway to create a task in DynamoDB
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result with created task or error message
 */
const baseHandler = async (event: CreateTaskEvent, _context: Context): Promise<APIGatewayProxyResult> => {
  try {
    // Create the task
    const task = await createTask(event.parsedBody);

    logger.info(
      {
        id: task.id,
      },
      '[CreateTaskHandler] < handler - successfully created task',
    );
    // Return created response with the new task
    return created(task, defaultResponseHeaders);
  } catch (error) {
    // Handle other errors
    logger.error({ error }, '[CreateTaskHandler] < handler - failed to create task');
    return internalServerError('Failed to create task', defaultResponseHeaders);
  }
};

export const handler = middyfy('CreateTaskHandler', baseHandler, [
  requireJsonBody<CreateTaskDto, CreateTaskEvent>({
    handlerName: 'CreateTaskHandler',
    schema: CreateTaskDtoSchema,
    assignToEvent: (event, value) => {
      event.parsedBody = value;
    },
  }),
]);
