require('dotenv').config({path: `${__dirname}/../../.env.test`});

const expect = require('chai').expect;
const { spawnSync } = require( 'child_process' );

const listTrialsFunction = require('../../functions/listTrials');

describe('listTrialsFunction', () => {
  // (re-)seed the local DB
  beforeEach(() =>{
    spawnSync( '/usr/bin/serverless', [ 'dynamodb', 'seed' ] );
  });

  context('fetchTrials', async () => {
    it('Lists the trials that are in the DB', async () => {
      const response = await listTrialsFunction.handle();

      expect(response.statusCode).to.eq(200);

      const parsedBody = JSON.parse(response.body);
      expect(parsedBody.results_count).to.be.at.least(2, 'At least 2 trials should be in the database');
    });
  });
});
