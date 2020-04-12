(function () {
  'use strict';

  // Articles controller
  angular
    .module('articles')
    .controller('ArticlesController', ArticlesController);

  ArticlesController.$inject = ['$scope', '$rootScope', '$state', 'Authentication', 'articleResolve','SubgroupsService','BrandsService', 'MeasurementUnitsService', 'StatesService', '$timeout', '$window', 'FileUploader'];

  function ArticlesController ($scope, $rootScope, $state, Authentication, article, SubgroupsService, BrandsService, MeasurementUnitsService, StatesService, $timeout, $window, FileUploader) {
    var vm = this;
    vm.authentication = Authentication;
    vm.article = article;

    //Se obtienen los estados y se selecciona la opcion default para el caso de un update.
    vm.stateOptions = StatesService.getStatesArticles();
    //Se establece el estado por defecto si es el caso de un alta.
    if(vm.article.id_status === undefined){
      vm.article.id_status = vm.stateOptions[0].id_status;
    }

    //Subgrupos para filtrar.
    vm.subgroupOptions = [];
    var getSubgroupsFilter = function () {
      SubgroupsService.query({
        no_complex: true
      }).$promise.then(function(data) {
        vm.subgroupOptions = data;
        //Se establece el subgrupo por defecto si es el caso de un alta.
        if(vm.article.id_subgroup === undefined){
          vm.article.id_subgroup = vm.subgroupOptions[0].id_subgroup;
        }
      });
    };
    getSubgroupsFilter();

    //Marcas para filtrar.
    vm.brandOptions = [];
    var getBrandsFilter = function () {
      BrandsService.query({
        all: true
      }).$promise.then(function(data) {
        vm.brandOptions = data;
      });
    };
    getBrandsFilter();

    //****************************************************** Temporada ****************************************************
    //Si aun no se han creado la temporada.
    vm.season = {
      0: { 'name': 'ALTA','abbreviation': 'A' },
      1: { 'name': 'MEDIA','abbreviation': 'M' },
      2: { 'name': 'BAJA','abbreviation': 'B' },
      3: { 'name': 'NULA','abbreviation': 'N' }
    };
    if(vm.article.season_1 === undefined || vm.article.season_1 === null){
      vm.article.season_1 = 3;
    }
    if(vm.article.season_2 === undefined || vm.article.season_2 === null){
      vm.article.season_2 = 3;
    }
    if(vm.article.season_3 === undefined || vm.article.season_3 === null){
      vm.article.season_3 = 3;
    }
    if(vm.article.season_4 === undefined || vm.article.season_4 === null){
      vm.article.season_4 = 3;
    }
    if(vm.article.season_5 === undefined || vm.article.season_5 === null){
      vm.article.season_5 = 3;
    }
    if(vm.article.season_6 === undefined || vm.article.season_6 === null){
      vm.article.season_6 = 3;
    }
    if(vm.article.season_7 === undefined || vm.article.season_7 === null){
      vm.article.season_7 = 3;
    }
    if(vm.article.season_8 === undefined || vm.article.season_8 === null){
      vm.article.season_8 = 3;
    }
    if(vm.article.season_9 === undefined || vm.article.season_9 === null){
      vm.article.season_9 = 3;
    }
    if(vm.article.season_10 === undefined || vm.article.season_10 === null){
      vm.article.season_10 = 3;
    }
    if(vm.article.season_11 === undefined || vm.article.season_11 === null){
      vm.article.season_11 = 3;
    }
    if(vm.article.season_12 === undefined || vm.article.season_12 === null){
      vm.article.season_12 = 3;
    }

    vm.seasonJanuaryOptions = [
      { 'month': 1, 'name': 'ALTA', 'abbreviation': 'A', 'index': 0 },
      { 'month': 1, 'name': 'MEDIA', 'abbreviation': 'M', 'index': 1 },
      { 'month': 1, 'name': 'BAJA', 'abbreviation': 'B', 'index': 2 },
      { 'month': 1, 'name': 'NULA', 'abbreviation': 'N', 'index': 3 }
    ];

    vm.seasonFebruaryOptions = [
      { 'month': 2, 'name': 'ALTA', 'abbreviation': 'A', 'index': 0 },
      { 'month': 2, 'name': 'MEDIA', 'abbreviation': 'M', 'index': 1 },
      { 'month': 2, 'name': 'BAJA', 'abbreviation': 'B', 'index': 2 },
      { 'month': 2, 'name': 'NULA', 'abbreviation': 'N', 'index': 3 }
    ];

    vm.seasonMarchOptions = [
      { 'month': 3, 'name': 'ALTA', 'abbreviation': 'A', 'index': 0 },
      { 'month': 3, 'name': 'MEDIA', 'abbreviation': 'M', 'index': 1 },
      { 'month': 3, 'name': 'BAJA', 'abbreviation': 'B', 'index': 2 },
      { 'month': 3, 'name': 'NULA', 'abbreviation': 'N', 'index': 3 }
    ];

    vm.seasonAprilOptions = [
      { 'month': 4, 'name': 'ALTA', 'abbreviation': 'A', 'index': 0 },
      { 'month': 4, 'name': 'MEDIA', 'abbreviation': 'M', 'index': 1 },
      { 'month': 4, 'name': 'BAJA', 'abbreviation': 'B', 'index': 2 },
      { 'month': 4, 'name': 'NULA', 'abbreviation': 'N', 'index': 3 }
    ];

    vm.seasonMayOptions = [
      { 'month': 5, 'name': 'ALTA', 'abbreviation': 'A', 'index': 0 },
      { 'month': 5, 'name': 'MEDIA', 'abbreviation': 'M', 'index': 1 },
      { 'month': 5, 'name': 'BAJA', 'abbreviation': 'B', 'index': 2 },
      { 'month': 5, 'name': 'NULA', 'abbreviation': 'N', 'index': 3 }
    ];

    vm.seasonJuneOptions = [
      { 'month': 6, 'name': 'ALTA', 'abbreviation': 'A', 'index': 0 },
      { 'month': 6, 'name': 'MEDIA', 'abbreviation': 'M', 'index': 1 },
      { 'month': 6, 'name': 'BAJA', 'abbreviation': 'B', 'index': 2 },
      { 'month': 6, 'name': 'NULA', 'abbreviation': 'N', 'index': 3 }
    ];

    vm.seasonJulyOptions = [
      { 'month': 7, 'name': 'ALTA', 'abbreviation': 'A', 'index': 0 },
      { 'month': 7, 'name': 'MEDIA', 'abbreviation': 'M', 'index': 1 },
      { 'month': 7, 'name': 'BAJA', 'abbreviation': 'B', 'index': 2 },
      { 'month': 7, 'name': 'NULA', 'abbreviation': 'N', 'index': 3 }
    ];

    vm.seasonAugustOptions = [
      { 'month': 8, 'name': 'ALTA', 'abbreviation': 'A', 'index': 0 },
      { 'month': 8, 'name': 'MEDIA', 'abbreviation': 'M', 'index': 1 },
      { 'month': 8, 'name': 'BAJA', 'abbreviation': 'B', 'index': 2 },
      { 'month': 8, 'name': 'NULA', 'abbreviation': 'N', 'index': 3 }
    ];

    vm.seasonSeptemberOptions = [
      { 'month': 9, 'name': 'ALTA', 'abbreviation': 'A', 'index': 0 },
      { 'month': 9, 'name': 'MEDIA', 'abbreviation': 'M', 'index': 1 },
      { 'month': 9, 'name': 'BAJA', 'abbreviation': 'B', 'index': 2 },
      { 'month': 9, 'name': 'NULA', 'abbreviation': 'N', 'index': 3 }
    ];

    vm.seasonOctoberOptions = [
      { 'month': 10, 'name': 'ALTA', 'abbreviation': 'A', 'index': 0 },
      { 'month': 10, 'name': 'MEDIA', 'abbreviation': 'M', 'index': 1 },
      { 'month': 10, 'name': 'BAJA', 'abbreviation': 'B', 'index': 2 },
      { 'month': 10, 'name': 'NULA', 'abbreviation': 'N', 'index': 3 }
    ];

    vm.seasonNovemberOptions = [
      { 'month': 11, 'name': 'ALTA', 'abbreviation': 'A', 'index': 0 },
      { 'month': 11, 'name': 'MEDIA', 'abbreviation': 'M', 'index': 1 },
      { 'month': 11, 'name': 'BAJA', 'abbreviation': 'B', 'index': 2 },
      { 'month': 11, 'name': 'NULA', 'abbreviation': 'N', 'index': 3 }
    ];

    vm.seasonDecemberOptions = [
      { 'month': 12, 'name': 'ALTA', 'abbreviation': 'A', 'index': 0 },
      { 'month': 12, 'name': 'MEDIA', 'abbreviation': 'M', 'index': 1 },
      { 'month': 12, 'name': 'BAJA', 'abbreviation': 'B', 'index': 2 },
      { 'month': 12, 'name': 'NULA', 'abbreviation': 'N', 'index': 3 }
    ];

    //Unidades de Medida para filtrar.
    vm.measurementUnitOptions = [];
    var getMeasurementUnitsFilter = function () {
      MeasurementUnitsService.query().$promise.then(function(data) {
        vm.measurementUnitOptions = data;
        //Se establece la unidad de medida por defecto si es el caso de un alta.
        if(vm.article.id_measurement_unit === undefined){
          vm.article.id_measurement_unit = vm.measurementUnitOptions[0].id_measurement_unit;
        }

        //Se establece la unidad de medida por defecto si es el caso de un alta.
        vm.measurementUnitEqOptions = [];
        for (var i = 0; i < data.length; i++) {
          if(data[i].id_measurement_unit === 1 || data[i].id_measurement_unit === 6 || data[i].id_measurement_unit === 10){
            vm.measurementUnitEqOptions.push(data[i]);
          }
        }
        if(vm.article.id_measurement_unit_equivalence === undefined){
          vm.article.id_measurement_unit_equivalence = vm.measurementUnitEqOptions[0].id_measurement_unit;
        }
      });
    };
    getMeasurementUnitsFilter();

        //Unidades de Medida para filtrar.
    vm.fragilityOptions = [];
    var getFragilityFilter = function () {
      vm.fragilityOptions = [{
        fragility: 1,
        description: 'EXTREMADAMENTE FRAGIL'
      },{
        fragility: 2,
        description: 'MUY FRAGIL'
      },{
        fragility: 3,
        description: 'FRAGIL'
      },{
        fragility: 4,
        description: 'FUERTE'
      },{
        fragility: 5,
        description: 'MUY FUERTE'
      }];
      //Se establece la fragilidad por defecto un alta.
      if(vm.article.fragility === undefined){
        vm.article.fragility = vm.fragilityOptions[4].fragility;
      }
    };
    getFragilityFilter();

    //Funciones y variables varias.
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;
    vm.atras = $rootScope.atras;
    vm.go_articulos = go_articulos;

    //Ir al listado de articulos.
    function go_articulos() {
      $state.go('articles.list');
    }

    //Remove existing Article.
    function remove() {
      if (confirm('¿Está seguro que quiere dar de baja a este artículo?')) {
        vm.article.$remove($state.go('articles.list'));
      }
    }

    //Save Article.
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.articleForm');
        return false;
      }
      
      if (vm.article.id_article) {
        vm.article.$update(successCallback, errorCallback);
      } else {
        vm.article.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('articles.edit', {
          articleId: res.id_article
        }, {
          reload: true
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }

    /* ############################################ IMAGE HANDLER #######################################*/
    vm.article_image_url = vm.article.article_image_url;
 
    // Create file uploader instance
    vm.uploader = new FileUploader({
      url: '/api/articles_image/'+vm.article.id_article,
      alias: 'newArticlePicture'
    });

    // Set file uploader image filter
    vm.uploader.filters.push({
      name: 'imageFilter',
      fn: function (item, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });

    // Called after the article selected a new picture file
    vm.uploader.onAfterAddingFile = function (fileItem) {
      console.log(vm.article.article_image_url);

      if ($window.FileReader) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(fileItem._file);

        fileReader.onload = function (fileReaderEvent) {
          $timeout(function () {
            vm.article_image_url = fileReaderEvent.target.result;
          }, 0);
        };
      }
    };

    // Called after the article has successfully uploaded a new picture
    vm.uploader.onSuccessItem = function (fileItem, response, status, headers) {
      // Show success message
      vm.success = true;

      // Populate article object
      vm.article.article_image_url = response.article_image_url;

      // Clear upload buttons
      vm.cancelUpload();

      //Ir al listado de articulos.
/*      $state.go('articles.list');*/
    };

    // Called after the article has failed to uploaded a new picture
    vm.uploader.onErrorItem = function (fileItem, response, status, headers) {
      console.log(fileItem);
      // Clear upload buttons
      vm.cancelUpload();

      // Show error message
      vm.error = response.message;
    };

    // Change article profile picture
    vm.uploadProfilePicture = function () {
      // Clear messages
      vm.success = vm.error = null;

      // Start upload
      vm.uploader.uploadAll();
    };

    // Cancel the upload process
    vm.cancelUpload = function () {
      vm.uploader.clearQueue();
      vm.article_image_url = vm.article.article_image_url;
    };
  }
})();