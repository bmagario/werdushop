(function () {
  'use strict';

  angular
  .module('users.payment.routes')
  .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
    .state('users_debts', {
      abstract: true,
      url: '/users_debts',
      template: '<ui-view/>'
    })
    .state('users_debts.list', {
      url: '',
      templateUrl: 'modules/users/client/views/payment/list-users-debts.client.view.html',
      controller: 'UsersDebtsListController',
      data: {
        roles: ['admin'],
        pageTitle: 'Cta. Cte. Usuarios'
      }
    })
    .state('users_debts.view', {
      url: '/:id_user',
      templateUrl: 'modules/users/client/views/payment/view-user-debt.client.view.html',
      controller: 'UsersDebtsController',
      controllerAs: 'vm',
      resolve: {
        userResolve: getUserDebt
      },
      data:{
        pageTitle: 'Cta. Cte. {{ userResolve.user_name }}'
      }
    });
  }

  getUserDebt.$inject = ['$stateParams', 'UsersDebtsService'];

  function getUserDebt($stateParams, UsersDebtsService) {
    return UsersDebtsService.get({
      id_user: $stateParams.id_user
    }).$promise;
  }
})();
