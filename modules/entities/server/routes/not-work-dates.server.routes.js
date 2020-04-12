'use strict';

/**
 * Module dependencies
 */
var notWorkDatesPolicy = require('../policies/not-work-dates.server.policy'),
    not_work_dates = require('../controllers/not-work-dates.server.controller');

module.exports = function(app) {
// not_work_dates Routes
  app.route('/api/get_not_work_dates/').all(notWorkDatesPolicy.isAllowed)
    .get(not_work_dates.get_not_work_dates);

  app.route('/api/add_not_work_dates/').all(notWorkDatesPolicy.isAllowed)
    .post(not_work_dates.add_not_work_dates);
  
  app.route('/api/delete_all_not_work_dates/').all(notWorkDatesPolicy.isAllowed)
    .post(not_work_dates.delete_all_not_work_dates);
};
