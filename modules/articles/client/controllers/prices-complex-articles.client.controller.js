(function () {
  'use strict';
  angular
    .module('articles')
    .controller('ComplexArticlesPricesController', ComplexArticlesPricesController);

  ComplexArticlesPricesController.$inject = ['$scope', '$state', 'LocationsService', 'ComplexArticlesPricesService', 'SubgroupsService', 'StatesService', 'modalService', 'NgTableParams', 'localStorageService', 'sweet'];

  function ComplexArticlesPricesController($scope, $state, LocationsService, ComplexArticlesPricesService, SubgroupsService, StatesService, modalService, NgTableParams, localStorageService, sweet) {
    var self = this;

    //Parametros de la tabla de articulos.
    var tableParams = {};
    var originalData = {};
    var articlesTableParams = localStorageService.get('complexArticlesPricesTableParams');
    if (articlesTableParams !== null) {
      tableParams = articlesTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5,
        filter: { id_status: 0 },
        sorting: {
          name: 'asc'
        },
        group: {
          subgroup: 'asc'
        }
      };
    }

    //Configuracion inicial de la tabla de articulos.
    var tableSettings = {
      total: 0,
      counts: [5, 10, 50, 100, 200, 500],
      groupOptions: {
        isExpanded: false
      },
      groupBy: function(item) {
        if(item.enabled){
          return 'ACTIVO';
        } else{
          return 'NO_ACTIVO';
        }
      },
      getData: function($defer, params) {
        tableParams = params.parameters();
        localStorageService.set('complexArticlesPricesTableParams', tableParams);
        localStorageService.set('locationsPricesComplex', $scope.location);
        var parametros = Object.assign(params.url(), { id_location: $scope.location });
        ComplexArticlesPricesService.get(parametros, function(response) {
          params.total(response.total);
          $scope.articulos = response.articulos;
          $scope.complex_articles = response.results;
          originalData = angular.copy($scope.complex_articles);
          $defer.resolve($scope.complex_articles);
        });
      }
    };

    //Estados para filtrar.
    $scope.states = StatesService.getStatesFilter();

    //Subgrupos para filtrar.
    $scope.subgroups = [{ 'id': '0', title: 'Todos' }];
    var getSubgroupsFilter = function () {
      SubgroupsService.query({
        complex: true
      }).$promise.then(function(data) {
        for(var d = 0; d < data.length; d++){
          $scope.subgroups.push({ 'id': data[d].id_subgroup, 'title': data[d].name });
        }
      });
    };
    getSubgroupsFilter();

    //Filtros de las localidades.
    $scope.locationOptions = [];
    var getLocationsFilter = function () {
      LocationsService.getLocations().then(function(locations) {
        $scope.locationOptions = locations;
        var locationsPricesComplex = localStorageService.get('locationsPricesComplex');
        if (locationsPricesComplex !== null) {
          $scope.location = locationsPricesComplex;
        } else{
          $scope.location = $scope.locationOptions[0].id_location;
        }

        //************************************* NgTableParams **************************************
        //Se genera la tabla de articulos.
        self.tableParams = new NgTableParams(tableParams, tableSettings);

        //Se observa el cambio de parametros y se los va guardando en el localStorage.
        $scope.$watch('tableParams', function () {
          localStorageService.set('complexArticlesPricesTableParams', tableParams);
        }, true);
      });
    };
    getLocationsFilter();

    //***************************************** Groupability ***************************************
    self.isGroupHeaderRowVisible = true;
    self.isGroupable = isGroupable;
    self.toggleGroupability = toggleGroupability;

    /**
     * Retorna si es posible agrupar por la columna en cuestion.
     * @param  {[type]}  $column [description]
     * @return {Boolean}         [description]
     */
    function isGroupable($column){
      return !!$column.groupable() || $column.groupField;
    }

    /**
     * Cambiar por la columna que se quiera agrupar.
     * @param  {[type]} $column [description]
     * @return {[type]}         [description]
     */
    function toggleGroupability($column){
      if ($column.groupable()) {
        $column.groupField = $column.groupable();
        $column.groupable.assign(self, false);
      } else {
        $column.groupable.assign(self, $column.groupField);
      }
    }

    //***************************************** Edition ***************************************
    self.cancelChanges = cancelChanges;
    self.hasChanges = hasChanges;
    self.setEditing = setEditing;
    self.isEditing = false;
    self.updateFiledsPrice = updateFiledsPrice;

    function cancelChanges(complex_article, rowForm) {
      var currentPage = self.tableParams.page();
      if(complex_article !== undefined && complex_article !== null){
        var originalRow = resetTableStatus(complex_article, rowForm);
        angular.extend(complex_article, originalRow);
        currentPage = self.tableParams.page();
        self.tableParams.page(currentPage);
      } else{
        resetTableStatus(complex_article, rowForm);
      }
    }

    function hasChanges(complex_article, rowForm) {
      if(complex_article !== undefined && complex_article !== null){
        return rowForm.$dirty;
      } else{
        return self.tableForm.$dirty;
      }
    }

    function setEditing(complex_article, value) {
      if(complex_article !== undefined && complex_article !== null){
        complex_article.isEditing = value;
      } else{
        self.isEditing = value;
      }
    }

    function resetTableStatus(complex_article, rowForm) {
      self.setEditing(complex_article, false);
      if(complex_article !== undefined && complex_article !== null){
        rowForm.$setPristine();
        for (var i in originalData){
          if(originalData[i].id_complex_article === complex_article.id_complex_article){
            originalData[i].precio_cambiado = complex_article.precio_cambiado;
            originalData[i].purchase_price = complex_article.purchase_price;
            return originalData[i];
          }
        }
      } else{
        self.tableParams.reload();
      }
    }

    /**
     * Se actualizan los demas campos de la carga de precios.
     * @param  {[type]} complex_article [description]
     * @param  {[type]} field   [description]
     * @return {[type]}         [description]
     */
    function updateFiledsPrice(complex_article, field){
      var purchase_price = complex_article.purchase_price;
      var coeficient = complex_article.coeficient;
      var price = complex_article.price;

      //Si existen todos los valores, se calculo o el precio o el coeficiente.
      if(purchase_price !== undefined && purchase_price !== null && purchase_price !== '')
        try {
          if(field === 'coeficient'){
            if(coeficient !== undefined && coeficient !== null && coeficient !== ''){
              //PUV = (PTC/CTC) * EQ * COEF
              complex_article.price = purchase_price * coeficient;
            }
          } else if(field === 'price'){
            if(price !== undefined && price !== null && price !== ''){
              //COEF = (PUV/EQ) *(CTC/PTC)
              complex_article.coeficient = price/purchase_price;
            }
          } else{
            if(coeficient !== undefined && coeficient !== null && coeficient !== ''){
              //PUV = (PTC/CTC) * EQ * COEF
              complex_article.price = purchase_price * coeficient;
            } else if(price !== undefined && price !== null && price !== ''){
              //COEF = (PUV/EQ) *(CTC/PTC)
              complex_article.coeficient = price/purchase_price;
            }
          }
        } catch(e) {
          console.log(e);
        }
    }

    $scope.setPurchasePrice = function(complex_article){
      var articles = $scope.articulos[complex_article.id_complex_article];
      for (var i = 0; i < articles.length; i++) {
        var article = articles[i];
        if(complex_article.purchase_price === undefined || complex_article.purchase_price === null){
          complex_article.purchase_price = 0;
        }
        if(complex_article.price_created === null || complex_article.price_created < article.purchase_created){
          complex_article.precio_cambiado = 'precio_cambiado';
        }
        var precio_compra = (article.purchase_price/article.equivalence) * article.equivalence_complex;
        complex_article.purchase_price += precio_compra;
      }
    };

    //************************************ Checkboxes **************************************
    $scope.checkboxes = { 'checked': false, items: {} };

    // watch for check all checkbox
    $scope.$watch('checkboxes.checked', function(value) {
      angular.forEach($scope.complex_articles, function(item) {
        if (angular.isDefined(item.id_complex_article)) {
          $scope.checkboxes.items[item.id_complex_article] = value;
        }
      });
    });

    // watch for data checkboxes
    $scope.$watch('checkboxes.items', function(values) {
      if (!$scope.complex_articles) {
        return;
      }
      var checked = 0;
      var unchecked = 0;
      var total = $scope.complex_articles.length;
      angular.forEach($scope.complex_articles, function(item) {
        checked += ($scope.checkboxes.items[item.id_complex_article]) || 0;
        unchecked += (!$scope.checkboxes.items[item.id_complex_article]) || 0;
      });
      if ((parseInt(unchecked) === 0) || (parseInt(checked) === 0)) {
        $scope.checkboxes.checked = (parseInt(checked) === parseInt(total));
      }
      // grayed checkbox
      angular.element(document.getElementById('select_all')).prop('indeterminate', (parseInt(checked) !== 0 && parseInt(unchecked) !== 0));
    }, true);

    //************************************* Actions **************************************
    $scope.changeLocation = function(){
      localStorageService.set('locationsPricesComplex', $scope.location);
      self.tableParams.reload();
    };

    // Load Price.
    self.loadPrice = function(complex_article) {
      var complex_articles = [];
      if(complex_article !== undefined && complex_article !== null){//Si se estan agregando las compras de un articulo solo.
        if(complex_article.purchase_price === undefined || complex_article.purchase_price === null){
          return;
        }
        var purchase_price = complex_article.price;
        var coeficient = complex_article.coeficient;
        var price = complex_article.price;
        if(purchase_price === undefined || purchase_price === null || purchase_price === '' ||
          coeficient === undefined || coeficient === null|| coeficient === '' ||
          price === undefined || price === null || price === ''){
          return;
        }

        complex_articles.push(complex_article);
      } else{
        angular.forEach($scope.complex_articles, function(item) {
          if (angular.isDefined(item.id_complex_article) && $scope.checkboxes.items[item.id_complex_article]) {
            complex_articles.push(item);
          }
        });
      }

      //Si la cantidad de articulos es mayor a cero, hago la llamada ajax.
      if(complex_articles.length > 0 && $scope.location !== undefined && $scope.location !== null && $scope.location !== ''){
        //Genero los parametros a enviar.
        var ajax_params = {
          complex_articles: complex_articles,
          id_location: $scope.location
        };
        ComplexArticlesPricesService
        .loadPrice(ajax_params)
        .$promise.then(function (result) {
          if(result[0].error){
            sweet.show(result[0].msg);
          }
          self.tableParams.reload();
          self.setEditing(null, false);
        }, function(error) {
          console.log(error);
        });
      }
    };

    // Habilitar o deshabilitar los articulos.
    self.enableArticle = function(complex_article, type) {
      var complex_articles = [];
      if(complex_article !== undefined && complex_article !== null){//Si se esta habilitando/deshabilitando un articulo solo.
        complex_articles.push({ id_complex_article: complex_article.id_complex_article });
      } else{
        angular.forEach($scope.complex_articles, function(item) {
          if (angular.isDefined(item.id_complex_article) && $scope.checkboxes.items[item.id_complex_article]) {
            var complex_article = {};
            if(type === true){//Habilitar.
              if(!item.enabled){
                complex_article = { id_complex_article: item.id_complex_article };
                complex_articles.push(complex_article);
              }
            } else if(type === false){//Deshabilitar.
              if(item.enabled){
                complex_article = { id_complex_article: item.id_complex_article };
                complex_articles.push(complex_article);
              }
            }
          }
        });
      }

      //Si la cantidad ed articulos es mayor a cero, hago la llamada ajax.
      if(complex_articles.length > 0 && $scope.location !== undefined && $scope.location !== null && $scope.location !== ''){
        //Genero los parametros a enviar.
        var ajax_params = {
          complex_articles: complex_articles,
          id_location: $scope.location,
          type: type
        };
        ComplexArticlesPricesService
        .enableArticle(ajax_params)
        .$promise.then(function (result) {
          if(result[0].error){
            sweet.show(result[0].msg);
          }
          self.tableParams.reload();
        }, function(error) {
          console.log(error);
        });
      }
    };

    $scope.verComplexArticleDetail = function(complex_article){
      var articles = $scope.articulos[complex_article.id_complex_article];
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
      html += '    <th class="center">Precio Unit. Compra</th>';
      html += '  </tr>';
      for (var i = 0; i < articles.length; i++) {
        var article = articles[i];
        var purchase_price = article.purchase_price !== null ? ((article.purchase_price/article.equivalence)*article.equivalence_complex).toFixed(2) : '--';
        html += '  <tr>';
        html += '    <td>' + article.full_code + '</td>';
        html += '    <td>' + article.name + '</td>';
        html += '    <td>' + article.scale + ' ' + article.measurement_unit_abbreviation_plural + '</td>';
        html += '    <td>' + article.scale_complex + ' ' + article.measurement_unit_abbreviation_plural_complex + '</td>';
        html += '    <td>' + article.equivalence + ' ' + article.measurement_unit_equivalence_abbreviation + '</td>';
        html += '    <td>' + article.equivalence_complex + ' ' + article.measurement_unit_equivalence_abbreviation_plural + '</span></td>';
        html += '    <td>$' + purchase_price + '</td>';
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
