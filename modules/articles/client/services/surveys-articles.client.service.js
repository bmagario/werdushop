//Articles service used to communicate Articles REST endpoints
(function () {
  'use strict';

  angular
    .module('articles')
    .factory('ArticlesSurveysService', ArticlesSurveysService);

  ArticlesSurveysService.$inject = ['$resource'];

  function ArticlesSurveysService($resource) {
    var url, defaultParams, actions;
 
    url = '/api/articles_surveys/';
    defaultParams = {};
    actions = {
      update: { method: 'PUT' },
      enableArticle: { url: '/api/articles_prices/enable_article/', method: 'POST', isArray: true },
      loadSurvey: { url: '/api/articles_surveys/load_survey/', method: 'POST', isArray: true },
      addArticle: { url: '/api/articles_surveys/add_article/', method: 'POST', isArray: true },
      closeSurveyOrder: { url: '/api/articles_surveys/close_survey_order/', method: 'POST', isArray: true },
      getArticles: { url: '/api/articles/get_articles/', method: 'GET', isArray: true }
    };
 
    return $resource(url, defaultParams, actions);
  }
})();