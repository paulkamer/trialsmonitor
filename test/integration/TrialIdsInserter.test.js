require('dotenv').config({path: `${__dirname}/../../.env.test`});

const expect = require('chai').expect;
const { spawnSync } = require( 'child_process' );

const DbHelper = require('../../src/DbHelper');
const TrialIdsInserter = require('../../src/TrialIdsInserter');

describe('TrialIdsInserter', () => {
  // (re-)seed the local DB
  beforeEach(() =>{
    spawnSync( '/usr/bin/serverless', [ 'dynamodb', 'seed' ] );
  });

  const testTrialIds = ['NCT_TEST_001','NCT_TEST_002','NCT_TEST_003'];

  let dbHelper;
  let updater;

  context('insertTrials', () => {
    before(() => {
      dbHelper = new DbHelper();
    });

    it('Successfully updates a trial', async () => {
      updater = new TrialIdsInserter();
      const result = await updater.insertTrials(testTrialIds);

      expect(result).to.eql([true, true, true]);

      const trials = await dbHelper.fetchTrials(testTrialIds, ['id', 'lastUpdated']);
      expect(trials.map((t) => t.id.S)).to.include.members(testTrialIds);
      expect(trials[0].lastUpdated.N, 'lastUpdated should be initialized with 0').to.eq('0');
    });

    after(() => {
      // Delete inserted trial IDs again
      dbHelper.deleteTrials(testTrialIds);
    });
  });
});
