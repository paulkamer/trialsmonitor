require('dotenv').config({ path: `${__dirname}/../../test.env` });

const sinon = require('sinon');
const expect = require('chai').expect;
const { seedDb } = require('./dbHelper');
const DbHelper = require('../../src/helpers/Db');

const NewTrialsChecker = require('../../src/NewTrialsChecker');
const ClinicalTrialsApi = require('../../src/lib/ClinicalTrialsApi');

describe('NewTrialsChecker', async () => {
  let dbHelper;
  let checker;

  // (re-)seed the local DB
  beforeEach(async () => {
    await seedDb();

    dbHelper = new DbHelper();
    await dbHelper.connect();

    checker = new NewTrialsChecker(dbHelper);
  });

  afterEach(async () => {
    await dbHelper.disconnect();
  });

  context('findAndAddNewTrials', async () => {
    let ClinicalTrialsApiStub;

    const apiResponse1 = [{ NCTId: ['nct001'] }, { NCTId: ['nct002'] }, { NCTId: ['NCT02914535'] }];

    const apiResponse2 = [
      { NCTId: ['nct002'] },
      { NCTId: ['NCT01023321'] },
      { NCTId: ['NCT02914535'] },
    ];

    // Stub the ClinicalTrials.gov API, so there is no external dependency
    before(() => {
      ClinicalTrialsApiStub = sinon.stub(ClinicalTrialsApi.prototype, 'findTrials');
      ClinicalTrialsApiStub.onCall(0).returns(apiResponse1);
      ClinicalTrialsApiStub.onCall(1).returns(apiResponse2);
    });

    it('Successfully finds and adds new trials', async () => {
      const result = await checker.findAndAddNewTrials();

      expect(result.results).to.have.lengthOf(2);
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
