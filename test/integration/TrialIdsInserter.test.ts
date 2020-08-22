import { expect } from 'chai';

require('dotenv').config({ path: `${__dirname}/../../test.env` });
import { seedDb } from './dbHelper';

import db from '../../src/lib/Db';
import TrialIdsInserter from '../../src/TrialIdsInserter';

describe('TrialIdsInserter', () => {
  // (re-)seed the local DB
  beforeEach(async () => {
    await seedDb();
  });

  const testTrialIds = ['NCT_TEST_001', 'NCT_TEST_002', 'NCT_TEST_003'];

  let updater;
  context('insertTrials', () => {
    it('Successfully updates a trial', async () => {
      await db.connect();
      updater = new TrialIdsInserter(db);
      const result = await updater.insertTrials(testTrialIds);

      expect(result).to.eql([true, true, true]);

      const trials = await db.listTrials();

      expect(trials.map((t) => t.trialId)).to.include.members(testTrialIds);
      expect(
        trials.find((t) => t.trialId === testTrialIds[0])?.lastUpdated,
        'lastUpdated should be initialized with 0'
      ).to.eq(0);

      await db.disconnect();
    });
  });
});
