(function () {
  'use strict';
  angular
    .module('articles')
    .controller('ArticlesPricesController', ArticlesPricesController);

  ArticlesPricesController.$inject = ['$scope', '$state', 'LocationsService', 'ArticlesPricesService', 'SubgroupsService', 'BrandsService', 'StatesService', 'NgTableParams', 'localStorageService', 'sweet'];

  function ArticlesPricesController($scope, $state, LocationsService, ArticlesPricesService, SubgroupsService, BrandsService, StatesService, NgTableParams, localStorageService, sweet) {
    var self = this;

    //Parametros de la tabla de articulos.
    var tableParams = {};
    var originalData = {};
    var articlesTableParams = localStorageService.get('articlesPricesTableParams');
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
        localStorageService.set('articlesPricesTableParams', tableParams);
        localStorageService.set('locationsPrices', $scope.location);
        var parametros = Object.assign(params.url(), { id_location: $scope.location });
        ArticlesPricesService.get(parametros, function(response) {
          params.total(response.total);
          $scope.articles = response.results;
          originalData = angular.copy($scope.articles);
          $defer.resolve($scope.articles);
        });
      }
    };

    //Estados para filtrar.
    $scope.states = StatesService.getStatesFilter();

    //Subgrupos para filtrar.
    $scope.subgroups = [{ 'id': '0', title: 'Todos' }];
    var getSubgroupsFilter = function () {
      SubgroupsService.query({
        all: true
      }).$promise.then(function(data) {
        for(var d = 0; d < data.length; d++){
          $scope.subgroups.push({ 'id': data[d].id_subgroup, 'title': data[d].name });
        }
      });
    };
    getSubgroupsFilter();

    //Marcas para filtrar.
    $scope.brands = [{ 'id': '0', title: 'Todas' }];
    var getBrandsFilter = function () {
      BrandsService.query({
        all: true
      }).$promise.then(function(data) {
        for(var d = 0; d < data.length; d++){
          $scope.brands.push({ 'id': data[d].id_brand, 'title': data[d].name });
        }
      });
    };
    getBrandsFilter();

    //Marcas para filtrar.
    $scope.locationOptions = [{ 'id_location': '1', description: 'Bahía Blanca' , province_description: 'Buenos Aires' }, { 'id_location': '2', description: 'Capital' , province_description: 'CABA' }];
    var locationsPrices = localStorageService.get('locationsPrices');
    if (locationsPrices !== null) {
      $scope.location = locationsPrices;
    } else{
      $scope.location = $scope.locationOptions[0].id_location;
    }
    //Filtros de las localidades.
    $scope.locationOptions = [];
    var getLocationsFilter = function () {
      LocationsService.getLocations().then(function(locations) {
        $scope.locationOptions = locations;
        var locationsPrices = localStorageService.get('locationsPrices');
        if (locationsPrices !== null) {
          $scope.location = locationsPrices;
        } else{
          $scope.location = $scope.locationOptions[0].id_location;
        }

        //************************************* NgTableParams **************************************
        //Se genera la tabla de articulos.
        self.tableParams = new NgTableParams(tableParams, tableSettings);

        //Se observa el cambio de parametros y se los va guardando en el localStorage.
        $scope.$watch('tableParams', function () {
          localStorageService.set('articlesPricesTableParams', tableParams);
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

    function cancelChanges(article, rowForm) {
      var currentPage = self.tableParams.page();
      if(article !== undefined && article !== null){
        var originalRow = resetTableStatus(article, rowForm);
        angular.extend(article, originalRow);
        currentPage = self.tableParams.page();
        self.tableParams.page(currentPage);
      } else{
        resetTableStatus(article, rowForm);
      }
    }

    function hasChanges(article, rowForm) {
      if(article !== undefined && article !== null){
        return rowForm.$dirty;
      } else{
        return self.tableForm.$dirty;
      }
    }

    function setEditing(article, value) {
      if(article !== undefined && article !== null){
        article.isEditing = value;
      } else{
        self.isEditing = value;
      }
    }

    function resetTableStatus(article, rowForm) {
      self.setEditing(article, false);
      if(article !== undefined && article !== null){
        rowForm.$setPristine();
        for (var i in originalData){
          if(originalData[i].id_article === article.id_article){
            return originalData[i];
          }
        }
      } else{
        self.tableParams.reload();
      }
    }

    /**
     * Se actualizan los demas campos de la carga de precios.
     * @param  {[type]} article [description]
     * @param  {[type]} field   [description]
     * @return {[type]}         [description]
     */
    function updateFiledsPrice(article, field){
      var equivalence = article.equivalence;
      var purchase_price = article.purchase_price;
      var coeficient = article.coeficient;
      var price = article.price;

      //Si existen todos los valores, se calculo o el precio o el coeficiente.
      if(equivalence !== undefined && equivalence !== null && equivalence !== '' &&
        purchase_price !== undefined && purchase_price !== null && purchase_price !== '')
        try {
          if(field === 'coeficient'){
            if(coeficient !== undefined && coeficient !== null && coeficient !== ''){
              //PUV = (PTC/CTC) * EQ * COEF
              article.price = purchase_price * coeficient;
            }
          } else if(field === 'price'){
            if(price !== undefined && price !== null && price !== ''){
              //COEF = (PUV/EQ) *(CTC/PTC)
              article.coeficient = price/purchase_price;
            }
          } else{
            if(coeficient !== undefined && coeficient !== null && coeficient !== ''){
              //PUV = (PTC/CTC) * EQ * COEF
              article.price = purchase_price * coeficient;
            } else if(price !== undefined && price !== null && price !== ''){
              //COEF = (PUV/EQ) *(CTC/PTC)
              article.coeficient = price/purchase_price;
            }
          }
        } catch(e) {
          console.log(e);
        }
    }

    //************************************ Checkboxes **************************************
    $scope.checkboxes = { 'checked': false, items: {} };

    // watch for check all checkbox
    $scope.$watch('checkboxes.checked', function(value) {
      angular.forEach($scope.articles, function(item) {
        if (angular.isDefined(item.id_article)) {
          $scope.checkboxes.items[item.id_article] = value;
        }
      });
    });

    // watch for data checkboxes
    $scope.$watch('checkboxes.items', function(values) {
      if (!$scope.articles) {
        return;
      }
      var checked = 0;
      var unchecked = 0;
      var total = $scope.articles.length;
      angular.forEach($scope.articles, function(item) {
        checked += ($scope.checkboxes.items[item.id_article]) || 0;
        unchecked += (!$scope.checkboxes.items[item.id_article]) || 0;
      });
      if ((parseInt(unchecked) === 0) || (parseInt(checked) === 0)) {
        $scope.checkboxes.checked = (parseInt(checked) === parseInt(total));
      }
      // grayed checkbox
      angular.element(document.getElementById('select_all')).prop('indeterminate', (parseInt(checked) !== 0 && parseInt(unchecked) !== 0));
    }, true);

    //************************************* Actions **************************************
    $scope.changeLocation = function(){
      localStorageService.set('locationsPrices', $scope.location);
      self.tableParams.reload();
    };

    // Load Price.
    self.loadPrice = function(article) {
      var articles = [];
      if(article !== undefined && article !== null){//Si se estan agregando las compras de un articulo solo.
        if(article.purchase_price === undefined || article.purchase_price === null){
          return;
        }
        var purchase_price = article.price;
        var coeficient = article.coeficient;
        var price = article.price;
        if(purchase_price === undefined || purchase_price === null || purchase_price === '' ||
          coeficient === undefined || coeficient === null|| coeficient === '' ||
          price === undefined || price === null || price === ''){
          return;
        }

        articles.push(article);
      } else{
        angular.forEach($scope.articles, function(item) {
          if (angular.isDefined(item.id_article) && $scope.checkboxes.items[item.id_article]) {
            articles.push(item);
          }
        });
      }

      //Si la cantidad de articulos es mayor a cero, hago la llamada ajax.
      if(articles.length > 0 && $scope.location !== undefined && $scope.location !== null && $scope.location !== ''){
        //Genero los parametros a enviar.
        var ajax_params = {
          articles: articles,
          id_location: $scope.location
        };
        ArticlesPricesService
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
    self.enableArticle = function(article, type) {
      var articles = [];
      if(article !== undefined && article !== null){//Si se esta habilitando/deshabilitando un articulo solo.
        articles.push({ id_article: article.id_article });
      } else{
        angular.forEach($scope.articles, function(item) {
          if (angular.isDefined(item.id_article) && $scope.checkboxes.items[item.id_article]) {
            var article = {};
            if(type === true){//Habilitar.
              if(!item.enabled){
                article = { id_article: item.id_article };
                articles.push(article);
              }
            } else if(type === false){//Deshabilitar.
              if(item.enabled){
                article = { id_article: item.id_article };
                articles.push(article);
              }
            }
          }
        });
      }

      //Si la cantidad ed articulos es mayor a cero, hago la llamada ajax.
      if(articles.length > 0 && $scope.location !== undefined && $scope.location !== null && $scope.location !== ''){
        //Genero los parametros a enviar.
        var ajax_params = {
          articles: articles,
          id_location: $scope.location,
          type: type
        };
        ArticlesPricesService
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
  }
})();
