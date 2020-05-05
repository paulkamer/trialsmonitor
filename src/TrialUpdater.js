const DbHelper = require('./DbHelper');
const ClinicalTrialsApi = require('./ClinicalTrialsApi');
const { logger } = require('../src/lib/logger');

class TrialUpdater {
  async updateTrial(trialId) {
    const db = new DbHelper();
    const api = new ClinicalTrialsApi();

    // Fetch the full version of the updated trial from ClinicalTrials.gov
    const newTrial = await api.fetchTrial(trialId);
    if (!newTrial || !newTrial.Study) return false;

    const attributesToUpdate = this.extractAttributes(newTrial);
    attributesToUpdate.trial = newTrial;

    // Rely on last submit date on Trial when available. Otherwise use current date.
    if (!attributesToUpdate.lastUpdated || attributesToUpdate.lastUpdated === '?') {
      attributesToUpdate.lastUpdated = Math.round(new Date().getTime() / 1000);
    }

    // Update the record in the DB & return result.
    return await db.updateTrial(trialId, attributesToUpdate);
  }

  /**
   * Extract the attributes that we are interested in from the trial we fetched from
   * clinicaltrials.gov
   *
   * @param {Object} newTrial JSON object
   */
  extractAttributes(newTrial) {
    // Default to '?' because DynamoDB doesnt allow null values.
    let [title, acronym, phase, studyStatus, lastUpdated] = Array(4).fill('?');

    try {
      title = newTrial.Study.ProtocolSection.IdentificationModule.BriefTitle || '?';
      acronym = newTrial.Study.ProtocolSection.IdentificationModule.Acronym || '?';
      phase = newTrial.Study.ProtocolSection.DesignModule.PhaseList.Phase[0] || '?';
      studyStatus = newTrial.Study.ProtocolSection.StatusModule.OverallStatus || '?';
      lastUpdated = newTrial.Study.ProtocolSection.StatusModule.LastUpdateSubmitDate || '?';

      // Attempt to parse last submit date of Trial (format: "April 7, 2020")
      if (lastUpdated !== '?') {
        try {
          lastUpdated = new Date(lastUpdated).getTime() / 1000;
        } catch (e) {
          lastUpdated = '?';
        }
      }
    } catch (e) {
      logger.debug(e);
    }

    return { title, acronym, phase, studyStatus, lastUpdated };
  }
}

module.exports = TrialUpdater;
