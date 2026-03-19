import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { internalServerError, ok } from '@leanstacks/lambda-utils';

import { logger } from '@/utils/logger';
import { defaultResponseHeaders } from '@/utils/constants';
import { middyfy } from '@/libs/lambda';
import { listTasks } from '@/services/task-service';

/**
 * Lambda handler for listing all tasks
 * Handles GET requests from API Gateway to retrieve all tasks from DynamoDB
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result with list of tasks or error message
 */
const baseHandler = async (_event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> => {
  try {
    // Retrieve the list of tasks
    const tasks = await listTasks();

    // Return ok response with the list of tasks
    logger.info({ count: tasks.length }, '[ListTasksHandler] < handler - successfully retrieved tasks');
    return ok(tasks, defaultResponseHeaders);
  } catch (error) {
    // Handle unexpected errors
    logger.error({ error }, '[ListTasksHandler] < handler - failed to list tasks');
    return internalServerError('Failed to retrieve tasks', defaultResponseHeaders);
  }
};

export const handler = middyfy('ListTasksHandler', baseHandler);
