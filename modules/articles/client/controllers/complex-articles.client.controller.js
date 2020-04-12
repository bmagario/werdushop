(function () {
  'use strict';

  // Articles controller
  angular
    .module('articles')
    .controller('ComplexArticlesController', ComplexArticlesController);

  ComplexArticlesController.$inject = ['$scope', '$rootScope', '$state', 'Authentication', 'ComplexArticlesService', 'complexArticleResolve','SubgroupsService','BrandsService', 'MeasurementUnitsService', 'StatesService', '$timeout', '$window', 'FileUploader'];

  function ComplexArticlesController ($scope, $rootScope, $state, Authentication, ComplexArticlesService, complexArticle, SubgroupsService, BrandsService, MeasurementUnitsService, StatesService, $timeout, $window, FileUploader) {
    var vm = this;
    vm.authentication = Authentication;
    vm.complex_article = complexArticle;
    console.log(vm.complex_article.articles);
    if(vm.complex_article.articles === undefined || vm.complex_article.articles === null){
      vm.complex_article.articles = [];
    }
    var originalData = angular.copy(vm.complex_article.articles);

    //Subgrupos para filtrar.
    vm.subgroupOptions = [];
    var getSubgroupsFilter = function () {
      SubgroupsService.query({
        complex: true
      }).$promise.then(function(data) {
        vm.subgroupOptions = data;
        //Se establece el subgrupo por defecto si es el caso de un alta.
        if(vm.complex_article.id_subgroup === undefined){
          vm.complex_article.id_subgroup = vm.subgroupOptions[0].id_subgroup;
        }
      });
    };
    getSubgroupsFilter();

    //Unidades de Medida para filtrar.
    vm.measurementUnitOptions = [];
    var getMeasurementUnitsFilter = function () {
      MeasurementUnitsService.query().$promise.then(function(data) {
        vm.measurementUnitOptions = data;
      });
    };
    getMeasurementUnitsFilter();

    //Funciones y variables varias.
    vm.error = null;
    vm.form = {};
    vm.save = save;
    vm.remove = remove;
    vm.change_article = change_article;
    vm.atras = $rootScope.atras;
    vm.go_articulos = go_articulos;

    //Ir al listado de articulos.
    function go_articulos() {
      $state.go('complex_articles.list');
    }

    //Save Article.
    function save(isValid) {
      console.log(isValid);
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.complexArticleForm');
        return false;
      }

      if (vm.complex_article.id_complex_article) {
        vm.complex_article.$update(successCallback, errorCallback);
      } else {
        vm.complex_article.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('complex_articles.edit', {
          complexArticleId: res.id_complex_article
        }, {
          reload: true
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }

    function remove(article){
      var index = -1;
      for(var i = vm.complex_article.articles.length - 1; i >= 0; i--) {
        if(vm.complex_article.articles[i].id_article === article.id_article) {
          index = i;
          break;
        }
      }
      if(index >= 0){
        if(vm.complex_article.id_complex_article){
          var ajax_params = {
            id_complex_article: vm.complex_article.id_complex_article,
            article: vm.complex_article.articles[index]
          };
          ComplexArticlesService
          .removeArticle(ajax_params)
          .$promise.then(function (result) {
            vm.complex_article.articles.splice(index, 1);

            //Se guarda la data original de los articulos.
            originalData = angular.copy(vm.complex_article.articles);
          }, function(error) {
            console.log(error);
          });
        } else {
          vm.complex_article.articles.splice(index, 1);
        }
      }
    }

    function change_article(article){
      if(vm.complex_article.id_complex_article){
        var ajax_params = {
          id_complex_article: vm.complex_article.id_complex_article,
          article: article
        };
        ComplexArticlesService
        .addArticle(ajax_params)
        .$promise.then(function (result) {
          vm.setEditing(article, false);
        }, function(error) {
          console.log(error);
        });
      }
    }

    /**
     * Metodo para agregar el articulo al articulo complejo.
     */
    $scope.addArticle = function() {
      if(vm.articleSelected){
        var esta = false;
        //Verifico que el articulo no haya sido agregado anteriormente.
        angular.forEach(vm.complex_article.articles, function(item) {
          if (vm.articleSelected.id_article === item.id_article) {
            esta = true;
            return;
          }
        });

        //En cuyo caso se agrega el mismo al scope.
        if(!esta){
          vm.articleSelected.id_measurement_unit_scale = vm.articleSelected.id_measurement_unit;
          vm.articleSelected.scale_complex = vm.articleSelected.scale;
          vm.articleSelected.equivalence_complex = vm.articleSelected.equivalence;
          if(vm.complex_article.id_complex_article){
            var ajax_params = {
              id_complex_article: vm.complex_article.id_complex_article,
              article: vm.articleSelected
            };
            ComplexArticlesService
            .addArticle(ajax_params)
            .$promise.then(function (result) {
              vm.complex_article.articles.push(vm.articleSelected);

              //Se guarda la data original de los articulos.
              originalData = angular.copy(vm.complex_article.articles);
            }, function(error) {
              console.log(error);
            });
          } else {
            vm.complex_article.articles.push(vm.articleSelected);
            vm.articleSelected = null;
          }
        }
      }
    };

    //Busqueda de articulos.
    $scope.getArticles = function(name) {
      var ajax_params = {
        name: name
      };

      return ComplexArticlesService
        .getArticles(ajax_params)
        .$promise.then(function (result) {
          return result.map(function(item){
            return item;
          });
        }, function(error) {
          console.log(error);
        });
    };

    //Edicion.
    vm.cancelChanges = cancelChanges;
    vm.hasChanges = hasChanges;
    vm.setEditing = setEditing;

    function cancelChanges(article, rowForm) {
      var originalRow = resetTableStatus(article, rowForm);
      angular.extend(article, originalRow);
    }

    function hasChanges(article, rowForm) {
      return rowForm.$dirty;
    }

    function setEditing(article, value) {
      article.isEditing = value;
    }

    function resetTableStatus(article, rowForm) {
      vm.setEditing(article, false);
      rowForm.$setPristine();
      for (var i in originalData){
        if(originalData[i].id_article === article.id_article){
          return originalData[i];
        }
      }
    }

    //########################################### EFFECTIVE DATE ###########################################
    $scope.dateTimeNow = function() {
      $scope.date = new Date();
    };
    $scope.dateTimeNow();

    $scope.toggleMinDate = function() {
      $scope.minDate = $scope.minDate ? null : new Date();
    };

    $scope.toggleMinDate();
    $scope.disabled = false;

    $scope.dateOptions = {
      startingDay: 1,
      showWeeks: false,
      todayText: 'HOLA'
    };

    $scope.disable = function() {
      $scope.disabled = !$scope.disabled;
    };

    $scope.hourStep = 1;
    $scope.minuteStep = 15;
    $scope.timeOptions = {
      hourStep: [1, 2, 3],
      minuteStep: [1, 5, 10, 15, 25, 30]
    };

    $scope.showMeridian = false;
    $scope.timeToggleMode = function() {
      $scope.showMeridian = !$scope.showMeridian;
    };

/*    datepickerPopupConfig.showButtonBar = true;
    datepickerPopupConfig.todayText = 'Hoy';
    datepickerPopupConfig.closeText = 'Cerrar';
    datepickerPopupConfig.clearText = 'Limpiar';*/

    /* ############################################ IMAGE HANDLER #######################################*/
    vm.article_image_url = vm.complex_article.article_image_url;

    // Create file uploader instance
    vm.uploader = new FileUploader({
      url: '/api/complex_articles_image/'+vm.complex_article.id_complex_article,
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

    // Called after the complex_article selected a new picture file
    vm.uploader.onAfterAddingFile = function (fileItem) {
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

    // Called after the complex_article has successfully uploaded a new picture
    vm.uploader.onSuccessItem = function (fileItem, response, status, headers) {
      // Show success message
      vm.success = true;

      // Populate complex_article object
      vm.complex_article = response;

      // Clear upload buttons
      vm.cancelUpload();

      //Ir al listado de articulos.
      /*$state.go('complex_articles.list');*/
    };

    // Called after the complex_article has failed to uploaded a new picture
    vm.uploader.onErrorItem = function (fileItem, response, status, headers) {
      // Clear upload buttons
      vm.cancelUpload();

      // Show error message
      vm.error = response.message;
    };

    // Change complex_article profile picture
    vm.uploadProfilePicture = function () {
      // Clear messages
      vm.success = vm.error = null;

      // Start upload
      vm.uploader.uploadAll();
    };

    // Cancel the upload process
    vm.cancelUpload = function () {
      vm.uploader.clearQueue();
      vm.article_image_url = vm.complex_article.article_image_url;
    };
  }
})();
