(function () {
  'use strict';
  angular
  .module('articles')
  .controller('ArticlesDeliveriesController', ArticlesDeliveriesController);

  ArticlesDeliveriesController.$inject = ['$scope', 'globals', '$state', 'ArticlesDeliveriesService', 'deliveryOrderResolve', 'PaymentMethodsService', 'modalService', 'NgTableParams', 'localStorageService', 'sweet'];

  function ArticlesDeliveriesController($scope, globals, $state, ArticlesDeliveriesService, basket_order, PaymentMethodsService, modalService, NgTableParams, localStorageService, sweet) {
    var self = this;
    self.basket_order = basket_order;
    self.basket_order.payment_methods = [];

    //Metodos de cobro.
    self.paymentMethodsOptions = [];
    var getPaymentMethodsCobro = function () {
      PaymentMethodsService.getPaymentMethodsCobro().then(function(data) {
        self.paymentMethodsOptions = data;
      });
    };
    getPaymentMethodsCobro();

    //***************************************** Edition ***************************************
    self.checkAll = checkAll;
    self.uncheckAll = uncheckAll;
    self.setEditing = setEditing;
    self.wasChanged = wasChanged;
    self.getClassWasChanged = getClassWasChanged;
    self.addPaymentMethod = addPaymentMethod;

    $scope.getTotalValued = function (){
      var total_valued = 0;
      for (var i = 0; i < self.basket_order.articles.length; i++) {
        var item = self.basket_order.articles[i];
        if ($scope.checkboxes.items[item.id_article] && angular.isDefined(item.id_article) && !item.gift && !self.wasChanged(item)) {
          total_valued += item.price * item.amount;
        }
      }

      //Check all checkbox de complex_articles.
      for (i = 0; i < self.basket_order.complex_articles.length; i++) {
        var item_complex = self.basket_order.complex_articles[i];
        if ($scope.checkboxes_complex.items[item_complex.id_complex_article] && angular.isDefined(item_complex.id_complex_article)) {
          total_valued += item_complex.total;
        }
      }

      return total_valued;
    };

    function checkAll(){
      //Check all checkbox de articles.
      for (var i = 0; i < self.basket_order.articles.length; i++) {
        var item = self.basket_order.articles[i];
        if (angular.isDefined(item.id_article) && !item.gift && !self.wasChanged(item)) {
          $scope.checkboxes.items[item.id_article] = true;
        }
      }

      //Check all checkbox de complex_articles.
      for (i = 0; i < self.basket_order.complex_articles.length; i++) {
        var item_complex = self.basket_order.complex_articles[i];
        if (angular.isDefined(item_complex.id_complex_article)) {
          $scope.checkboxes_complex.items[item_complex.id_complex_article] = true;
        }
      }
    }

    function uncheckAll(){
      //UnCheck all checkbox de articles.
      for (var i = 0; i < self.basket_order.articles.length; i++) {
        var item = self.basket_order.articles[i];
        if (angular.isDefined(item.id_article) && !item.gift && !self.wasChanged(item)) {
          $scope.checkboxes.items[item.id_article] = false;
        }
      }

      //UnCheck all checkbox de complex_articles.
      for (i = 0; i < self.basket_order.complex_articles.length; i++) {
        var item_complex = self.basket_order.complex_articles[i];
        if (angular.isDefined(item_complex.id_complex_article)) {
          $scope.checkboxes_complex.items[item_complex.id_complex_article] = false;
        }
      }
    }

    function setEditing(article, value){
      article.isEditing = value && !self.wasChanged(article);
    }

    function wasChanged(article){
      return article.status_basket === globals.ARTICULO_CAMBIADO;
    }

    function getClassWasChanged(article){
      if(self.wasChanged(article)){
        return 'was_changed';
      }
      return '';
    }

    //************************************ Checkboxes **************************************
    $scope.checkboxes = { 'checked': false, items: {} };

    // watch for check all checkbox
    $scope.$watch('checkboxes.checked', function(value) {
      angular.forEach(self.basket_order.articles, function(item) {
        if (angular.isDefined(item.id_article)) {
          $scope.checkboxes.items[item.id_article] = value;
        }
      });
    });

    // watch for data checkboxes
    $scope.$watch('checkboxes.items', function(values) {
      if (!self.basket_order.articles) {
        return;
      }
      var checked = 0;
      var unchecked = 0;
      var total = self.basket_order.articles.length;
      angular.forEach(self.basket_order.articles, function(item) {
        checked += ($scope.checkboxes.items[item.id_article]) || 0;
        unchecked += (!$scope.checkboxes.items[item.id_article]) || 0;
      });
      if ((parseInt(unchecked) === 0) || (parseInt(checked) === 0)) {
        $scope.checkboxes.checked = (parseInt(checked) === parseInt(total));
      }
      // grayed checkbox
      angular.element(document.getElementById('select_all')).prop('indeterminate', (parseInt(checked) !== 0 && parseInt(unchecked) !== 0));
    }, true);

    $scope.checkboxes_complex = { 'checked': false, items: {} };

    // watch for data checkboxes complex
    $scope.$watch('checkboxes_complex.items', function(values) {
      if (!self.basket_order.complex_articles) {
        return;
      }
      var checked = 0;
      var unchecked = 0;
      var total = self.basket_order.complex_articles.length;
      angular.forEach(self.basket_order.complex_articles, function(item_complex) {
        checked += ($scope.checkboxes_complex.items[item_complex.id_complex_article]) || 0;
        unchecked += (!$scope.checkboxes_complex.items[item_complex.id_complex_article]) || 0;
      });
      if ((parseInt(unchecked) === 0) || (parseInt(checked) === 0)) {
        $scope.checkboxes_complex.checked = (parseInt(checked) === parseInt(total));
      }
      // grayed checkbox
      angular.element(document.getElementById('select_all')).prop('indeterminate', (parseInt(checked) !== 0 && parseInt(unchecked) !== 0));
    }, true);

    //************************************* Actions **************************************
    //Busqueda de articulos.
    $scope.getArticles = function(name) {
      var ajax_params = {
        name: name
      };

      return ArticlesDeliveriesService
      .getArticles(ajax_params)
      .$promise.then(function (result) {
        return result.map(function(item){
          return item;
        });
      }, function(error) {
        console.log(error);
      });
    };

    $scope.addArticuloDelivery = function() {
      if($scope.articleSelected){
        var esta = false;
        //Verifico que el articulo no haya sido agregado anteriormente.
        for (var i = 0; i < self.basket_order.articles.length; i++) {
          var item = self.basket_order.articles[i];
          if ($scope.articleSelected.id_article === item.id_article) {
            esta = true;
            $scope.articleSelected = null;
            sweet.show({
              title: 'Warning Agregar Artículo',
              text: 'El artículo ya existen en la Orden de Entrega.',
              animation: 'slide-from-top'
            });
            return;
          }
        }

        //En cuyo caso se agrega el mismo al scope.
        if(!esta){
          var article = $scope.articleSelected;
          article.gift = true;
          var ajax_params = {
            id_basket_order: self.basket_order.id_basket_order,
            id_location: self.basket_order.id_location,
            id_zone: self.basket_order.id_zone,
            article: article
          };
          ArticlesDeliveriesService
          .addGift(ajax_params)
          .$promise.then(function (result) {
            if(result[0].error){
              sweet.show({
                title: 'Falla Agregar Artículo',
                text: result[0].msg,
                animation: 'slide-from-top'
              });
            } else{
              article = result[0].article;
              self.basket_order.articles.push(article);
              $scope.articleSelected = null;
            }
          }, function(error) {
            console.log(error);
          });
        }
      }
    };

    $scope.changeArticuloDelivery = function(article) {
      if(self.articleSelectedChange){
        var esta = false;
        //Verifico que el articulo no haya sido agregado anteriormente.
        for (var i = 0; i < self.basket_order.articles.length; i++) {
          var item = self.basket_order.articles[i];
          if (self.articleSelectedChange.id_article === item.id_article) {
            esta = true;
            self.articleSelectedChange = null;
            sweet.show({
              title: 'Warning Agregar Artículo',
              text: 'El artículo ya existen en la Orden de Entrega.',
              animation: 'slide-from-top'
            });
            return;
          }
        }

        //En cuyo caso se agrega el mismo al scope.
        if(!esta){
          var new_article = self.articleSelectedChange;
          new_article.gift = false;
          var ajax_params = {
            id_basket_order: self.basket_order.id_basket_order,
            id_location: self.basket_order.id_location,
            id_zone: self.basket_order.id_zone,
            article: article,
            new_article: new_article
          };

          ArticlesDeliveriesService
          .changeArticle(ajax_params)
          .$promise.then(function (result) {
            if(result[0].error){
              sweet.show(result[0].msg);
              self.articleSelectedChange = null;
            } else{
              new_article = result[0].new_article;
              self.basket_order.articles.push(new_article);
              self.articleSelectedChange = null;
              for(var i = self.basket_order.articles.length - 1; i >= 0; i--) {
                if(self.basket_order.articles[i].id_article === article.id_article) {
                  self.basket_order.articles[i] = result[0].article;
                  self.setEditing(self.basket_order.articles[i], false);
                  break;
                }
              }
            }
          }, function(error) {
            console.log(error);
          });
        }
      }
    };

    $scope.updateArticuloDelivery = function(article){
      if(article){
        var ajax_params = {
          id_basket_order: self.basket_order.id_basket_order,
          article: article
        };
        ArticlesDeliveriesService
        .updateArticle(ajax_params)
        .$promise.then(function (result) {
          if(result[0].error){
            sweet.show(result[0].msg);
          } else{
            article.total = article.amount * article.price;
            self.setEditing(article, false);
          }
        }, function(error) {
          console.log(error);
        });
      }
    };

    $scope.removeArticuloDelivery = function(article){
      if(article){
        var index = -1;
        for (var i = 0; i < self.basket_order.articles.length; i++) {
          var item = self.basket_order.articles[i];
          if(item.id_article === article.id_article) {
            index = i;
            break;
          }
        }
        if(index >= 0){
          var ajax_params = {
            id_basket_order: self.basket_order.id_basket_order,
            article: article
          };
          ArticlesDeliveriesService
          .removeArticle(ajax_params)
          .$promise.then(function (result) {
            if(result[0].error){
              sweet.show({
                title: 'Error Eliminar Artículo',
                text: result[0].msg,
                animation: 'slide-from-top'
              });
            } else{
              self.basket_order.articles.splice(index, 1);
            }
          }, function(error) {
            console.log(error);
          });
        }
      }
    };

    $scope.closeDeliveryOrder = function(){
      sweet.show({
        title: 'Cierre de Orden de Entrega',
        text: '¿Está seguro que desea cerrar la Orden de Entrega N° ' + self.basket_order.number + '?',
        type: 'info',
        html: true,
        animation: 'slide-from-top',
        showCancelButton: true,
        closeOnConfirm: false,
        showLoaderOnConfirm: true
      }, function(inputValue) {
        if (inputValue === true){
          _closeDeliveryOrder();
        }
      });
    };

    function _closeDeliveryOrder(){
      var articles = [];
      for (var i = 0; i < self.basket_order.articles.length; i++) {
        var item = self.basket_order.articles[i];
        if (angular.isDefined(item.id_article) && $scope.checkboxes.items[item.id_article]) {
          articles.push(item.id_article);
        }
      }

      var complex_articles = [];
      for (i = 0; i < self.basket_order.complex_articles.length; i++) {
        var item_complex = self.basket_order.complex_articles[i];
        if (angular.isDefined(item_complex.id_complex_article) && $scope.checkboxes_complex.items[item_complex.id_complex_article]) {
          var complex_article = { id_complex_article: item_complex.id_complex_article };
          complex_articles.push(item_complex.id_complex_article);
        }
      }

      var ajax_params = {
        id_basket_order:  self.basket_order.id_basket_order,
        id_location: self.basket_order.id_location,
        id_zone: self.basket_order.id_zone,
        articles: articles,
        complex_articles: complex_articles,
        payment_methods: self.basket_order.payment_methods
      };
      ArticlesDeliveriesService
      .closeDeliveryOrder(ajax_params)
      .$promise.then(function (result) {
        if(result[0].error){
          sweet.show({
            title: 'Error Cierre Orden de Entrega',
            text: result[0].msg,
            animation: 'slide-from-top'
          });
        } else if(result[0].code === globals.WARNING_ARTICULOS_SIN_STOCK){
          var title = 'Artículos Sin Stock';
          var text = '<h4>Consistencia OK.</h4>';
          text = '<h4>' + result[0].msg + '</h4>';
          text += '<div class="table_vertical_scroll">';
          text += ' <table class="table table-bordered">';
          for (var i = result[0].articulos.length - 1; i >= 0; i--) {
            text += ' <tr><td>' + result[0].articulos[i].full_code + '</td><td class="left">'+ result[0].articulos[i].name + '</td></tr>';
          }
          text += ' </table>';
          text += '</div>';
          sweet.show({
            title: title,
            text: text,
            type: 'info',
            html: true,
            animation: 'slide-from-top'
          });
        } else {
          sweet.show({
            title: 'Cierre Exitoso',
            text: 'La Orden de Entrega N° ' + self.basket_order.number + ' fue cerrada exitosamente.',
            type: 'info',
            html: true,
            animation: 'slide-from-top'
          }, function(inputValue) {
            if (inputValue === true){
              $state.go('deliveries.list');
            }
          });
        }
      }, function(error) {
        console.log(error);
      });
    }
    //************************************* MEDIOS DE PAGO **************************************
    function addPaymentMethod(){
      var total = $scope.getTotalValued();
      for (var i = 0; i < self.basket_order.payment_methods.length; i++) {
        var payment_method = self.basket_order.payment_methods[i];
        total -= payment_method.total;
      }

      var payment_method_add = { method: self.paymentMethodsOptions[0], total: total };
      self.basket_order.payment_methods.push(payment_method_add);
    }

    function _checkTotalPayment(){
      var total = 0;
      for (var i = 0; i < self.basket_order.payment_methods.length; i++) {
        var payment_method = self.basket_order.payment_methods[i];
        total += payment_method.total;
      }
      return total === $scope.getTotalValued();
    }
    //************************************* VER ART COMPLEJO **************************************
    $scope.verComplexArticleDetail = function(complex_article){
      //Recordar que articuos_in_complex es un diccionario y se debe acceder con la clave, es que el el id_complex_article.
      var articles = self.basket_order.articulos_in_complex[complex_article.id_complex_article];
      var modalOptions = {
        closeButtonText: 'Cerrar',
        headerText: complex_article.name,
        bodyText: ' ',
        footerText: '',
      };

      var html = '';
      html += '<table class="table table-bordered table-striped table-condensed">';
      html += '  <tr>';
      html += '    <th class="center">Código</th>';
      html += '    <th class="center">Nombre</th>';
      html += '    <th class="center">Escala Orig.</th>';
      html += '    <th class="center">Escala Nueva</th>';
      html += '    <th class="center">Equiv. Orig.</th>';
      html += '    <th class="center">Equiv. Nueva</th>';
      html += '    <th class="center">Cantidad</th>';
      html += '    <th class="center">Cantidad Total</th>';
      html += '  </tr>';
      for (var i = 0; i < articles.length; i++) {
        var article = articles[i];
        var amount = complex_article.amount * article.equivalence_complex;
        html += '  <tr>';
        html += '    <td>' + article.full_code + '</td>';
        html += '    <td>' + article.name + '</td>';
        html += '    <td>' + article.scale + ' ' + article.measurement_unit_abbreviation_plural + '</td>';
        html += '    <td>' + article.scale_complex + ' ' + article.measurement_unit_abbreviation_plural_complex + '</td>';
        html += '    <td>' + article.equivalence + ' ' + article.measurement_unit_equivalence_abbreviation + '</td>';
        html += '    <td>' + article.equivalence_complex + ' ' + article.measurement_unit_equivalence_abbreviation_plural + '</span></td>';
        html += '    <td>' + complex_article.amount + '</td>';
        html += '    <td>' + amount + ' ' + article.measurement_unit_equivalence_abbreviation_plural + '</td>';
        html += '  </tr>';
      }
      html += '</table>';

      var modalDefaults = {
        backdrop: true,
        keyboard: true,
        modalFade: true,
        template: html,
        size: 'lg'
      };

      modalService.showModal(modalDefaults, modalOptions);
    };
  }
})();
