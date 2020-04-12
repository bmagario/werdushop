'use strict';

angular.module('articles')
.controller('BasketParametersDateController', ['$scope', '$state', 'moment', 'BasketPService', 'BasketPDateService', 'NotWorkDatesService', 'ZonesService', 'NgTableParams', 'localStorageService', 'sweet', function BasketController ($scope, $state, moment, BasketPService, BasketPDateService, NotWorkDatesService, ZonesService, NgTableParams, localStorageService, sweet){
  
  $scope.basketPS = BasketPService;
  $scope.basketPDateS = BasketPDateService;
  var notWorkDatesS = NotWorkDatesService;

  var self = this;
   
  $scope.enable_days = [
    { 'dia': 'Lunes', 'activo': 'true', 'bd_dia': '0', 'color': 'btn-success' },
    { 'dia': 'Martes', 'activo': 'true', 'bd_dia': '1', 'color': 'btn-info' },
    { 'dia': 'Miércoles', 'activo': 'true', 'bd_dia': '2', 'color': 'btn-warning' },
    { 'dia': 'Jueves', 'activo': 'true', 'bd_dia': '3', 'color': 'btn-default' },
    { 'dia': 'Viernes', 'activo': 'true', 'bd_dia': '4', 'color': 'btn-danger' },
    { 'dia': 'Sábado', 'activo': 'true', 'bd_dia': '5', 'color': 'btn-primary' },
    { 'dia': 'Domingo', 'activo': 'true', 'bd_dia': '6', 'color': 'btn-success' }
  ];

  //Parametros de la tabla de parámetros: días de entrega.
  /*var tableParamsDate = {};
  var originalDataDate = {};

  var dateShippingTableParams = localStorageService.get('dateShippingTableParams');

  if (dateShippingTableParams !== null) {
    tableParamsDate = dateShippingTableParams;
  } else {
    tableParamsDate = {
      page: 1,
      count: 5,
      filter: {},
      sorting: {
        id_shipping_date: 'asc'
      }
    };
  }
*/
  //Configuracion inicial de la tabla de días de entrega.
  /*var tableSettingsDate = {
    total: 0,
    counts: [5, 10, 50, 100, 200, 500],
    getData: function($defer, paramsd) {
      tableParamsDate = paramsd.parameters();
      
      var parametros = Object.assign(paramsd.url(), { 
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
        localStorageService.set('dateShippingTableParams', tableParamsDate);
        localStorageService.set('zonesLocationShipping', $scope.basketPS.selected_zone_loc);

        BasketPDateService
        .listarDiasEntrega(parametros)
        .then(function(response) {
          paramsd.total(response.total);
          originalDataDate = angular.copy($scope.shipping_date);
          //Agrego al scope el listado de dias.
          $scope.shipping_date = response.results;
          $defer.resolve(response.results);
        });
      }
    }
  };*/

  var reloadShippingDate = function(){
    //self.tableParamsDate.reload();
    //$scope.basketPDateS.reloadFechaEnvio();
     $scope.not_work_dates = notWorkDatesS.obtenerDiasNoLaborales($scope.basketPS.id_location, $scope.basketPS.id_zone);

    BasketPDateService.obtenerDiasEntregaHabilitados(1, 1);
  };

  //Filtros de las zonas.
  $scope.changeZone = function(){
    BasketPService.cargarZonaLocalidad($scope.basketPS.selected_zone_loc.id_location, $scope.basketPS.selected_zone_loc.id_zone);
    reloadShippingDate();
  };

  var getZoneFilter = function () {
    BasketPService.getZoneFilter();
    /*self.tableParamsDate = new NgTableParams(tableParamsDate, tableSettingsDate);
    $scope.$watch('tableParamsDate', function () {
      localStorageService.set('dateShippingTableParams', tableParamsDate);
    }, true);*/
  };
  getZoneFilter();

  //***************************************** Edition ***************************************
  self.cancelChangesDate = cancelChangesDate;
  self.hasChangesDate = hasChangesDate;
  self.setEditingDate = setEditingDate;
  self.isEditingDate = false;

  self.isAddingDate = false;
  self.setAddingDate = setAddingDate;
  self.addDate = addDate;

  self.isAddingNotWorkDate = false;
  self.setAddingNotWorkDate = setAddingNotWorkDate;
  self.addNotWorkDates = addNotWorkDates;

  self.cancelAddingDate = cancelAddingDate;

  function cancelChangesDate(shipping_date, rowFormDate) {
    /*var currentPage = self.tableParamsDate.page();
    if(shipping_date !== undefined && shipping_date !== null){
      var originalRow = resetTableStatusDate(shipping_date, rowFormDate);
      angular.extend(shipping_date, originalRow);
      currentPage = self.tableParamsDate.page();
      self.tableParamsDate.page(currentPage);
    } else{
      resetTableStatusDate(shipping_date, rowFormDate);
    }*/
  }

  function cancelAddingDate() {
    self.isAddingDate = false;
    self.isAddingNotWorkDate = false;
  }

  function hasChangesDate(shipping_date, rowFormDate) {
    if(shipping_date !== undefined && shipping_date !== null){
      return rowFormDate.$dirty;
    } else{
      return self.tableFormDate.$dirty;
    }
  }

  function setEditingDate(shipping_date, value) {
    if(shipping_date !== undefined && shipping_date !== null){

      var new_date = shipping_date.shipping_day;
      shipping_date.update_shipping_day = BasketPDateService.to_Date(new_date);
    
      shipping_date.isEditingDate = value;
    } else{
      angular.forEach($scope.shipping_date, function(item) {
        var new_date = item.shipping_day;
        item.update_shipping_day = BasketPDateService.to_Date(new_date);
      });
      self.isEditingDate = value;
    }
  }

  function setAddingDate() {
    self.isAddingDate = true;
    self.isAddingNotWorkDate = false;
  }

  function setAddingNotWorkDate() {
    if ($scope.add_not_work_date.length === 0) {
      NotWorkDatesService.obtenerDiasNoLaborales($scope.basketPS.selected_zone_loc.id_location, $scope.basketPS.selected_zone_loc.id_zone, $scope.add_not_work_date);
    }
    $scope.add_not_work_date = notWorkDatesS.feriados;
    self.isAddingNotWorkDate = true;
    self.isAddingDate = false;
  }

  /*function resetTableStatusDate(shipping_date, rowFormDate) {
    self.setEditingDate(shipping_date, false);
    if(shipping_date !== undefined && shipping_date !== null){
      rowFormDate.$setPristine();
      for (var i in originalDataDate){
        if(originalDataDate[i].id_shipping_date === shipping_date.id_shipping_date){
          return originalDataDate[i];
        }
      }
    } else{
      reloadShippingDate();
    }
  }*/

  /*DAY to ADD*/
  moment.locale('es');
  $scope.today = moment();
  
  /*$scope.add_shipping_date = [];*/
  $scope.add_not_work_date = [];
  
  $scope.$watch('add_not_work_date', function(newValue, oldValue){
    if(newValue){
        /*console.log('Fechas no laborables modificadas , cantidad fechas selecionadas: ' + newValue.length);*/
        console.log('$watch add_not_work_date: '+newValue);
        console.log($scope.add_not_work_date);
    }
  }, true);

/*  $scope.$watch('add_shipping_date', function(newValue, oldValue){
    if(newValue){
      //console.log('Fechas de entrega modificadas, cantidad días selecionados: ' + newValue.length);
      //console.log('$watch add_shipping_date: '+newValue);
      //console.log($scope.add_shipping_date);
    }
  }, true);*/

  $scope.checkSelection = function(event, date) {
    /*if(somethingWrongWithThisDate(date)){
        event.preventDefault();
        console.log('my click was prevented, want am I gonna do with my life ?');
    }*/
  };

  function addDate(isValid){
    if(isValid){
      //$scope.enable_days
    }
  }

  function addNotWorkDates(isValid){
    if(isValid){
      NotWorkDatesService.agregarDiasNoLaborales($scope.basketPS.selected_zone_loc.id_location, $scope.basketPS.selected_zone_loc.id_zone, $scope.add_not_work_date);
    }
  } 

  //************************************ checkboxesDate **************************************
  /*$scope.checkboxesDate = { 'checked': false, items: {} };

  // watch for check all checkbox
  $scope.$watch('checkboxesDate.checked', function(value) {
    angular.forEach($scope.shipping_date, function(item) {
      if (angular.isDefined(item.id_shipping_date)) {
        $scope.checkboxesDate.items[item.id_shipping_date] = value;
      }
    });
  });

  $scope.$watch('checkboxesDate.items', function(values) {
    if (!$scope.shipping_date) {
      return;
    }
    var checked = 0;
    var unchecked = 0;
    var total = $scope.shipping_date.length;
    angular.forEach($scope.shipping_date, function(item) {
      checked += ($scope.checkboxesDate.items[item.id_shipping_date]) || 0;
      unchecked += (!$scope.checkboxesDate.items[item.id_shipping_date]) || 0;
    });
    if ((parseInt(unchecked) === 0) || (parseInt(checked) === 0)) {
      $scope.checkboxesDate.checked = (parseInt(checked) === parseInt(total));
    }
    // grayed checkbox
    angular.element(document.getElementById('select_all')).prop('indeterminate', (parseInt(checked) !== 0 && parseInt(unchecked) !== 0));
  }, true);*/

  //Checkbox para enable_day
  //$scope.enable_day = false;
  $scope.enableOrNotDate = function(nro_dia){
    //$scope.enable_day = !$scope.enable_day;
    if(nro_dia >= 0 && nro_dia < $scope.enable_days.length) {
      $scope.enable_days[nro_dia].activo = !$scope.enable_days[nro_dia].activo;
      console.log(nro_dia);
      console.log($scope.enable_days[nro_dia].activo);
    }
  };
 
  // Load Day.
 /* self.loadDay = function(shipping_date) {
    var shipping_dates = [];
    if(shipping_date !== undefined && shipping_date !== null){//Si se está agreganda una fecha solamente.
      
      var day = shipping_date.shipping_day;

      if(day === undefined || day === null || day === ''){
        return;
      }
      shipping_date.shipping_day = BasketPDateService.pasarDiaString(day);
      shipping_dates.push(shipping_date);

    } else{
      angular.forEach($scope.shipping_dates, function(item) {
        if (angular.isDefined(item.id_shipping_date) && $scope.checkboxesDate.items[item.id_shipping_date]) {
          item.shipping_day = BasketPDateService.pasarDiaString(item.update_shipping_day);
          shipping_dates.push(item);
        }
      });
    }

    //Si la cantidad de articulos es mayor a cero, hago la llamada ajax.
    if(shipping_dates.length > 0 && $scope.basketPS.id_zone !== undefined && $scope.basketPS.id_zone !== null && $scope.basketPS.id_zone !== '' &&
      $scope.basketPS.id_location !== undefined && $scope.basketPS.id_location !== null && $scope.basketPS.id_location !== ''){

      BasketPDateService
      .actualizarDiaEntrega(shipping_dates)
      .then(function (result) {
        if(result.error){
          sweet.show(result.msg);
        }
        self.setEditingDate(null, false);

      }, function(error) {
        console.log(error);
      });
    }
    reloadShippingDate();
  };
*/
  // Delete Day.
  /*self.deleteDay = function(shipping_date) {
   
    var shipping_dates = [];
    if(shipping_date !== undefined && shipping_date !== null){//Si se está eliminando una fecha solamente.

      shipping_dates.push(shipping_date);

    } else{
      angular.forEach($scope.shipping_date, function(item) {
        if (angular.isDefined(item.id_shipping_date) && $scope.checkboxesDate.items[item.id_shipping_date]) {
          shipping_dates.push(item);
        }
      });
    }
    //Si la cantidad de articulos es mayor a cero, hago la llamada ajax.
    if(shipping_dates.length > 0 && $scope.basketPS.id_zone !== undefined && $scope.basketPS.id_zone !== null && $scope.basketPS.id_zone !== '' &&
      $scope.basketPS.id_location !== undefined && $scope.basketPS.id_location !== null && $scope.basketPS.id_location !== ''){

      BasketPDateService
      .eliminarDiaEntrega(shipping_dates)
      .then(function (result) {
        if(result.error){
          sweet.show(result.msg);
        }
        self.setEditingDate(null, false);

      }, function(error) {
        console.log(error);
      });
    }
    reloadShippingDate();
  };*/

  // Habilitar o deshabilitar los días de entrega.
  /*self.enableDay = function(shipping_date, type) {

    var shipping_dates = [];
    
    if(shipping_date !== undefined && shipping_date !== null){//Se está habilitando/deshabilitando un horario solo.
      shipping_dates.push({ id_shipping_date: shipping_date.id_shipping_date });    
    } else{//Se están habilitando/deshabilitando varios horarios.
      angular.forEach($scope.shipping_date, function(item) {
        if (angular.isDefined(item.id_shipping_date) && $scope.checkboxesDate.items[item.id_shipping_date]) {
          var shipping_date = {};
          if(type === true){//Habilitar.
            if(item.id_status === 2){//no está habilitado
              shipping_date = { id_shipping_date: item.id_shipping_date };
              shipping_dates.push(shipping_date);
            }
          } else{ 
            if(type === false){//Deshabilitar.
              if(item.id_status === 1){//está habilitado
                shipping_date = { id_shipping_date: item.id_shipping_date };
                shipping_dates.push(shipping_date);
              }
            }
          }
        }
      });
    }
    
   //Si la cantidad de horarios es mayor a cero, hago la llamada ajax.
    if(shipping_dates.length > 0){
      BasketPDateService
      .cambiarEstadoDiasEntrega(shipping_dates, type)
      .then(function(result) {
        if(result.error){
          sweet.show(result.msg);
        }
        reloadShippingDate();
      });
    }
  };*/

}]);