const { ObjectId } = require('mongodb');

module.exports = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
    trialId: 'NCT02914535',
    lastUpdated: 1234567890,
    title: 'Filgotinib in Long-Term Extension Study of Adults With Ulcerative Colitis',
    acronym: 'SELECTIONLTE',
    studyStatus: 'Enrolling by invitation',
    phase: 'Phase 3',
    trial: '{}',
  },
  {
    _id: new ObjectId('bbbbbbbbbbbbbbbbbbbbbbbb'),
    trialId: 'NCT01023321',
    lastUpdated: 1,
    title: 'First-in-Human Single Ascending and Multiple Dose of GLPG0555',
    acronym: '-',
    studyStatus: 'In progress',
    phase: 'Phase 1',
    trial: '{}',
  },
];
