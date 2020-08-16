const expect = require('chai').expect;
const sinon = require('sinon');

require('dotenv').config({ path: `${__dirname}/../../test.env` });
const { seedDb } = require('./dbHelper');

const DbHelper = require('../../src/lib/Db');
const ClinicalTrialsApi = require('../../src/lib/ClinicalTrialsApi');
const TrialUpdater = require('../../src/TrialUpdater');

describe('TrialUpdater', () => {
  beforeEach(async () => {
    await seedDb();
  });

  const testTrialId = 'NCT01023321';

  const testTrial = {
    Study: {
      ProtocolSection: {
        IdentificationModule: {
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

  let dbHelper;
  let updater;
  let ClinicalTrialsApiStub;

  context('updateTrial', () => {
    // Still stub the ClinicalTrials.gov API, so there is no external dependency
    before(async () => {
      ClinicalTrialsApiStub = sinon.stub(ClinicalTrialsApi.prototype, 'fetchTrial');
      ClinicalTrialsApiStub.callsFake(() => {
        return Promise.resolve(testTrial);
      });

      dbHelper = new DbHelper();
      await dbHelper.connect();
    });

    it('Successfully updates a trial', async () => {
      const oldTrial = await dbHelper.fetchTrial(testTrialId);
      expect(oldTrial.studyStatus).to.eq('In progress');
      expect(oldTrial.lastUpdated).to.eq(1);

      updater = new TrialUpdater();
      const result = await updater.updateTrial(testTrialId);

      expect(result).to.eq(true);

      const updatedTrial = await dbHelper.fetchTrial(testTrialId);
      expect(updatedTrial.studyStatus).to.eq('Completed');
      expect(updatedTrial.lastUpdated).to.eq(1281477600); // unix timestamp of "August 11, 2010"
    });

    after(async () => {
      ClinicalTrialsApiStub.restore();

      await dbHelper.disconnect();
    });
  });
});
