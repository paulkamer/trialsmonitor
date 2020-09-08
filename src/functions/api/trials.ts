import { APIGatewayEvent } from 'aws-lambda';

import logger from '../../lib/logger';
import config from '../../config';
import db from '../../lib/Db';
import { Trial, TrialId } from '../../../types';

/**
 * Get a single trial
 */
const get = async (event: APIGatewayEvent) => {
  logger.debug('trials#get');

  const trialId = event.pathParameters?.id;

  const results: Trial[] = [];
  if (!trialId) return formatResponse(results);

  try {
    await db.connect();
    const trial = await db.fetchTrial(trialId);
    if (trial) results.push(trial);
  } finally {
    await db.disconnect();
  }

  return formatResponse(results);
};

/**
 * Fetch a paginated list of trials
 */
const getAll = async (event?: APIGatewayEvent) => {
  logger.debug('trials#getAll');

  let trials: Trial[];
  let totalTrials = 0;
  const limit = Number(event?.queryStringParameters?.limit) || config.maxTrialsPerPage;
  const pageNumber = Number(event?.queryStringParameters?.pageNumber) || 1;

  try {
    await db.connect();
    trials = await db.listTrials(['trialId', 'title', 'lastUpdated', 'phase', 'acronym'], {
      orderBy: 'lastUpdated',
      sortDirection: 'desc',
      limit: Math.min(config.maxTrialsPerPage, Math.max(1, limit)),
      pageNumber: Math.max(1, pageNumber),
    });

    totalTrials = await db.countTrials();
  } finally {
    await db.disconnect();
  }

  return formatResponse(trials, { totalTrials, limit, pageNumber });
};

/**
 * Insert new trialId(s) to start monitoring them.
 */
const createTrial = async (event: APIGatewayEvent) => {
  logger.debug('trials#createTrial');

  const trialIds: TrialId[] = parseEventBody(event, 'trialIds') || [];

  let results: Array<boolean> = [];
  try {
    await db.connect();

    if (trialIds.length === 0) {
      logger.debug('[functionInsertTrial] No trial IDs received');
    } else {
      // Insert the trial IDs
      results = await db.insertTrialIds(trialIds);
    }
  } finally {
    await db.disconnect();
  }

  // Format & send response
  return formatResponse(results);
};

/**
 * Update a trial
 */
const updateTrial = async (event: APIGatewayEvent) => {
  logger.debug('trials#updateTrial');

  const trialId = event.pathParameters?.id;
  const trial: Trial | null = parseEventBody(event, 'trial');

  const results: Array<boolean> = [];
  if (!trial || !trialId) {
    logger.debug('[functionInsertTrial] No trial IDs received');
    return formatResponse(results);
  }

  try {
    await db.connect();
    const result = await db.updateTrial(trialId, trial);

    results.push(result);
  } finally {
    await db.disconnect();
  }

  // Format & send response
  return formatResponse(results);
};

/**
 * Delete a trial
 */
const deleteTrial = async (event?: APIGatewayEvent) => {
  logger.debug('trials#deleteTrial');

  const trialId: string = parseEventBody(event!, 'trialId');

  let results = 0;
  if (trialId) {
    try {
      await db.connect();

      results = await db.deleteTrials([trialId]);
    } finally {
      await db.disconnect();
    }
  }

  // Format & send response
  return formatResponse(Array(results).fill(true));
};

/**
 * Parse the event body as JSON and return the requested attribute
 */
function parseEventBody(event: APIGatewayEvent, key: string): any {
  try {
    if (typeof event.body === 'string') {
      return JSON.parse(event.body)[key];
    } else {
      throw new Error('Cannot parse event body');
    }
  } catch (e) {
    logger.error(e);
  }

  return undefined;
}

/**
 * Format response; determine if/how many failed.
 */
function formatResponse(results: any[], metadata = {}) {
  let statusCode = 200;
  if (results.length === 0) statusCode = 400;

  const body = {
    results_count: Object.keys(results).length,
    results: Object.values(results),
    ...metadata,
  };

  const response = {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': config.accessControlAllowOrigin,
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };

  return response;
}

export { get, getAll, createTrial, updateTrial, deleteTrial };
