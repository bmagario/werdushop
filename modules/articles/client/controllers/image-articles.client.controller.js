(function () {
  'use strict';

  // Articles controller
  angular
  .module('articles')
  .controller('ImageArticlesController', ImageArticlesController);

  ImageArticlesController.$inject = ['$scope', '$rootScope', '$state', 'Authentication', 'articleResolve', '$timeout', '$window', 'FileUploader'];

  function ImageArticlesController ($scope, $rootScope, $state, Authentication, article, $timeout, $window, FileUploader) {
    var vm = this;

    vm.authentication = Authentication;
    vm.article = article;
    vm.error = null;
    vm.atras = $rootScope.atras;
    vm.go_articulos = go_articulos;
    vm.article_image_url = vm.article.article_image_url;

    //Ir al listado de articulos.
    function go_articulos() {
      $state.go('articles.list');
    }
    
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
      vm.article = response;

      // Clear upload buttons
      vm.cancelUpload();

      //Ir al listado de articulos.
      $state.go('articles.list');
    };

    // Called after the article has failed to uploaded a new picture
    vm.uploader.onErrorItem = function (fileItem, response, status, headers) {
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