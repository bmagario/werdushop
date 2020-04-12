(function () {
  'use strict';
  angular
  .module('articles')
  .controller('PurchaseOrderController', PurchaseOrderController);

  PurchaseOrderController.$inject = ['$scope', 'globals', '$state', 'purchaseOrderResolve', 'PaymentMethodsService', 'ArticlesPurchasesService', 'SubgroupsService', 'BrandsService', 'ProvidersService', 'NgTableParams', 'localStorageService', 'sweet'];

  function PurchaseOrderController($scope, globals, $state, purchase_order, PaymentMethodsService, ArticlesPurchasesService, SubgroupsService, BrandsService, ProvidersService, NgTableParams, localStorageService, sweet) {
    var self = this;
    $scope.purchase_order = purchase_order;

    //Metodos de pago.
    $scope.paymentMethodsOptions = [];
    var getPaymentMethodsPago = function () {
      PaymentMethodsService.getPaymentMethodsPago().then(function(data) {
        $scope.paymentMethodsOptions = data;
      });
    };
    getPaymentMethodsPago();

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

    //Proveedores para filtrar.
    $scope.providerOptions = [];
    $scope.providers = [{ 'id': '0', title: 'Todos' }];
    var getProvidersFilter = function () {
      ProvidersService.query({
        all: true
      }).$promise.then(function(data) {
        $scope.providerOptions = data;
        for(var d = 0; d < data.length; d++){
          $scope.providers.push({ 'id': data[d].id_provider, 'title': data[d].nombre_fantasia });
        }
      });
    };
    getProvidersFilter();

    //Parametros de la tabla de articulos.
    var tableParams = {};
    var originalData = {};
    var articlesTableParams = localStorageService.get('articlesPurchaseOrderTableParams');
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
        localStorageService.set('articlesPurchaseOrderTableParams', tableParams);

        //Se hace con un post. Recordar de tomar los parametros con req.body.
        var ajax_params = {
          id_purchase_order: $scope.purchase_order.id_purchase_order,
          id_location: $scope.purchase_order.id_location
        };

        var parametros = Object.assign(params.url(), ajax_params);
        ArticlesPurchasesService
        .getArticlesPurchaseOrder(parametros)
        .$promise.then(function(response) {
          params.total(response.total);

          //Agrego al scope el listado de articulos.
          $scope.articles = response.results;

          //Se establece el valor del total parcial de la orden de compra.
          $scope.total_valued = response.total_valued;

          //Se guarda la data original de los articulos
          originalData = angular.copy($scope.articles);
          $defer.resolve($scope.articles);
        });
      }
    };

    //Se genera la tabla de articulos.
    self.tableParams = new NgTableParams(tableParams, tableSettings);

    //Se observa el cambio de parametros y se los va guardando en el localStorage.
    $scope.$watch('tableParams', function () {
      localStorageService.set('articlesPurchaseOrderTableParams', tableParams);
    }, true);

    //Agrupacion.
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

    //Edicion.
    self.cancelChanges = cancelChanges;
    self.hasChanges = hasChanges;
    self.setEditing = setEditing;
    self.isEditing = false;
    self.updateFieldsPurchase = updateFieldsPurchase;
    self.getClassRow = getClassRow;
    self.controlCarga = controlCarga;
    self.loadProvider = loadProvider;

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
    function updateFieldsPurchase(article, field){
      var equivalence = parseFloat(article.equivalence);
      var total_dirty = parseFloat(article.total_dirty);
      var total_waste = parseFloat(article.total_waste);
      var total_clean = parseFloat(article.total_clean);
      var total_price = parseFloat(article.total_price);
      var price = parseFloat(article.price);

      if(!isNaN(total_dirty)){
        if(field === 'total_waste'){
          if(!isNaN(total_waste)){
            article.total_clean = total_dirty - total_waste;
          }
        } else if(field === 'total_clean'){
          if(!isNaN(total_clean)){
            article.total_waste = total_dirty - total_clean;
          }
        } else{
          if(!isNaN(total_waste)){
            article.total_clean = total_dirty - total_waste;
          } else if(!isNaN(total_clean)){
            article.total_waste = total_dirty - total_clean;
          }
        }
      }

      //Si existen todos los valores, se calcula o el precio o el coeficiente.
      if(!isNaN(equivalence) &&
      !isNaN(total_price) &&
      !isNaN(total_clean) && total_clean !== 0){
        try {
          article.price = (total_price/total_clean) * equivalence;
        } catch(e) {
          article.price = 0;
          console.log(e);
        }
      } else{
        article.price = 0;
      }
    }

    //Se obtiene la clase que va a tener la row segun el control de los datos cargados
    function getClassRow(article){
      var codigo = self.controlCarga(article);
      if(codigo === globals.OK){
        return 'cargado_ok';
      } else if(codigo === globals.WARNING){
        return 'cargado_warning';
      }
    }

    //Se realiza un control para saber si los datos son los esperados.
    function controlCarga(article){
      var total_dirty = parseFloat(article.total_dirty);
      var total_waste = parseFloat(article.total_waste);
      var total_clean = parseFloat(article.total_clean);
      var total_price = parseFloat(article.total_price);
      var price = parseFloat(article.price);
      if(isNaN(total_dirty) || total_dirty <= 0 ||
      isNaN(total_waste) || total_waste < 0 ||
      isNaN(total_clean) || total_clean <= 0 ||
      isNaN(total_price) || total_price <= 0 ||
      isNaN(price) || price <= 0){
        return globals.ERROR;
      } else if(article.amount > 0 && article.amount > article.total_clean){
        return globals.WARNING;
      }
      return globals.OK;
    }

    //Seleccion de Checkboxes.
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

    //************************************* Actions ****************************
    // Load Purchase/PurchasePrice.
    self.loadPurchase = function(article) {
      var articles = [];
      var articles_warning = [];
      //Si se estan agregando las compras de un articulo solo.
      if(article !== undefined && article !== null){
        //Se chequea la validez de los valores ingresados.
        var codigo = self.controlCarga(article);
        if(self.controlCarga(article) === 0){
          sweet.show({
            title: 'Carga inconsistente',
            text: 'El articulo a cargar tiene valores inconsistentes',
            animation: 'slide-from-top'
          });
          return;
        } else if(codigo === 2){
          articles_warning.push(article);
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
            } else if(codigo_control === 2){
              articles_warning.push(item);
            }
            articles.push(item);
          }
        }

        //Si hubo inconsistencias, se levanta el alert.
        if(inconsistencias){
          sweet.show({
            title: 'Carga inconsistente',
            text: 'Existen artículos con valores inconsistsentes',
            animation: 'slide-from-top'
          });
          return;
        }
      }

      //Si la cantidad de articulos es mayor a cero, hago la llamada ajax.
      if(articles.length > 0){
        //Genero los parametros a enviar.
        var ajax_params = {
          id_purchase_order: $scope.purchase_order.id_purchase_order,
          articles: articles,
          id_location: $scope.purchase_order.id_location,
          id_zone: $scope.purchase_order.id_zone
        };
        ArticlesPurchasesService
        .loadPurchase(ajax_params)
        .$promise.then(function (result) {
          if(result[0].error){
            sweet.show({
              title: 'Error Carga de Compra',
              text: result[0].msg,
              animation: 'slide-from-top'
            });
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

      //Si la cantidad de articulos es mayor a cero, hago la llamada ajax.
      if(articles.length > 0){
        //Genero los parametros a enviar.
        var ajax_params = {
          articles: articles,
          id_location: $scope.purchase_order.id_location,
          type: type
        };
        ArticlesPurchasesService
        .enableArticle(ajax_params)
        .$promise.then(function (result) {
          if(result[0].error){
            sweet.show({
              title: 'Error Cambio Estado Artículo',
              text: result[0].msg,
              animation: 'slide-from-top'
            });
          } else{
            self.tableParams.reload();
          }
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

      return ArticlesPurchasesService
      .getArticles(ajax_params)
      .$promise.then(function (result) {
        return result.map(function(item){
          return item;
        });
      }, function(error) {
        console.log(error);
      });
    };

    //Agregar articulo a la oc.
    $scope.addArticuloPurchase = function(){
      if($scope.articleSelected){
        var ajax_params = {
          id_purchase_order: $scope.purchase_order.id_purchase_order,
          id_article:  $scope.articleSelected.id_article,
          id_location: $scope.purchase_order.id_location,
          id_zone: $scope.purchase_order.id_zone
        };
        ArticlesPurchasesService
        .addArticle(ajax_params)
        .$promise.then(function (result) {
          if(result[0].error){
            sweet.show({
              title: 'Error al agregar el artículo',
              text: result[0].msg,
              animation: 'slide-from-top'
            });
          } else{
            sweet.show({
              title: 'OK agregar artículo',
              text: 'Se agregó el articulo ' + $scope.articleSelected.name + ' a la orden de compra N° ' + $scope.purchase_order.number,
              type: 'success',
              animation: 'slide-from-top'
            });
            self.tableParams.reload();
          }
          $scope.articleSelected = null;
        }, function(error) {
          console.log(error);
        });
      }
    };

    //Agregar un proveedor a la oc.
    function loadProvider(article){
      var ajax_params = {
        id_purchase_order: $scope.purchase_order.id_purchase_order,
        id_article: article.id_article,
        id_provider: article.id_provider,
        id_location: $scope.purchase_order.id_location,
        id_zone: $scope.purchase_order.id_zone
      };
      ArticlesPurchasesService
      .loadProvider(ajax_params)
      .$promise.then(function (result) {
        if(result[0].error){
          sweet.show({
            title: 'Error Carga de Proveedor',
            text: result[0].msg,
            animation: 'slide-from-top'
          });
        }
      }, function(error) {
        console.log(error);
      });
    }

    //Se verifica que los datos ingresados sean consistentes.
    $scope.checkConsistency = function(){
      var ajax_params = {
        id_purchase_order:  $scope.purchase_order.id_purchase_order,
        id_location: $scope.purchase_order.id_location,
        id_zone: $scope.purchase_order.id_zone
      };
      ArticlesPurchasesService
      .checkConsistency(ajax_params)
      .$promise.then(function (result) {
        if(result[0].error){
          sweet.show({
            title: 'Error al Cerrar Orden de Compra',
            text: result[0].msg,
            animation: 'slide-from-top'
          });
        } else{
          var title = '¿Está seguro que desea cerrar la Orden de Compra N° ' + $scope.purchase_order.number + '?';
          var text = '<h4>Consistencia OK.</h4>';
          if(result[0].code === globals.WARNING_ARTICULOS_EN_CERO) {
            text = '<h4>' + result[0].msg + '</h4>';
            text += '<div class="table_vertical_scroll">';
            text += ' <table class="table table-bordered">';
            for (var i = result[0].articles.length - 1; i >= 0; i--) {
              text += ' <tr><td>' + result[0].articles[i].full_code + '</td><td class="left">' + result[0].articles[i].name + '</td></tr>';
            }
            text += ' </table>';
            text += '</div>';
          }
          sweet.show({
            title: title,
            text: text,
            type: 'info',
            html: true,
            animation: 'slide-from-top',
            showCancelButton: true,
            closeOnConfirm: false,
            showLoaderOnConfirm: true
          }, function(inputValue) {
            if (inputValue === true){
              closePurchaseOrder(ajax_params);
            }
          });
        }
      }, function(error) {
        console.log(error);
      });
    };

    //Hacer efectivo el cierre de la oc.
    function closePurchaseOrder(ajax_params){
      ArticlesPurchasesService
      .closePurchaseOrder(ajax_params)
      .$promise.then(function (result) {
        if(result[0].error){
          sweet.show({
            title: 'Error al Cerrar Orden de Compra',
            text: result[0].msg,
            animation: 'slide-from-top'
          });
        } else if(result[0].code === globals.WARNING_ARTICULOS_EN_CERO) {
          sweet.show({
            title: 'Error al Cerrar Orden de Compra',
            text: result[0].msg,
            animation: 'slide-from-top'
          });
        } else {
          sweet.show({
            title: 'Éxito Cierre Orden de Compra',
            text: 'La Orden de Compra N° ' + $scope.purchase_order.number + ' fue cerrada correctamente.',
            type: 'success',
            animation: 'slide-from-top'
          });
          $state.reload();
        }
      }, function(error) {
        console.log(error);
      });
    }

    /***************************************************************************
    *
    *                          METODOS DE PAGO
    *
    ***************************************************************************/
    //Parametros de la tabla de pagos.
    var tableParamsPayments = {};
    var originalDataPayments = {};
    var providersTableParams = localStorageService.get('paymentsPurchaseOrderTableParams');
    if (providersTableParams !== null) {
      tableParamsPayments = providersTableParams;
    } else {
      tableParamsPayments = {
        page: 1,
        count: 5,
        filter: { },
        sorting: {
          nombre_fantasia: 'asc'
        }
      };
    }

    //Configuracion inicial de la tabla de pagos.
    var tableSettingsPayments = {
      total: 0,
      counts: [5, 10, 50, 100, 200, 500],
      groupOptions: {
        isExpanded: false
      },
      groupBy: function(item) {
        return item.nombre_fantasia;
      },
      getData: function($defer, params) {
        tableParamsPayments = params.parameters();
        localStorageService.set('paymentsPurchaseOrderTableParams', tableParamsPayments);

        //Se hace con un post. Recordar de tomar los parametros con req.body.
        var ajax_params = {
          id_purchase_order: $scope.purchase_order.id_purchase_order,
        };

        var parametros = Object.assign(params.url(), ajax_params);
        ArticlesPurchasesService
        .getPaymentsPurchaseOrder(parametros).$promise.then(function(response) {
          params.total(response.total);
          $scope.purchase_order.payments = response.results;

          //Se establece el valor del total parcial de la orden de compra.
          $scope.total_valued_payments = response.total_valued_payments;

          //Se guarda la data original de los pagos.
          originalDataPayments = angular.copy($scope.purchase_order.payments);
          $defer.resolve($scope.purchase_order.payments);
        });
      }
    };

    //Se genera la tabla de pagos.
    self.tableParamsPayments = new NgTableParams(tableParamsPayments, tableSettingsPayments);

    //Se observa el cambio de parametros y se los va guardando en el localStorage.
    $scope.$watch('tableParamsPayments', function () {
      localStorageService.set('paymentsPurchaseOrderTableParams', tableParamsPayments);
    }, true);

    $scope.payment = {};
    self.sum_providers = sum_providers;
    self.isGroupHeaderRowVisiblePayment = true;
    self.isGroupablePayment = isGroupablePayment;
    self.toggleGroupabilityPayment = toggleGroupabilityPayment;
    self.cancelChangesPayment = cancelChangesPayment;
    self.hasChangesPayment = hasChangesPayment;
    self.setEditingPayment = setEditingPayment;
    self.updatePaymentMethod = updatePaymentMethod;
    self.removePaymentMethod = removePaymentMethod;

    //Se sumariza el total segun la agrupacion.
    function sum_providers(data, field){
      var total = 0;
      for(var i = 0; i < data.length; i++){
        var article = data[i];
        total += parseFloat(article.amount);
      }
      return total;
    }

    function isGroupablePayment($column){
      return !!$column.groupable() || $column.groupField;
    }

    function toggleGroupabilityPayment($column){
      if ($column.groupable()) {
        $column.groupField = $column.groupable();
        $column.groupable.assign(self, false);
      } else {
        $column.groupable.assign(self, $column.groupField);
      }
    }

    function cancelChangesPayment(payment, rowForm) {
      var currentPage = self.tableParamsPayments.page();
      var originalRow = resetTableStatusPayment(payment, rowForm);
      angular.extend(payment, originalRow);
      self.tableParamsPayments.page(currentPage);
    }

    function hasChangesPayment(payment, rowForm) {
      return rowForm.$dirty;
    }

    function setEditingPayment(payment, value) {
      payment.isEditing = value;
    }

    function resetTableStatusPayment(payment, rowForm) {
      self.setEditingPayment(payment, false);
      rowForm.$setPristine();
      for (var i in originalDataPayments){
        if(originalDataPayments[i].id_purchase_order_payment === payment.id_purchase_order_payment){
          return originalDataPayments[i];
        }
      }
    }

    $scope.addPaymentMethod = function(){
      if($scope.payment.total !== null){
        var ajax_params = {
          id_purchase_order: $scope.purchase_order.id_purchase_order,
          id_provider:  $scope.payment.provider.id_provider,
          id_payment_method: $scope.payment.method.id_payment_method,
          amount:  $scope.payment.total
        };
        ArticlesPurchasesService
        .addPaymentMethod(ajax_params)
        .$promise.then(function (result) {
          if(result[0].error){
            sweet.show({
              title: 'Error al agregar el pago',
              text: result[0].msg,
              animation: 'slide-from-top'
            });
          } else{
            var text = 'Se agregó el pago a la orden de compra N° ' + $scope.purchase_order.number;
            text += '\nProveedor: ' + $scope.payment.provider.nombre_fantasia;
            text += '\nMedio de Pago: ' + $scope.payment.method.description;
            text += '\nTotal: ' + $scope.payment.total;
            sweet.show({
              title: 'OK agregar pago',
              text: text,
              type: 'success',
              animation: 'slide-from-top'
            });
            self.tableParamsPayments.reload();
          }
          $scope.payment.total = null;
        }, function(error) {
          console.log(error);
        });
      }
    };

    function updatePaymentMethod(payment){
      var ajax_params = {
        id_purchase_order: payment.id_purchase_order,
        id_purchase_order_payment: payment.id_purchase_order_payment,
        amount: payment.amount
      };
      ArticlesPurchasesService
      .updatePaymentMethod(ajax_params)
      .$promise.then(function (result) {
        if(result[0].error){
          sweet.show({
            title: 'Error al modificar el pago',
            text: result[0].msg,
            animation: 'slide-from-top'
          });
        } else{
          var text = 'Se modificó el pago de la orden de compra N° ' + $scope.purchase_order.number;
          text += '\nProveedor: ' + payment.nombre_fantasia;
          text += '\nMedio de Pago: ' + payment.payment_description;
          text += '\nTotal: ' + payment.amount;
          sweet.show({
            title: 'OK modificar pago',
            text: text,
            type: 'success',
            animation: 'slide-from-top'
          });
          self.tableParamsPayments.reload();
        }
      }, function(error) {
        console.log(error);
      });
    }

    function removePaymentMethod(payment){
      var ajax_params = {
        id_purchase_order: $scope.purchase_order.id_purchase_order,
        id_purchase_order_payment: payment.id_purchase_order_payment
      };

      ArticlesPurchasesService
      .removePaymentMethod(ajax_params)
      .$promise.then(function (result) {
        if(result[0].error){
          sweet.show({
            title: 'Error al eliminar el pago',
            text: result[0].msg,
            animation: 'slide-from-top'
          });
        } else{
          var text = 'Se eliminó el pago de la orden de compra N° ' + $scope.purchase_order.number;
          text += '\nProveedor: ' + payment.nombre_fantasia;
          text += '\nMedio de Pago: ' + payment.payment_description;
          text += '\nTotal: ' + payment.amount;
          sweet.show({
            title: 'OK eliminar pago',
            text: text,
            type: 'success',
            animation: 'slide-from-top'
          });
          self.tableParamsPayments.reload();
        }
      }, function(error) {
        console.log(error);
      });
    }
  }
})();
