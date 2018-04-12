/* eslint-disable global-require */
module.exports = {
  deleteExistingData: require('./delete-existing-data').deleteExistingData,
  addDummyArticles: require('./add-dummy-articles').addDummyArticles,
  addDummyCategories: require('./add-dummy-categories').addDummyCategories,
  addDummyInfoPages: require('./add-dummy-info-pages').addDummyInfoPages,
  addDummyStaff: require('./add-dummy-staff').addDummyStaff,
  addDummyTeams: require('./add-dummy-teams').addDummyTeams,
  addDummyTags: require('./add-dummy-tags').addDummyTags,
  addDummyIssues: require('./add-dummy-issues').addDummyIssues,
  addDummySemesters: require('./add-dummy-semesters').addDummySemesters,
  addIssueCategoryOrdering: require('./add-issue-category-ordering')
    .addIssueCategoryOrdering,
  addArticleTagRelationship: require('./add-article-tag-relationship')
    .addArticleTagRelationship,
  addArticleAuthorRelationship: require('./add-article-author-relationship')
    .addArticleAuthorRelationship,
  addIssueArticleOrdering: require('./add-issue-article-ordering')
    .addIssueArticleOrdering,
  addTeamStaffRelationship: require('./add-team-staff-relationship')
    .addTeamStaffRelationship,
};
