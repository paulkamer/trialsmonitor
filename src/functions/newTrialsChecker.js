const NewTrialsSearcher = require('../NewTrialsChecker');
const { logger } = require('../lib/logger');

/**
 * Find new trials, using the stored search queries in the "seaches_<env>"
 * table, and insert new ones in the trials DB
 */
const handle = async () => {
  const searcher = new NewTrialsSearcher();
  const result = await searcher.findAndAddNewTrials();

  logger.debug('NewTrialsSearcher result', result);

  return result;
};

module.exports = { handle };
