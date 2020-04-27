// eslint-disable-next-line import/no-extraneous-dependencies
const aws = require('aws-sdk');

const DbHelper = require('./DbHelper');
const { logger } = require('../src/lib/logger');

const LINE_END_TXT = '\n';
const LINE_END_HTML = '<br/>';

const CLINICALTRIALS_BASE_URL = 'https://clinicaltrials.gov/ct2';
const CLINICALTRIALS_SHOW_BASE_URL = `${CLINICALTRIALS_BASE_URL}/show`;
const CLINICALTRIALS_HISTORY_BASE_URL = `${CLINICALTRIALS_BASE_URL}/history`;

/**
 *
 */
class UpdatesNotifier {
  constructor(trialIds) {
    this.trialIds = trialIds;
  }

  async notify() {
    const trials = await this.fetchTrials();

    if (!trials || trials.length === 0) {
      logger.error('No trials were found');
      return false;
    }

    const emailParams = await this.prepareEmailParameters(trials);

    try {
      await this.sendEmail(emailParams);
    } catch (e) {
      logger.error(e);
      return false;
    }

    return true;
  }

  async fetchTrials() {
    const db = new DbHelper();
    const fetchAttributes = [
      'id',
      'title',
      'acronym',
      'phase',
      'studyStatus',
      'lastUpdated',
      'diff',
    ];

    return await db.fetchTrials(this.trialIds, fetchAttributes);
  }

  async prepareEmailParameters(trials) {
    const subject = `[TrialMonitor] ${this.trialIds.length} updates found`;
    const textBody = this.formatBody({ trials, lineEnd: LINE_END_TXT });
    const htmlBody = this.formatBody({ trials, lineEnd: LINE_END_HTML });

    return {
      toAddresses: [process.env.EMAIL_TO_ADDRESS],
      subject,
      textBody,
      htmlBody,
    };
  }

  /**
   * Format the email body
   *
   * @param {*} param
   */
  formatBody({ trials, lineEnd }) {
    let body = `Hello, we found ${trials.length} updated trials:${lineEnd.repeat(2)}`;

    const formatTrialLines = this.formatTrialLines({ trials, lineEnd });

    body += formatTrialLines.join(lineEnd.repeat(2));

    return body;
  }

  /**
   * Format a line for each updated trial, for the email body
   * @param {*} param0
   */
  formatTrialLines({ trials, lineEnd }) {
    return trials.map(trial => {
      const phase = (trial.phase && trial.phase.S) || '?';
      const studyStatus = (trial.studyStatus && trial.studyStatus.S) || '?';
      const title = (trial.title && trial.title.S) || '?';
      const acronym = (trial.acronym && trial.acronym.S) || '?';

      if (lineEnd === LINE_END_TXT) {
        return [
          `${title} (${acronym}) ${phase} - ${studyStatus}`,
          `${CLINICALTRIALS_SHOW_BASE_URL}/${trial.id.S} | ${CLINICALTRIALS_HISTORY_BASE_URL}/${trial.id.S}`,
        ].join(lineEnd);
      }

      return [
        `${title} (${acronym})`,
        `<a href="${CLINICALTRIALS_SHOW_BASE_URL}/${trial.id.S}" target="_blank">${trial.id.S}</a> (<a href="${CLINICALTRIALS_HISTORY_BASE_URL}/${trial.id.S}" target="_blank">history</a>) - ${phase} - ${studyStatus}`,
      ].join(lineEnd);
    });
  }

  /**
   * Send email
   *
   * @param {*} param
   */
  async sendEmail({ toAddresses, subject, textBody, htmlBody }) {
    const fromAddress = process.env.EMAIL_FROM_ADDRESS;

    const emailParams = {
      Source: fromAddress,
      Destination: { ToAddresses: toAddresses },
      ReplyToAddresses: [fromAddress],
      Message: {
        Subject: { Charset: 'UTF-8', Data: subject },
        Body: {
          Text: { Charset: 'UTF-8', Data: textBody },
          Html: { Charset: 'UTF-8', Data: htmlBody },
        },
      },
    };

    const ses = new aws.SES();

    return await ses.sendEmail(emailParams).promise();
  }
}

module.exports = UpdatesNotifier;
