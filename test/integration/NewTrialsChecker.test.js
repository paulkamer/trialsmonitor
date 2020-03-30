require('dotenv').config({path: `${__dirname}/../../.env.test`});

const sinon = require('sinon');
const expect = require('chai').expect;
const { spawnSync } = require( 'child_process' );

const NewTrialsChecker = require('../../src/NewTrialsChecker');
const ClinicalTrialsApi = require('../../src/ClinicalTrialsApi');
const DbHelper = require('../../src/DbHelper');

describe('NewTrialsChecker', () => {
  // (re-)seed the local DB
  beforeEach(() =>{
    spawnSync( '/usr/bin/serverless', [ 'dynamodb', 'seed' ] );
  });

  const searcher = new NewTrialsChecker();

  context('findAndAddNewTrials', async () => {
    let ClinicalTrialsApiStub;
    let dbHelper;

    const apiResponse1 = [
      { NCTId: ['nct001'] },
      { NCTId: ['nct002'] },
      { NCTId: ['NCT02914535'] },
    ];

    const apiResponse2 = [
      { NCTId: ['nct002'] },
      { NCTId: ['NCT01023321'] },
      { NCTId: ['NCT02914535'] },
    ];

    // Stub the ClinicalTrials.gov API, so there is no external dependency
    before(() => {
      dbHelper = new DbHelper();

      ClinicalTrialsApiStub = sinon.stub(ClinicalTrialsApi.prototype, 'findTrials');
      ClinicalTrialsApiStub.onCall(0).returns(apiResponse1);
      ClinicalTrialsApiStub.onCall(1).returns(apiResponse2);
    });

    it('Successfully finds and adds new trials', async () => {
      const result = await searcher.findAndAddNewTrials();

      expect(result.results).to.have.lengthOf(2);
      expect(result.results_length).to.eql(2);
    });

    after(() => {
      ClinicalTrialsApiStub.restore();

      // Delete added trials again to 'reset' the DB
      dbHelper.deleteTrials(['nct001', 'nct002']);
    });
  });

  context('fetchSearchQueries', () => {
    it('Successfully lists search queries', async () => {
      const result = await searcher.fetchSearchQueries();

      expect(result).to.have.lengthOf.at.least(2); // see db/seeds/dev/searches.json
    });
  });
});
