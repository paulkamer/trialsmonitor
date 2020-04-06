const DbHelper = require('../src/DbHelper');

const { logger } = require('../lib/logger');

/**
 * List trials
 *
 * @todo support requesting specific attributes of trials
 * @param {*} event
 */
const handle = async () => {
  logger.log('info', 'listTrials.handle');

  const trials = await fetchTrials();

  // Format & send response
  return formatResponse(trials);
};

/**
 * Fetch trials from the DB
 */
async function fetchTrials() {
  const db = new DbHelper();

  return await db.listTrials(['id','title','lastUpdated','phase']);
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
    isBase64Encoded: false,
  };

  return response;
}

module.exports = { handle };
