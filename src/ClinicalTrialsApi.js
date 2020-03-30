const fetch = require('node-fetch');

/**
 * Helper class to fetch data from the ClinicalTrials.gov API
 */
class ClinicalTrialsApi {
  /**
   * Find trials by trial NCTId
   * @param {String[]} nctIds List of NCT (National Clinical Trial) ids
   * @returns Array
   */
  async listTrialsForUpdateCheck(nctIds) {
    if (nctIds.length === 0) return [];

    // Fields to return
    const fields = ['NCTId', 'LastUpdatePostDate', 'LastUpdateSubmitDate'].join(',');
    const expression = encodeURI(nctIds.join(' OR '));

    return this.findTrials(expression, fields);
  }

  /**
   * Fetch the full clinical trial from the ClinicalTrials API, in JSON
   * @param {String} trialId
   */
  async fetchTrial(trialId) {
    const url = `https://www.clinicaltrials.gov/api/query/full_studies?fmt=json&expr=${trialId}`;
    console.debug('fetchTrial', url);

    try {
      const res = await fetch(url, { timeout: 3000 });
      const data = await res.json();

      // Validate API resonse
      if (data.FullStudiesResponse.NStudiesReturned !== 1) {
        console.debug('API response (JSON)', data);
        throw new Error('Unexpected API response received');
      }

      return data.FullStudiesResponse.FullStudies[0];
    } catch (e) {
      console.error(e);

      return false;
    }
  }

  /**
   * Find trials by a query
   * @todo paginate if NStudiesFound > NStudiesReturned
   *
   * @param {*} expression
   * @param {*} fields
   */
  async findTrials(expression, fields) {
    const url = `https://www.clinicaltrials.gov/api/query/study_fields?expr=${expression}&fields=${fields}&fmt=JSON&max_rnk=1000`;
    console.debug('listTrialsForUpdateCheck', url);

    try {
      const res = await fetch(url, { timeout: 5000 });
      const data = await res.json();

      return data.StudyFieldsResponse.StudyFields;
    } catch (e) {
      console.error(e);

      return [];
    }
  }
}

module.exports = ClinicalTrialsApi;
