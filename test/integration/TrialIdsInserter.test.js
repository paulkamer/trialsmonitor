const expect = require('chai').expect;

require('dotenv').config({ path: `${__dirname}/../../test.env` });
const { seedDb } = require('./dbHelper');

const DbHelper = require('../../src/lib/Db');
const TrialIdsInserter = require('../../src/TrialIdsInserter');

describe('TrialIdsInserter', () => {
  // (re-)seed the local DB
  beforeEach(async () => {
    await seedDb();
  });

  const testTrialIds = ['NCT_TEST_001', 'NCT_TEST_002', 'NCT_TEST_003'];

  let dbHelper;
  let updater;
  context('insertTrials', () => {
    before(async () => {
      dbHelper = new DbHelper();
      await dbHelper.connect();
    });

    after(async () => {
      await dbHelper.disconnect();
    });

    it('Successfully updates a trial', async () => {
      updater = new TrialIdsInserter(dbHelper);
      const result = await updater.insertTrials(testTrialIds);

      expect(result).to.eql([true, true, true]);

      const trials = await dbHelper.listTrials();

      expect(trials.map(t => t.trialId)).to.include.members(testTrialIds);
      expect(
        trials.find(t => t.trialId === testTrialIds[0]).lastUpdated,
        'lastUpdated should be initialized with 0'
      ).to.eq(0);
    });
  });
});
