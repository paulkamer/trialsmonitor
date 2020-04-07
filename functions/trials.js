const DbHelper = require('../src/DbHelper');

const { logger } = require('../lib/logger');

/**
 * List trials
 *
 * @todo support requesting specific attributes of trials
 * @param {*} event
 */
const getAll = async () => {
  logger.log('info', 'trials.getAll');

  const trials = await new DbHelper().listTrials(['id','title','lastUpdated','phase']);

  // Format & send response
  return formatResponse(trials);
};

/**
 * Delete a trial
 *
 * @param {*} event
 */
const deleteTrial = async (event) => {
  const trialId = extractTrialIdFromEvent(event);

  let results = [];

  if (trialId) {
    const db = new DbHelper();

    results = await db.deleteTrials([trialId]);
  }

  // Format & send response
  return formatResponse(results);
};

/**
 * Extract the trial ID from the event.
 *
 * @param {Object|String} event
 */
function extractTrialIdFromEvent(event) {
  let trialId;
  try {
    if (typeof event.body === 'string') {
      trialId = JSON.parse(event.body).trialId;
    } else if (event.body && event.body.trialId) {
      trialId = event.body.trialId;
    } else {
      throw new Error('Cannot parse event body');
    }
  } catch (e) {
    logger.error(e);
  }

  return trialId;
}

/**
 * Format response; determine if/how many failed.
 */
function formatResponse(results) {
  let statusCode = 200;

  if (results.length === 0) statusCode = 400;

  const response = {
    statusCode,
    body: JSON.stringify({
      results_count: Object.keys(results).length,
      results: Object.values(results),
    }),
  };

  return response;
}

module.exports = { getAll, deleteTrial };
