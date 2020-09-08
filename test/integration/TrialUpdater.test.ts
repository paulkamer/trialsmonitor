require('dotenv').config({ path: `${__dirname}/../../test.env` });

import sinon, { SinonStub } from 'sinon';
import { expect } from 'chai';

import db from '../../src/lib/Db';
import { seedDb } from './dbHelper';
import TrialUpdater from '../../src/TrialUpdater';
import ClinicalTrialsApi from '../../src/lib/ClinicalTrialsApi';
import Sinon from 'sinon';

describe('TrialUpdater', () => {
  beforeEach(async () => {
    await seedDb();
  });

  const testTrialId = 'NCT01023321';

  const testTrial = {
    Study: {
      ProtocolSection: {
        IdentificationModule: {
          NCTId: testTrialId,
          BriefTitle: 'Trial title',
          Acronym: 'Trial001',
        },
        DesignModule: {
          PhaseList: {
            Phase: ['Phase 2'],
          },
        },
        StatusModule: {
          OverallStatus: 'Completed',
          LastUpdateSubmitDate: 'August 11, 2010',
        },
      },
    },
  };

  let updater;
  let ClinicalTrialsApiStub: SinonStub;

  context('updateTrial', () => {
    // Still stub the ClinicalTrials.gov API, so there is no external dependency
    before(async () => {
      ClinicalTrialsApiStub = sinon.stub(ClinicalTrialsApi.prototype, 'fetchTrial');
      ClinicalTrialsApiStub.callsFake(() => {
        return Promise.resolve(testTrial);
      });
      await db.connect();
    });

    after(async () => {
      await db.disconnect();
      ClinicalTrialsApiStub.restore();
    });

    it('Successfully updates a trial', async () => {
      const oldTrial = await db.fetchTrial(testTrialId);

      expect(oldTrial.studyStatus).to.eq('In progress');
      expect(oldTrial.lastUpdated).to.eq(1);

      updater = new TrialUpdater(db);
      const result = await updater.updateTrial(testTrialId);

      expect(result).to.eq(true);

      const updatedTrial = await db.fetchTrial(testTrialId);

      expect(updatedTrial?.studyStatus).to.eq('Completed');
      expect(updatedTrial?.lastUpdated).to.eq(1281477600); // unix timestamp of "August 11, 2010"
    });
  });
});
