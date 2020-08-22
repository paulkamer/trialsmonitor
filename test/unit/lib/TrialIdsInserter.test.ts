import { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';

import db from '../../../src/lib/Db';
import TrialIdsInserter from '../../../src/TrialIdsInserter';

describe('TrialIdsInserter', () => {
  const trialIds = ['NTC001', 'NCT002'];

  let dbHelperStub: SinonStub;
  let inserter: TrialIdsInserter;

  context('Valid input', () => {
    before(() => {
      dbHelperStub = sinon.stub(db, 'insertTrialId').returns(Promise.resolve(true));
    });

    it('inserts trials', async () => {
      inserter = new TrialIdsInserter(db);
      const result = await inserter.insertTrials(trialIds);

      expect(result).to.eql([true, true]);
    });

    after(() => {
      dbHelperStub.restore();
    });
  });

  context('Invalid input', () => {
    const invalidTrialIds: any[] = [{}, 12345];

    before(() => {
      dbHelperStub = sinon.stub(db, 'insertTrialId').returns(Promise.resolve(false));
    });

    // Test invalid trials.
    it('Handles invalid trials', async () => {
      inserter = new TrialIdsInserter(db);
      const result = await inserter.insertTrials(invalidTrialIds);

      expect(result).to.eql([false, false]);
    });

    after(() => {
      dbHelperStub.restore();
    });
  });
});
