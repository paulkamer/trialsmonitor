import { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';

import ClinicalTrialsApi from '../../../src/lib/ClinicalTrialsApi';
import TrialUpdater from '../../../src/TrialUpdater';
import db from '../../../src/lib/Db';

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

  let updater;
  let ClinicalTrialsApiStub: SinonStub;

  context('updateTrial', () => {
    before(() => {
      ClinicalTrialsApiStub = sinon.stub(ClinicalTrialsApi.prototype, 'fetchTrial');
      ClinicalTrialsApiStub.callsFake(() => {
        return Promise.resolve(false);
      });
    });

    it('Aborts updating when trial cannot be fetched', async () => {
      updater = new TrialUpdater(db);
      const result = await updater.updateTrial(testTrialId);

      expect(result).to.eq(false);
    });

    after(() => {
      ClinicalTrialsApiStub.restore();
    });
  });

  context('extractAttributes', () => {
    it('Extracts the attributs from the trial object', () => {
      updater = new TrialUpdater(db);
      const result = updater.extractAttributes(testTrial);

      expect(result.title).to.eq('Trial title');
      expect(result.acronym).to.eq('Trial001');
      expect(result.phase).to.eq('Phase 2');
      expect(result.studyStatus).to.eq('In progress');
    });

    it('Falls back to question marks when value is missing', () => {
      updater = new TrialUpdater(db);
      const result = updater.extractAttributes(null);

      expect(result.title).to.eq('?');
      expect(result.acronym).to.eq('?');
      expect(result.phase).to.eq('?');
      expect(result.studyStatus).to.eq('?');
    });
  });

  context('determineDiff', () => {
    // Trials for testing TrialUpdater/determineDiff()
    const trial1 = { title: 'Trial title', acronym: 'Trial001', trial: {} };
    const trial2 = { title: 'New trial title', acronym: 'Trial001', trial: {} };
    const trial3 = {};

    it('Determines the diff between 2 version of the trial', () => {
      updater = new TrialUpdater(db);
      const result = updater.determineDiff(trial1, trial2);

      expect(result).to.include('title');
      expect(result).to.not.include('acronym');
    });

    it('doesnt store diff when there is no prev version', () => {
      updater = new TrialUpdater(db);
      const result = updater.determineDiff(trial3, trial2);

      expect(result).to.eql('-');
    });
  });
});
