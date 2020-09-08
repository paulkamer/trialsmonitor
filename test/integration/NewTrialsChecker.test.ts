require('dotenv').config({ path: `${__dirname}/../../test.env` });

import sinon, { SinonStub } from 'sinon';
import { expect } from 'chai';
import { seedDb } from './dbHelper';
import db from '../../src/lib/Db';

import NewTrialsChecker from '../../src/NewTrialsChecker';
import ClinicalTrialsApi from '../../src/lib/ClinicalTrialsApi';

describe('NewTrialsChecker', async () => {
  let checker: NewTrialsChecker;

  // (re-)seed the local DB
  beforeEach(async () => {
    await seedDb();

    await db.connect();

    checker = new NewTrialsChecker(db);
  });

  afterEach(async () => {
    await db.disconnect();
  });

  context('findAndAddNewTrials', async () => {
    let ClinicalTrialsApiStub: SinonStub;

    const apiResponse1 = {
      Expression: 'q1',
      StudyFields: [{ NCTId: ['nct001'] }, { NCTId: ['nct002'] }, { NCTId: ['NCT02914535'] }],
    };

    const apiResponse2 = {
      Expression: 'q2',
      StudyFields: [{ NCTId: ['nct002'] }, { NCTId: ['NCT01023321'] }, { NCTId: ['NCT02914535'] }],
    };

    // Stub the ClinicalTrials.gov API, so there is no external dependency
    before(() => {
      ClinicalTrialsApiStub = sinon.stub(ClinicalTrialsApi.prototype, 'findTrials');
      ClinicalTrialsApiStub.onCall(0).returns(apiResponse1);
      ClinicalTrialsApiStub.onCall(1).returns(apiResponse2);
    });

    it('Successfully finds and adds new trials', async () => {
      const result = await checker.findAndAddNewTrials();

      expect(result.results || []).to.have.lengthOf(2);
      expect(result.results_length).to.eql(2);
    });

    after(() => {
      ClinicalTrialsApiStub.restore();
    });
  });

  context('fetchSearchQueries', () => {
    it('Successfully lists search queries', async () => {
      const result = await checker.fetchSearchQueries();

      expect(result).to.have.lengthOf.at.least(2); // see db/seeds/dev/searches.json
    });
  });
});
