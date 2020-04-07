require('dotenv').config({path: `${__dirname}/../../.env.test`});

const expect = require('chai').expect;
const { spawnSync } = require( 'child_process' );

const trialsFunction = require('../../functions/api/trials');
const DbHelper = require('../../src/DbHelper');

describe('trialsFunction', () => {
  // (re-)seed the local DB
  beforeEach(() =>{
    spawnSync( '/usr/bin/serverless', [ 'dynamodb', 'seed' ] );
  });

  context('getAll', async () => {
    it('Lists the trials that are in the DB', async () => {
      const response = await trialsFunction.getAll();

      expect(response.statusCode).to.eq(200);

      const parsedBody = JSON.parse(response.body);
      expect(parsedBody.results_count).to.be.at.least(2, 'At least 2 trials should be in the database');
    });
  });
});

describe('deleteTrialFunction', () => {
  // (re-)seed the local DB
  beforeEach(() =>{
    spawnSync( '/usr/bin/serverless', [ 'dynamodb', 'seed' ] );
  });

  const testTrialId = 'NCT01023321';

  context('deleteTrialFunction', async () => {
    it('Successfully deletes a trial', async () => {
      const db = new DbHelper();

      const trialsBefore = await db.listTrials();
      const numberOfTrialsBefore = Object.keys(trialsBefore).length;

      const event = { body: { trialId: testTrialId } };
      const context = {};
      const callback = () => {};
      const expectedResponseBody = JSON.stringify({
        results_count: 1,
        results: [{}]
      });

      const response = await trialsFunction.deleteTrial(event, context, callback);

      expect(response.statusCode).to.eq(200);
      expect(response.body).to.eq(expectedResponseBody);

      const trialsAfter = await db.listTrials();
      const numberOfTrialsAfter = Object.keys(trialsAfter).length;

      expect(numberOfTrialsBefore).to.be.above(numberOfTrialsAfter);
    });
  });
});