require('dotenv').config({path: `${__dirname}/../../.env.test`});

const expect = require('chai').expect;
const sinon = require('sinon');
const { spawnSync } = require( 'child_process' );

const DbHelper = require('../../src/DbHelper');
const ClinicalTrialsApi = require('./../../src/ClinicalTrialsApi');
const TrialUpdater = require('../../src/TrialUpdater');

describe('insertTrial', () => {
  // (re-)seed the local DB
  beforeEach(() =>{
    spawnSync( '/usr/bin/serverless', [ 'dynamodb', 'seed' ] );
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
        },
      },
    },
  };

  let dbHelper;
  let updater;
  let ClinicalTrialsApiStub;

  context('updateTrial', () => {
    // Still stub the ClinicalTrials.gov API, so there is no external dependency
    before(() => {
      ClinicalTrialsApiStub = sinon.stub(ClinicalTrialsApi.prototype, 'fetchTrial');
      ClinicalTrialsApiStub.callsFake(() => {
        return Promise.resolve(testTrial);
      });

      dbHelper = new DbHelper();
    });

    it('Successfully updates a trial', async () => {
      const oldTrial = await dbHelper.fetchTrial(testTrialId);
      expect(oldTrial.studyStatus.S).to.eq('In progress');

      updater = new TrialUpdater();
      const result = await updater.updateTrial(testTrialId);

      expect(result).to.eq(true);

      const updatedTrial = await dbHelper.fetchTrial(testTrialId);
      expect(updatedTrial.studyStatus.S).to.eq('Completed');
    });

    after(() => {
      ClinicalTrialsApiStub.restore();
    });
  });
});
