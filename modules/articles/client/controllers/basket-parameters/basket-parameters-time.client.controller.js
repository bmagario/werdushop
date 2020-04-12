'use strict';

angular.module('articles')
.controller('BasketParametersTimeController', ['$scope', '$state', 'BasketPService', 'BasketPTimeService', 'ZonesService', 'NgTableParams', 'localStorageService', 'sweet', function BasketController ($scope, $state, BasketPService, BasketPTimeService, ZonesService, NgTableParams, localStorageService, sweet){
  $scope.basketPS = BasketPService;
  $scope.basketPTimeS = BasketPTimeService;

  var self = this;

  //Parametros de la tabla de parámetros: horarios de entrega.
  var tableParamsTime = {};
  var originalDataTime = {};

  var timeShippingTableParams = localStorageService.get('timeShippingTableParams');

  if (timeShippingTableParams !== null) {
    tableParamsTime = timeShippingTableParams;
  } else {
    tableParamsTime = {
      page: 1,
      count: 5,
      filter: {},
      sorting: {
        id_shipping_time: 'asc'
      }
    };
  }

  //Configuracion inicial de la tabla de horarios de entrega.
  var tableSettingsTime = {
    total: 0,
    counts: [5, 10, 50, 100, 200, 500],
    getData: function($defer, params) {
      tableParamsTime = params.parameters();
      
      var parametros = Object.assign(params.url(), {
        id_zone: $scope.basketPS.id_zone,
        id_location: $scope.basketPS.id_location    
      });

      var result = BasketPService._checkParameters(parametros);
      if(result.error){
        sweet.show({
          title: 'Faltan Parámetros',
          text: result.msg,
          animation: 'slide-from-top'
        });
      } else{
        localStorageService.set('timeShippingTableParams', tableParamsTime);
        localStorageService.set('zonesLocationShipping', $scope.basketPS.selected_zone_loc);

        BasketPTimeService
        .listarHorariosEntrega(parametros)
        .then(function(response) {
          params.total(response.total);
          originalDataTime = angular.copy($scope.shipping_time);
          //Agrego al scope el listado de horarios.
          $scope.shipping_time = response.results;

          $defer.resolve(response.results);
        });
      }
    }
  };

  var reloadShippingTime = function(){
    self.tableParamsTime.reload();
    BasketPTimeService.obtenerHorariosEntrega(1, 1);
  };

  //Filtros de las zonas.
  $scope.changeZone = function(){
    BasketPService.cargarZonaLocalidad($scope.basketPS.selected_zone_loc.id_location, $scope.basketPS.selected_zone_loc.id_zone);
    reloadShippingTime();
  };

  var getZoneFilter = function () {
    BasketPService.getZoneFilter();
    self.tableParamsTime = new NgTableParams(tableParamsTime, tableSettingsTime);
    $scope.$watch('tableParamsTime', function () {
      localStorageService.set('dateShippingTableParams', tableParamsTime);
    }, true);
  };
  getZoneFilter();

  //***************************************** Edition ***************************************
  self.cancelChangesTime = cancelChangesTime;
  self.hasChangesTime = hasChangesTime;
  self.setEditingTime = setEditingTime;
  self.isEditingTime = false;

  self.isAddingTime = false;
  self.setAddingTime = setAddingTime;
  self.cancelAddingTime = cancelAddingTime;
  
  //self.updateFiledsHour = updateFiledsHour;
  self.addTime = addTime;

  function cancelChangesTime(shipping_time, rowFormTime) {
    var currentPage = self.tableParamsTime.page();
    if(shipping_time !== undefined && shipping_time !== null){
      var originalRow = resetTableStatusTime(shipping_time, rowFormTime);
      angular.extend(shipping_time, originalRow);
      currentPage = self.tableParamsTime.page();
      self.tableParamsTime.page(currentPage);
    } else{
      resetTableStatusTime(shipping_time, rowFormTime);
    }
  }

  function cancelAddingTime() {
   // console.log('setAddingTime'+self.isAddingTime);
    self.isAddingTime = false;
  }

  function hasChangesTime(shipping_time, rowFormTime) {
    if(shipping_time !== undefined && shipping_time !== null){
      return rowFormTime.$dirty;
    } else{
      return self.tableFormTime.$dirty;
    }
  }

  function setEditingTime(shipping_time, value) {

    if(shipping_time !== undefined && shipping_time !== null){

      var time_from = shipping_time.shipping_hour_from+':00';
      var time_to = shipping_time.shipping_hour_to+':00';
      shipping_time.update_shipping_hour_from = BasketPTimeService.toTime(time_from);
      shipping_time.update_shipping_hour_to = BasketPTimeService.toTime(time_to);

      shipping_time.isEditingTime = value;
    } else{
      angular.forEach($scope.shipping_time, function(item) {
        var time_from = item.shipping_hour_from+':00';
        var time_to = item.shipping_hour_to+':00';
        item.update_shipping_hour_from = BasketPTimeService.toTime(time_from);
        item.update_shipping_hour_to = BasketPTimeService.toTime(time_to);
      });
      self.isEditingTime = value;
    
    }
  }

  function setAddingTime() {
    self.isAddingTime = true;
  }

  function resetTableStatusTime(shipping_time, rowFormTime) {
    self.setEditingTime(shipping_time, false);
    if(shipping_time !== undefined && shipping_time !== null){
      rowFormTime.$setPristine();
      for (var i in originalDataTime){
        if(originalDataTime[i].id_shipping_time === shipping_time.id_shipping_time){
          return originalDataTime[i];
        }
      }
    } else{
      reloadShippingTime();
    }
  }

  /*TIME to ADD*/
  var min = new Date();
  min.setHours(7, 0, 0);
  $scope.minHour = min;

  var max = new Date();
  max.setHours(20, 0, 0);
  $scope.maxHour = max;

  $scope.add_shipping_hour_from = $scope.minHour;
  $scope.add_shipping_hour_to = $scope.maxHour;

  $scope.showMeridian = false;
  $scope.hstep = 1;
  $scope.mstep = 1;

  function addTime(isValid, hour_from, hour_to){
    if(isValid){
      
      var id_status = 2;
      console.log('$scope.enable_hour');console.log($scope.enable_hour);
      if($scope.enable_hour) {id_status = 1;}

      if(hour_from !== undefined && hour_from !== null && hour_from !== '' &&
        hour_to !== undefined && hour_to !== null && hour_to !== '' && 
        $scope.basketPS.id_zone !== undefined && $scope.basketPS.id_zone !== null && $scope.basketPS.id_zone !== '' &&
        $scope.basketPS.id_location !== undefined && $scope.basketPS.id_location !== null && $scope.basketPS.id_location !== ''){
      
        var time_from = BasketPTimeService.pasarHoraString(hour_from);
        var time_to = BasketPTimeService.pasarHoraString(hour_to);

        BasketPTimeService
        .agregarHorarioEntrega(time_from, time_to, $scope.basketPS.selected_zone_loc.id_location, $scope.basketPS.selected_zone_loc.id_zone, id_status)
        .then(function (result) {
          if(result.error){
            sweet.show(result.msg);
          }
        }, function(error) {
          console.log(error);
        });      
      }
    }
    reloadShippingTime();
    cancelAddingTime();
  }

  //************************************ checkboxesTime **************************************
  $scope.checkboxesTime = { 'checked': false, items: {} };

  // watch for check all checkbox
  $scope.$watch('checkboxesTime.checked', function(value) {
    angular.forEach($scope.shipping_time, function(item) {
      if (angular.isDefined(item.id_shipping_time)) {
        $scope.checkboxesTime.items[item.id_shipping_time] = value;
      }
    });
  });

  // watch for data checkboxesTime
  $scope.$watch('checkboxesTime.items', function(values) {
    if (!$scope.shipping_time) {
      return;
    }
    var checked = 0;
    var unchecked = 0;
    var total = $scope.shipping_time.length;
    angular.forEach($scope.shipping_time, function(item) {
      checked += ($scope.checkboxesTime.items[item.id_shipping_time]) || 0;
      unchecked += (!$scope.checkboxesTime.items[item.id_shipping_time]) || 0;
    });
    if ((parseInt(unchecked) === 0) || (parseInt(checked) === 0)) {
      $scope.checkboxesTime.checked = (parseInt(checked) === parseInt(total));
    }
    // grayed checkbox
    angular.element(document.getElementById('select_all')).prop('indeterminate', (parseInt(checked) !== 0 && parseInt(unchecked) !== 0));
  }, true);

  //Checkbox para enable_hour
  $scope.enable_hour = false;
  $scope.enableOrNotTime = function(){
    $scope.enable_hour = !$scope.enable_hour;
  };

  // Load Hour.
  self.loadHour = function(shipping_time) {

    var shipping_times = [];
    if(shipping_time !== undefined && shipping_time !== null){//Si se está agregando un horario solamente.
      
      var shipping_hour_from = shipping_time.update_shipping_hour_from;
      var shipping_hour_to = shipping_time.update_shipping_hour_to;

      if(shipping_hour_from === undefined || shipping_hour_from === null || shipping_hour_from === '' ||
        shipping_hour_to === undefined || shipping_hour_to === null|| shipping_hour_to === ''){
        return;
      }
       
      shipping_time.shipping_hour_from = BasketPTimeService.pasarHoraString(shipping_hour_from);
      shipping_time.shipping_hour_to = BasketPTimeService.pasarHoraString(shipping_hour_to);

      shipping_times.push(shipping_time);

    } else{
      angular.forEach($scope.shipping_time, function(item) {
        if (angular.isDefined(item.id_shipping_time) && $scope.checkboxesTime.items[item.id_shipping_time]) {

          item.shipping_hour_from = BasketPTimeService.pasarHoraString(item.update_shipping_hour_from);
          item.shipping_hour_to = BasketPTimeService.pasarHoraString(item.update_shipping_hour_to);
        
          shipping_times.push(item);
        
        }
      });
    }
    //Si la cantidad de articulos es mayor a cero, hago la llamada ajax.
    if(shipping_times.length > 0 && $scope.basketPS.id_zone !== undefined && $scope.basketPS.id_zone !== null && $scope.basketPS.id_zone !== '' &&
      $scope.basketPS.id_location !== undefined && $scope.basketPS.id_location !== null && $scope.basketPS.id_location !== ''){

      BasketPTimeService
      .actualizarHorarioEntrega(shipping_times)
      .then(function (result) {
        if(result.error){
          sweet.show(result.msg);
        }
        self.setEditingTime(null, false);

      }, function(error) {
        console.log(error);
      });
    }
    reloadShippingTime();
  };

  // Delete Hour.
  self.deleteHour = function(shipping_time) {
   
    var shipping_times = [];
    if(shipping_time !== undefined && shipping_time !== null){//Si se está eliminando un horario solamente.

      shipping_times.push(shipping_time);

    } else{
      angular.forEach($scope.shipping_time, function(item) {
        if (angular.isDefined(item.id_shipping_time) && $scope.checkboxesTime.items[item.id_shipping_time]) {
          shipping_times.push(item);
        }
      });
    }
    //Si la cantidad de articulos es mayor a cero, hago la llamada ajax.
    if(shipping_times.length > 0 && $scope.basketPS.id_zone !== undefined && $scope.basketPS.id_zone !== null && $scope.basketPS.id_zone !== '' &&
      $scope.basketPS.id_location !== undefined && $scope.basketPS.id_location !== null && $scope.basketPS.id_location !== ''){

      BasketPTimeService
      .eliminarHorarioEntrega(shipping_times)
      .then(function (result) {
        if(result.error){
          sweet.show(result.msg);
        }
        self.setEditingTime(null, false);

      }, function(error) {
        console.log(error);
      });
    }
    reloadShippingTime();
  };

  // Habilitar o deshabilitar los horarios.
  self.enableHour = function(shipping_time, type) {
    var shipping_times = [];
    
    if(shipping_time !== undefined && shipping_time !== null){//Se está habilitando/deshabilitando un horario solo.
      shipping_times.push({ id_shipping_time: shipping_time.id_shipping_time });    
    } else{//Se están habilitando/deshabilitando varios horarios.
      angular.forEach($scope.shipping_time, function(item) {
        if (angular.isDefined(item.id_shipping_time) && $scope.checkboxesTime.items[item.id_shipping_time]) {
          var shipping_time = {};
          if(type === true){//Habilitar.
            if(item.id_status === 2){//no está habilitado
              shipping_time = { id_shipping_time: item.id_shipping_time };
              shipping_times.push(shipping_time);
            }
          } else{ 
            if(type === false){//Deshabilitar.
              if(item.id_status === 1){//está habilitado
                shipping_time = { id_shipping_time: item.id_shipping_time };
                shipping_times.push(shipping_time);
              }
            }
          }
        }
      });
    }
    
    //Si la cantidad de horarios es mayor a cero, hago la llamada ajax.
    if(shipping_times.length > 0){
      BasketPTimeService
      .cambiarEstadoHorarioEntrega(shipping_times, type)
      .then(function(result) {
        if(result.error){
          sweet.show(result.msg);
        }
        reloadShippingTime();
      });
    }
  };

}]);