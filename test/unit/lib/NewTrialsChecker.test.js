const expect = require('chai').expect;

const NewTrialsChecker = require('../../../src/NewTrialsChecker');

describe('NewTrialsChecker', () => {
  const searcher = new NewTrialsChecker();

  context('uniqueNctIds', () => {
    it('Returns a unique list of NCT ids', () => {
      const ids = ['nct001','nct001','nct002','nct003','nct002','nct111'];

      const result = searcher.uniqueNctIds(ids);

      expect(result).to.have.lengthOf(4);
    });
  });

  context('determineMissingNctIds', () => {
    it('Determines missing NCT ids', () => {
      const allIds = ['nct001','nct002','nct003','nct111'];
      const currentIds = ['nct001','nct002','nct111'];

      const result = searcher.determineMissingNctIds(allIds, currentIds);

      expect(result).to.have.lengthOf(1);
      expect(result[0]).equals('nct003');
    });

    it('Returns empty array when none are missing', () => {
      const allIds = ['nct001','nct002','nct003'];
      const currentIds = ['nct001','nct002','nct003'];

      const result = searcher.determineMissingNctIds(allIds, currentIds);

      expect(result).to.have.lengthOf(0);
    });

    it('Returns empty array when currentIds list contains an obsolete ID', () => {
      const allIds = ['nct001','nct002','nct003']; // This list 'is leading'
      const currentIds = ['nct001','nct002','nct003', 'ntc004']; // ntc004 should be ignored

      const result = searcher.determineMissingNctIds(allIds, currentIds);

      expect(result).to.have.lengthOf(0);
    });
  });
});
