(function () {
  'use strict';
  angular
    .module('articles')
    .controller('ArticlesSurveysController', ArticlesSurveysController);

  ArticlesSurveysController.$inject = ['$scope', '$state', 'LocationsService', 'ArticlesSurveysService', 'SubgroupsService', 'BrandsService', 'NgTableParams', 'localStorageService', 'sweet'];

  function ArticlesSurveysController($scope, $state, LocationsService, ArticlesSurveysService, SubgroupsService, BrandsService, NgTableParams, localStorageService, sweet) {
    var self = this;

    //Parametros de la tabla de articulos.
    var tableParams = {};
    var originalData = {};
    var articlesTableParams = localStorageService.get('articlesSurveysTableParams');
    if (articlesTableParams !== null) {
      tableParams = articlesTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5,
        filter: { },
        sorting: {
          name: 'asc'
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
        localStorageService.set('articlesSurveysTableParams', tableParams);
        localStorageService.set('locationSurveys', $scope.location);
        var parametros = Object.assign(params.url(), { id_location: $scope.location });
        ArticlesSurveysService.get(parametros, function(response) {
          params.total(response.total);

          //Agrego al scope el listado de articulos.
          $scope.articles = response.results;

          //Agrego al scope la orden de relevamiento.
          $scope.id_survey_order = response.id_survey_order;
          $scope.survey_order_number = response.survey_order_number;
          originalData = angular.copy($scope.articles);
          $defer.resolve($scope.articles);
        });
      }
    };

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

    //Filtros de las localidades.
    $scope.locationOptions = [];
    var getLocationsFilter = function () {
      LocationsService.getLocations().then(function(locations) {
        $scope.locationOptions = locations;
        var locationSurveys = localStorageService.get('locationSurveys');
        if (locationSurveys !== null) {
          $scope.location = locationSurveys;
        } else{
          $scope.location = $scope.locationOptions[0].id_location;
        }

        //************************************* NgTableParams **************************************
        //Se genera la tabla de articulos.
        self.tableParams = new NgTableParams(tableParams, tableSettings);

        //Se observa el cambio de parametros y se los va guardando en el localStorage.
        $scope.$watch('tableParams', function () {
          localStorageService.set('articlesSurveysTableParams', tableParams);
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
    self.updateFieldsSurvey = updateFieldsSurvey;
    self.getClassRow = getClassRow;
    self.controlCarga = controlCarga;

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
    function updateFieldsSurvey(article, field){
      var equivalence = parseFloat(article.equivalence);
      var total_surveyed = parseFloat(article.total_surveyed);
      var total_price = parseFloat(article.total_price);
      var price = parseFloat(article.price);

      //Si existen todos los valores, se calculo o el precio o el coeficiente.
      if(!isNaN(equivalence) &&
        !isNaN(total_price) &&
        !isNaN(total_surveyed) && total_surveyed !== 0){
        try {
          article.price = (total_price/total_surveyed) * equivalence;
        } catch(e) {
          console.log(e);
        }
      }
    }

    //Se obtiene la clase que va a tener la row segun el control de los datos cargados
    function getClassRow(article){
      var codigo = self.controlCarga(article);
      if(codigo === 1){
        return 'cargado_ok';
      }
      return '';
    }

    //Se realiza un control para saber si los datos son los esperados.
    function controlCarga(article){
      var total_surveyed = parseFloat(article.total_surveyed);
      var total_price = parseFloat(article.total_price);
      var price = parseFloat(article.price);
      if(isNaN(total_surveyed) || total_surveyed <= 0 ||
        isNaN(total_price) || total_price <= 0 ||
        isNaN(price) || price <= 0){
        return 0;
      }
      return 1;
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
      localStorageService.set('locationSurveys', $scope.location);
      self.tableParams.reload();
    };

    // Load Survey/PurchasePrice.
    self.loadSurvey = function(article) {
      var articles = [];
      if(article !== undefined && article !== null){//Si se esta cargando el relevamiento de precios de un articulo solo.
        //Se chequea la validez de los valores ingresados.
        var codigo = self.controlCarga(article);
        if(self.controlCarga(article) === 0){
          sweet.show('El articulo a cargar tiene valores inconsistentes');
          return;
        }
        articles.push(article);
      } else{
        var inconsistencias = false;
        for (var i = 0; i < $scope.articles.length; i++) {
          var item = $scope.articles[i];
          if (angular.isDefined(item.id_article) && $scope.checkboxes.items[item.id_article]) {
            //Se chequea la validez de los valores ingresados.
            var codigo_control = self.controlCarga(item);
            if(codigo_control === 0){
              inconsistencias = true;
              break;
            }
            articles.push(item);
          }
        }

        //Si hubo inconsistencias, se levanta el alert.
        if(inconsistencias){
          sweet.show('Existen artículos con valores inconsistentes.');
          return;
        }
      }

      //Si la cantidad de articulos es mayor a cero, hago la llamada ajax.
      if(articles.length > 0 && $scope.id_survey_order !== undefined && $scope.id_survey_order !== null && $scope.id_survey_order !== '' && $scope.location !== undefined && $scope.location !== null && $scope.location !== ''){
        //Genero los parametros a enviar.
        var ajax_params = {
          id_survey_order: $scope.id_survey_order,
          articles: articles,
          id_location: $scope.location
        };
        ArticlesSurveysService
        .loadSurvey(ajax_params)
        .$promise.then(function (result) {
          if(result[0].error){
            sweet.show(result[0].msg);
          } else{
            self.tableParams.reload();
            self.setEditing(null, false);
          }
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
        ArticlesSurveysService
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

    //Busqueda de articulos.
    $scope.getArticles = function(name) {
      var ajax_params = {
        name: name
      };

      return ArticlesSurveysService
        .getArticles(ajax_params)
        .$promise.then(function (result) {
          return result.map(function(item){
            return item;
          });
        }, function(error) {
          console.log(error);
        });
    };

    $scope.addArticuloSurvey = function(){
      if($scope.articleSelected && $scope.location !== undefined && $scope.location !== null && $scope.location !== ''){
        var id_survey_order = null;
        if($scope.id_survey_order !== undefined && $scope.id_survey_order !== null && $scope.id_survey_order !== ''){
          id_survey_order = $scope.id_survey_order;
        }
        var ajax_params = {
          id_survey_order: id_survey_order,
          id_article:  $scope.articleSelected.id_article,
          id_location: $scope.location
        };
        ArticlesSurveysService
        .addArticle(ajax_params)
        .$promise.then(function (result) {
          if(result[0].error){
            sweet.show(result[0].msg);
          }
          self.tableParams.reload();
          $scope.articleSelected = null;
        }, function(error) {
          console.log(error);
        });
      }
    };

    $scope.closeSurveyOrder = function(){
      if($scope.id_survey_order !== undefined && $scope.id_survey_order !== null && $scope.id_survey_order !== '' && $scope.location !== undefined && $scope.location !== null && $scope.location !== ''){
        var ajax_params = {
          id_survey_order:  $scope.id_survey_order,
          id_location: $scope.location
        };
        ArticlesSurveysService
        .closeSurveyOrder(ajax_params)
        .$promise.then(function (result) {
          if(result[0].error){
            sweet.show(result[0].msg);
          } else{
            sweet.show('La orden de relevamiento fue cerrada correctamente.');
            window.location.reload();
          }
        }, function(error) {
          console.log(error);
        });
      }
    };
  }
})();
