const expect = require('chai').expect;
const sinon = require('sinon');

const ClinicalTrialsApi = require('./../../../src/ClinicalTrialsApi');
const TrialUpdater = require('../../../src/TrialUpdater');

describe('TrialUpdater', () => {
  const testTrialId = 'NCT001';

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
          OverallStatus: 'In progress',
        },
      },
    },
  };

  // Trials for testing TrialUpdater/determineDiff()
  const trial1 = { Title: 'Trial title', Acronym: 'Trial001' };
  const trial2 = { Title: 'New trial title', Acronym: 'Trial001' };

  let updater;
  let ClinicalTrialsApiStub;

  context('updateTrial', () => {
    before(() => {
      ClinicalTrialsApiStub = sinon.stub(ClinicalTrialsApi.prototype, 'fetchTrial');
      ClinicalTrialsApiStub.callsFake(() => {
        return Promise.resolve(false);
      });
    });

    it('Aborts updating when trial cannot be fetched', async () => {
      updater = new TrialUpdater();
      const result = await updater.updateTrial(testTrialId);

      expect(result).to.eq(false);
    });

    after(() => {
      ClinicalTrialsApiStub.restore();
    });
  });

  context('extractAttributes', () => {
    it('Extracts the attributs from the trial object', () => {
      updater = new TrialUpdater();
      const result = updater.extractAttributes(testTrial);

      expect(result.title).to.eq('Trial title');
      expect(result.acronym).to.eq('Trial001');
      expect(result.phase).to.eq('Phase 2');
      expect(result.studyStatus).to.eq('In progress');
    });

    it('Falls back to question marks when value is missing', () => {
      updater = new TrialUpdater();
      const result = updater.extractAttributes(null);

      expect(result.title).to.eq('?');
      expect(result.acronym).to.eq('?');
      expect(result.phase).to.eq('?');
      expect(result.studyStatus).to.eq('?');
    });
  });
});
