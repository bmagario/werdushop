//Basket service used to communicate Basket REST endpoints
(function () {
  'use strict';
  angular.module('users')
  .factory('AddressService', ['Users', '$q', '$timeout', 'Authentication', 'modalService', 'sweet', function(Users, $q, $timeout, Authentication, modalService, sweet){
    var authentication = Authentication;
    var servicio = {};
  
    servicio.address = getUserAddress(); //Obtener las direcciones ACTIVAS (1) del usuario

    servicio.newaddress = { id_user_address: null, str: '', num: '', floor: '', dpto: '' };
    servicio.success = servicio.error = null;
    servicio.viewfieldsnewaddress = false;
    
    //Busca un determinada dirección del usuario y la retorna en caso de que exista
    function buscar(id_user_address){
      console.log('buscando address '+id_user_address);
      if (servicio.address === undefined || servicio.address === null) {
        servicio.address = getUserAddress();
      }
      
      if (servicio.address !== undefined && servicio.address !== null) {
        for (var i in servicio.address) {
          if (servicio.address[i].id_user_address === id_user_address) {
            return servicio.address[i];
          }
        }
      }
      return null;
    }//buscar

    //Visualiza el panel para agregar una nueva dirección durante el cierre de la canasta    
    servicio.openPanelUserAddress = function(address) {
      servicio.viewfieldsnewaddress = !servicio.viewfieldsnewaddress;

      if(authentication.user) {
        if (address !== null && address !== undefined){
          var id_location = address.id_location;
          var id_zone = address.id_zone;
          servicio.newaddress.id_user_address = address.id_user_address;
          servicio.newaddress.str = address.street;
          servicio.newaddress.num = address.number;
          servicio.newaddress.floor = address.floor;
          servicio.newaddress.dpto = address.apartment;
        } else { 
          servicio.newaddress = { id_user_address: null, str: '', num: '', floor: '', dpto: '' };
        }

        var modalOptions = {
          closeButtonText: ' ',
          actionButtonText: ' ',
          headerText: '¡Actualizá tu domicilio!',
          bodyText: ' ',
          bodyUrl: 'modules/users/client/views/settings/modify-address.client.view.html'
        };

        var modalDefaults = {
          backdrop: true,
          keyboard: true,
          modalFade: true,
          templateUrl: '/modules/core/client/views/modal.client.view.html',
          size: 'lg'
        };
        modalService.showModal(modalDefaults, modalOptions);
      } else {
        sweet.show({
          title: 'No está autenticado',
          text: '',
          animation: 'slide-from-top'
        });
        servicio.newaddress = { id_user_address: null, str: '', num: '', floor: '', dpto: '' };
      }
    }; //mostrar direccion para cambiar

    servicio.addAddressCancel = function(modalOptions) {
      servicio.viewfieldsnewaddress =! servicio.viewfieldsnewaddress;
     // modalService.close();
     //Cierro el modal
      if (modalOptions !== null && modalOptions !== undefined) { 
        modalOptions.ok();
      }
    };

    //Obtiene las direcciones cargadas para el usuario según estado (id_status = 1 (ACTIVAS) o id_status = 2 (NO_ACTIVAS))
    function getUserAddress() {
      var deferred = $q.defer();
      if (servicio.address === null || servicio.address === undefined) {
        Users
        .getAddress()            
        .$promise
        .then(function (result) {
          servicio.address = result;
          deferred.resolve(servicio.address);
          return;
        }, function (error) {
          deferred.reject(error);
          return;
        });
        return deferred.promise;
      } else { 
        return servicio.address;
      }
    }

    //Retorna la lista de direcciones para mostarla en la vista
    servicio.listar = function() {
      return getUserAddress();
    };//listar

    //Modifica una de las direcciones guardadas para elusuario 
    servicio.changeUserAddress = function(address) {
      console.log('changeUserAddress: ');
      console.log(address);
      if (address !== null && address !== undefined){
        if (authentication.user) {
          var id_location = address.id_location;
          var id_zone = address.id_zone;
          servicio.newaddress.id_user_address = address.id_user_address;
          servicio.newaddress.str = address.street;
          servicio.newaddress.num = address.number;
          servicio.newaddress.floor = address.floor;
          servicio.newaddress.dpto = address.apartment;
          servicio.viewfieldsnewaddress = true;
          
        } else { 
          servicio.error = 'Debe ingresar para modificar su domicilio.';
          servicio.success = false;
          //deferred.reject(servicio.error);
          servicio.newaddress = { id_user_address: null, str: '', num: '', floor: '', dpto: '' };
         // return deferred.promise;
        }
      } else {
        servicio.error = 'Datos inválidos.';
        servicio.success = false;
        //deferred.reject(servicio.error);
        servicio.newaddress = { id_user_address: null, str: '', num: '', floor: '', dpto: '' };
       // return deferred.promise;
      }
    };

    //Elimina una dirección
    servicio.removeUserAddress = function(address) {
      var deferred = $q.defer();
      console.log(address);
      if (authentication.user && address !== null && address !== undefined) {  
        var itemActual = buscar(address.id_user_address);
        if (itemActual !== null) {         
        
          //1-Actualizo servicio.address
          servicio.address.splice(servicio.address.indexOf(address),1); 
                    
          //2-Guardo el artículo en la BD
          var ajax_params = {
            id_user_address: address.id_user_address
          };

          Users
          .removeAddress(ajax_params)
          .$promise
          .then(function (result) {
            deferred.resolve(servicio.address);
            return deferred.promise;  
          }, function(error) {  //Ocurre un error al grabar en la BD > rollback
            
            if (itemActual !== null) {
              servicio.viewfieldsnewaddress = false;
              servicio.address.push({
                street: itemActual.street,
                number: itemActual.number,
                apartment: itemActual.apartment,
                floor: itemActual.floor
              });
            }
            deferred.reject(error);
            return deferred.promise;   
          });
        } else {
          deferred.reject('La dirección no corresponde al usuario.');
          return deferred.promise;
        }
      } else {
        deferred.reject('No está autenticado');
        return deferred.promise;
      }      
    };

    //Actualiza las direcciones guardadas del usuario (hasta dos, para una misma localidad)
    servicio.updateUserAddress = function(isValid, modalOptions) {
      var id_location = 1; //Bahía Blanca
      var id_zone = 1; //Bahía Blanca, zona 1
      var CANTIDAD_MAX_DIRECCIONES = 2;
      
      var deferred = $q.defer();
      if (isValid){
        if (authentication.user) {        
          console.log('CAC001>Controller update address agregando dirección del usuario... ');
          if (servicio.address === undefined || servicio.address === null || servicio.address.length === undefined || servicio.address.length === null) {
            servicio.address = [];
          }
          console.log(servicio.address.length);
          if (servicio.newaddress.id_user_address !== null || servicio.address.length < CANTIDAD_MAX_DIRECCIONES) { //Solo permito que agregue dos direcciones
            servicio.viewfieldsnewaddress = false;//para mostrar o no los campos en la canasta
            servicio.success = servicio.error = null;
            
            //1-Guardo la dirección en la BD
            var ajax_params = {
              id_location: id_location,
              id_zone: id_zone,
              id_user_address: servicio.newaddress.id_user_address,
              street: servicio.newaddress.str,
              number: servicio.newaddress.num,
              floor: servicio.newaddress.floor,
              apartment: servicio.newaddress.dpto
            };
            console.log('ajax_params:');console.log(ajax_params);
            Users
            .updateAddress(ajax_params)
            .$promise
            .then(function (response) {
              //Cierro el modal
              if (modalOptions !== null && modalOptions !== undefined) { 
                modalOptions.ok();
              }

              response.map(function(address){
                servicio.success = true;
                servicio.error = false;         
                
                //2-Actualizo address
                servicio.address = null;
                servicio.address = getUserAddress();
                console.log('servicio.address');
                console.log(servicio.address);
              });
              deferred.resolve(servicio.address);
              servicio.newaddress = { id_user_address: null, str: '', num: '', floor: '', dpto: '' };
              return deferred.promise;       
            }, function(error) {
              servicio.error = error;
              servicio.success = false;
              deferred.reject(servicio.error);
              servicio.newaddress = { id_user_address: null, str: '', num: '', floor: '', dpto: '' };
              return deferred.promise;
            });
          } else { 
            servicio.error = 'Sólo puede almacenar dos domicilios.';
            servicio.success = false;
            deferred.reject(servicio.error);
            servicio.newaddress = { id_user_address: null, str: '', num: '', floor: '', dpto: '' };
            return deferred.promise;
          }
        } else { 
          servicio.error = 'Debe ingresar para actualizar su domicilio.';
          servicio.success = false;
          deferred.reject(servicio.error);

          servicio.newaddress = { id_user_address: null, str: '', num: '', floor: '', dpto: '' };
          return deferred.promise;
        }
      } else {
        servicio.error = 'Datos inválidos.';
        servicio.success = false;
        deferred.reject(servicio.error);

        servicio.newaddress = { id_user_address: null, str: '', num: '', floor: '', dpto: '' };
        return deferred.promise;
      }
    };
    return servicio;
  }]);
})();
