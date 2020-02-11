const jsonDiff = require('json-diff');

const DbHelper = require('./DbHelper');
const ClinicalTrialsApi = require('./ClinicalTrialsApi');

class TrialUpdater {
  async updateTrial (trialId) {
    const db = new DbHelper();
    const api = new ClinicalTrialsApi();

    // Fetch the full version of the updated trial from ClinicalTrials.gov
    const newTrial = await api.fetchTrial(trialId);
    if (!newTrial || !newTrial.Study) return false;

    const attributesToUpdate = this.extractAttributes(newTrial);

    const currentTrial = await db.fetchTrial(trialId);

    attributesToUpdate.diff = this.determineDiff(currentTrial, newTrial);
    attributesToUpdate.lastUpdated = Math.round(new Date().getTime() / 1000);
    attributesToUpdate.trial = newTrial;

    // Update the record in the DB & return result.
    return await db.updateTrial(trialId, attributesToUpdate);
  }

  /**
   * Extract the attributes that we are interested in from the trial we fetched from
   * clinicaltrials.gov
   *
   * @param {String} trialId
   * @param {*} newTrial
   */
  extractAttributes (newTrial) {
    // Default to '?' because DynamoDB doesnt allow null values.
    let [title, acronym, phase, studyStatus] = Array(4).fill('?');

    try {
      title = newTrial.Study.ProtocolSection.IdentificationModule.BriefTitle || '?';
      acronym = newTrial.Study.ProtocolSection.IdentificationModule.Acronym || '?';
      phase = newTrial.Study.ProtocolSection.DesignModule.PhaseList.Phase[0] || '?';
      studyStatus = newTrial.Study.ProtocolSection.StatusModule.OverallStatus || '?';
    } catch (e) {
      console.debug(e);
    }

    return { title, acronym, phase, studyStatus };
  }

  /**
   * Determine the diff between the current and new version of the trial, using
   * json-diff
   *
   * @param {*} currentTrial
   * @param {*} newTrial
   */
  determineDiff (currentTrial, newTrial) {
    let diff = '{}';

    // Determining DIFF does not belong in a DBHelper component!
    if (currentTrial && currentTrial.trial) {
      diff = jsonDiff.diffString(JSON.parse(currentTrial.trial.S), newTrial) || '-';
    }

    return diff;
  }
}

module.exports = TrialUpdater;
