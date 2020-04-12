//Basket service used to communicate Basket REST endpoints
(function () {
  'use strict';
  angular.module('articles')
  .factory('BasketArticlesService', ['$resource', function ($resource) {
    var url, defaultParams, actions;
    url = '';
    defaultParams = {};
    actions = {
      getBasket: { url: '/api/articles_basket/list_basket/', method: 'GET', isArray: true },
      addToBasket: { url: '/api/articles_basket/add_article/', method: 'POST', isArray: true },
      substractOfBasket: { url: '/api/articles_basket/sub_article/', method: 'POST', isArray: true },
      removeOfBasket: { url: '/api/articles_basket/remove_article/', method: 'POST', isArray: true },
      closeBasket: { url: '/api/articles_basket/close_basket/', method: 'POST', isArray: true }
    };
    return $resource(url, defaultParams, actions);
  }])//BasketArticlesService

  .factory('BasketService', ['BasketArticlesService', 'BasketPTimeService','BasketPDateService','BasketPCostService', '$q', '$timeout', 'Authentication', 'modalService', 'sweet', 'globals', 'LocationsService', 'ZonesService', function(BasketArticlesService, BasketPTimeService, BasketPDateService, BasketPCostService, $q, $timeout, Authentication, modalService, sweet, globals, LocationsService, ZonesService){
    var authentication = Authentication;
    var servicio = {};
    servicio.basketPCostS = BasketPCostService;

    servicio.id_zone_user = 1;
    servicio.id_location_user = 1;

    servicio.basket = getArticlesBasket(); //conformada por [{ cabecera:{}, articulos:[] }] >>> {cabecera: Object, articulos: Array[0]}
    servicio.precioTotalCanasta = getPrice();
   
    //Busca un determinado articulo en la canasta y lo retorna en caso de que exista
    function buscar(id, tipo){  //método local al servicio
      if(servicio.basket === undefined || servicio.basket === null) {
        servicio.basket = getArticlesBasket();
      }
      if(servicio.basket !== undefined && servicio.basket !== null && servicio.basket.articulos !== undefined && servicio.basket.articulos !== null) {        
        for (var i = 0; i < servicio.basket.articulos.length; i++) {
          if(tipo === globals.ARTICULO_SIMPLE && servicio.basket.articulos[i].id_article === id) {
            return servicio.basket.articulos[i];
          }
          if(tipo === globals.ARTICULO_COMPLEJO && servicio.basket.articulos[i].id_complex_article === id) {
            return servicio.basket.articulos[i];
          }
        }
      }
      return null;
    }//buscar

    //Retorna precio actual de todos los productos y sumarlo (TOTAL)
    function getPrice() { //método local al servicio
      var price = 0;
      if(servicio.basket === null || servicio.basket === undefined){
        servicio.basket = getArticlesBasket();
      }
      if(servicio.basket !== null && servicio.basket !== undefined && servicio.basket.articulos !== undefined && servicio.basket.articulos !== null) {
        for (var i in servicio.basket.articulos) {
          if(servicio.basket.articulos[i].price !== null && servicio.basket.articulos[i].price !== undefined) {
            price += (servicio.basket.articulos[i].amount * servicio.basket.articulos[i].price);
          }
        }//for
      }
      return price;
    }//getPrice

    //Retorna la canasta completa
    function getArticlesBasket() {  //método local al servicio
      if(authentication.user){
        if(servicio.basket === null || servicio.basket === undefined) {
          var deferred = $q.defer();
          var ajax_params = {
            id_location: servicio.id_location_user      
          };
          BasketArticlesService
          .getBasket(ajax_params)            
          .$promise
          .then(function (result) {
            result.map(function(item){
              servicio.basket = item;
              servicio.precioTotalCanasta = getPrice();
            });
            deferred.resolve(servicio.basket);
            return;
          }, function (error) {
            deferred.reject(error);
            return;
          });
          return deferred.promise;
        } else {
          return servicio.basket;
        }
      }
    }//getArticlesBasket

    //Datos para la entrega (dirección, día y horario)
    servicio.costo_envio = 0;
    var requirementsIdx = 0;

    function inicializar(){

      if(authentication.user){
        BasketPTimeService.obtenerHorariosEntrega(servicio.id_location_user, servicio.id_zone_user);
        BasketPDateService.obtenerDiasEntregaHabilitados(servicio.id_location_user, servicio.id_zone_user);
        
        BasketPCostService.obtenerCostosEnvio(servicio.id_location_user, servicio.id_zone_user)
        .then(function(response) {
          servicio.compra_minima = response[0].minimun_purchase_basket;
          servicio.envio_gratis = response[0].free_shipping_basket;
          servicio.costo_envio = response[0].shipping_cost_basket;
          console.log('basket > minimun_purchase_basket');console.log(servicio.basketPCostS.minimun_purchase_basket);
          console.log('basket > free_shipping_basket');console.log(servicio.basketPCostS.free_shipping_basket);
          console.log('basket > shipping_cost_basket');console.log(servicio.basketPCostS.shipping_cost_basket);
        });
        servicio.horarios = BasketPTimeService.hour;
        servicio.dias = BasketPDateService.dates;
        servicio.compra_minima = BasketPCostService.minimun_purchase_basket;
        servicio.envio_gratis = BasketPCostService.free_shipping_basket;
        servicio.costo_envio = BasketPCostService.shipping_cost_basket;
      }
    }    

    servicio.costo_mensaje = 'Compra Mínima $'+servicio.compra_minima;
    servicio.costo_color = 'white';

    var requirementsMeter = [
    { color: 'white', msg: 'Compra Mínima $'+servicio.compra_minima },
    { color: 'danger', msg: 'Compra Mínima $'+servicio.compra_minima },
    { color: 'info', msg: 'Compra Mínima $'+servicio.compra_minima },
    { color: 'success', msg: 'Envío Gratis $'+servicio.envio_gratis }
    ];

    //Actualiza datos para indicadores visuales
    function actualizar() {

      if(servicio.precioTotalCanasta !== null && servicio.precioTotalCanasta !== undefined && servicio.precioTotalCanasta > 0){
        if(servicio.precioTotalCanasta < servicio.basketPCostS.free_shipping_basket) {
          if(servicio.precioTotalCanasta < servicio.basketPCostS.minimun_purchase_basket) { 
            requirementsIdx = 1;
          } else {
            requirementsIdx = 2;
          }
          //servicio.costo_envio = servicio.envio;
        } else {
          requirementsIdx = 3;
          servicio.costo_envio = 0;
        }
      } else {
        requirementsIdx = 0;
        servicio.costo_envio = 0;
      }
      servicio.costo_color = requirementsMeter[requirementsIdx].color;
      servicio.costo_mensaje = requirementsMeter[requirementsIdx].msg;
    }//function actualizar
    actualizar();
    //inicializar();

    //Retorna la canasta para mostarla en la vista
    servicio.listar = function() {
      inicializar();
      return getArticlesBasket();
    };//listar
    servicio.listar();

    //Agrega 'amount' unidades del artículo a la canasta
    servicio.agregar = function(article, amount) {
      var deferred = $q.defer();
      if(authentication.user) {

        if(servicio.basket === null || servicio.basket === undefined) {
          servicio.basket = getArticlesBasket(); //conformada por [{ cabecera:{}, articulos:[] }] >>> {cabecera: Object, articulos: Array[0]}
          servicio.precioTotalCanasta = getPrice();
        }

        if(amount > 0) {
          
          var id_articulo = null;
          var tipo = globals.ARTICULO_SIMPLE;

          //1-Actualizo servicio.basket
          if(article.id_article !== undefined && article.id_article !== null){
            id_articulo = article.id_article;

          } else if(article.id_complex_article  !== undefined && article.id_complex_article !== null) {
            id_articulo = article.id_complex_article;
            tipo = globals.ARTICULO_COMPLEJO;
          }

          var itemActual = buscar(id_articulo, tipo);

          if(servicio.basket === undefined) { servicio.basket = []; }
          if(servicio.basket.cabecera === undefined) { servicio.basket.cabecera = {}; }
          if(servicio.basket.articulos === undefined) { servicio.basket.articulos = []; }

          if(itemActual === null) {
            if(tipo === globals.ARTICULO_SIMPLE) {
              servicio.basket.articulos.push({
                id_article: article.id_article,
                tipo: tipo,
                color: article.color,
                name: article.name,
                article_image_url: article.article_image_url,
                price: article.price,
                scale: article.scale,
                measurement_unit_abbreviation: article.measurement_unit_abbreviation,
                show_equivalence: article.show_equivalence,
                equivalence: article.equivalence,
                measurement_unit_equivalence_abbreviation: article.measurement_unit_equivalence_abbreviation,
                amount: amount
              });
            } else if(tipo === globals.ARTICULO_COMPLEJO){
              servicio.basket.articulos.push({
                id_complex_article: article.id_complex_article,
                tipo: tipo,
                color: article.color,
                name: article.name,
                article_image_url: article.article_image_url,
                price: article.price,
                amount: amount
              });
            }
          } else {
            itemActual.amount += amount;
          }

          servicio.precioTotalCanasta += (amount*article.price);//getPrice();
          actualizar ();

          //2-Guardo el artículo en la BD
          var ajax_params = {};

          if(tipo === globals.ARTICULO_SIMPLE){            
            ajax_params = {
              id_article: article.id_article,
              id_complex_article: null,
              id_location: servicio.id_location_user,
              amount: amount
            };
          } else if(tipo === globals.ARTICULO_COMPLEJO){            
            ajax_params = {
              id_article: null,
              id_complex_article: article.id_complex_article,
              id_location: servicio.id_location_user,
              amount: amount
            };
          }
          BasketArticlesService
          .addToBasket(ajax_params)
          .$promise
          .then(function (result) {
            result.map(function(item){
              servicio.basket = item;
            });           
            deferred.resolve(servicio.basket);
            return deferred.promise;
          }, function(error) {
            servicio.precioTotalCanasta -= (amount*article.price);//getPrice();
            if(itemActual === null) {
              servicio.basket.articulos.splice(servicio.basket.articulos.indexOf(article),1);
            } else {
              itemActual.amount-=amount;
            }
            deferred.reject(error);
            return deferred.promise;
          });
        } else {
          deferred.reject('La cantidad ingresada es negativa');
          return deferred.promise;
        }
      } else {
        deferred.reject('No está autenticado');
        return deferred.promise;
      }
    };//agregar

    //Quita 'amount' unidades del articulo de la canasta
    servicio.quitar = function(article, amount){    
      var deferred = $q.defer();

      if(authentication.user) {

        if(servicio.basket === null || servicio.basket === undefined) {
          servicio.basket = getArticlesBasket(); //conformada por [{ cabecera:{}, articulos:[] }] >>> {cabecera: Object, articulos: Array[0]}
          servicio.precioTotalCanasta = getPrice();
        }

        if(amount > 0) {
          var id_articulo = null;
          var tipo = globals.ARTICULO_SIMPLE;

          //1-Actualizo servicio.basket
          if(article.id_article !== undefined && article.id_article !== null){
            id_articulo = article.id_article;

          } else if(article.id_complex_article  !== undefined && article.id_complex_article !== null) {
            id_articulo = article.id_complex_article;
            tipo = globals.ARTICULO_COMPLEJO;
          }

          var itemActual = buscar(id_articulo, tipo);

          if(itemActual !== null && itemActual.amount > 0) {  //el artículo está en la canasta

            //1-Actualizo servicio.basket
            if((itemActual.amount - amount) > 0) {
              itemActual.amount -= amount;
            } else {
              servicio.basket.articulos.splice(servicio.basket.articulos.indexOf(article),1);
            }
            servicio.precioTotalCanasta -= (amount*article.price);//getPrice();
            actualizar();
            //2-Guardo el artículo en la BD
            var ajax_params = {};

            if(tipo === globals.ARTICULO_SIMPLE){            
              ajax_params = {
                id_article: article.id_article,
                id_complex_article: null,
                id_location: servicio.id_location_user,
                amount: amount
              };
            } else if(tipo === globals.ARTICULO_COMPLEJO){            
              ajax_params = {
                id_article: null,
                id_complex_article: article.id_complex_article,
                id_location: servicio.id_location_user,
                amount: amount
              };
            }

            BasketArticlesService
            .substractOfBasket(ajax_params)
            .$promise
            .then(function (result) {
              result.map(function(item){
                servicio.basket = item;
              });
              deferred.resolve(servicio.basket);
              return deferred.promise;
            }, function(error) {  //Ocurre un error al grabar en la BD > rollback

              servicio.precioTotalCanasta += (amount*article.price);//getPrice();
              if(itemActual !== null && itemActual.amount > 0) {  
                if((itemActual.amount - amount) > 0) {
                  itemActual.amount += amount;
                }
                else {

                  if(tipo === globals.ARTICULO_SIMPLE){            
                    servicio.basket.articulos.push({
                      id_article: article.id_article,
                      color: article.color,
                      name: article.name,
                      article_image_url: article.article_image_url,
                      price: article.price,
                      scale: article.scale,
                      measurement_unit_abbreviation: article.measurement_unit_abbreviation,
                      show_equivalence: article.show_equivalence,
                      equivalence: article.equivalence,
                      measurement_unit_equivalence_abbreviation: article.measurement_unit_equivalence_abbreviation,
                      amount: amount
                    });
                  } 
                  else {
                    if(tipo === globals.ARTICULO_COMPLEJO){            
                      servicio.basket.articulos.push({
                        id_complex_article: article.id_complex_article,
                        color: article.color,
                        name: article.name,
                        article_image_url: article.article_image_url,
                        price: article.price,
                        amount: amount
                      });
                    }
                  }
                }
              }
              deferred.reject(error);
              return deferred.promise;
            });
          } else {
            deferred.reject('El artículo no está en la canasta.');
            return deferred.promise;
          }

        } else {
          deferred.reject('La cantidad ingresada es negativa');
          return deferred.promise;
        }
      } else {
        deferred.reject('No está autenticado');
        return deferred.promise;
      }
    };//quitar

    //Elimina todas las unidades del articulo de la canasta
    servicio.eliminar = function(article){
      var deferred = $q.defer();

      if(authentication.user) {
        if(servicio.basket === null || servicio.basket === undefined) {
          servicio.basket = getArticlesBasket(); //conformada por [{ cabecera:{}, articulos:[] }] >>> {cabecera: Object, articulos: Array[0]}
          servicio.precioTotalCanasta = getPrice();
        }
        var id_articulo = null;
        var tipo = globals.ARTICULO_SIMPLE;

        //1-Actualizo servicio.basket
        if(article.id_article !== undefined && article.id_article !== null){
          id_articulo = article.id_article;

        } else if(article.id_complex_article  !== undefined && article.id_complex_article !== null) {
          id_articulo = article.id_complex_article;
          tipo = globals.ARTICULO_COMPLEJO;
        }

        var itemActual = buscar(id_articulo, tipo);
        if(itemActual !== null) { //el artículo está en la canasta

          //1-Actualizo servicio.basket
          servicio.basket.articulos.splice(servicio.basket.articulos.indexOf(article),1); 
          servicio.precioTotalCanasta -= (itemActual.amount*itemActual.price);//getPrice(); 
          actualizar ();
          //2-Guardo el artículo en la BD
          var ajax_params = {};

          if(tipo === globals.ARTICULO_SIMPLE){            
            ajax_params = {
              id_article: article.id_article,
              id_complex_article: null,
              id_location: servicio.id_location_user
            };
          } else if(tipo === globals.ARTICULO_COMPLEJO){            
            ajax_params = {
              id_article: null,
              id_complex_article: article.id_complex_article,
              id_location: servicio.id_location_user
            };
          }

          BasketArticlesService
          .removeOfBasket(ajax_params)
          .$promise.then(function (result) {
            result.map(function(item){
              servicio.basket = item;
            });
            deferred.resolve(servicio.basket);
            return deferred.promise;  
          }, function(error) {  //Ocurre un error al grabar en la BD > rollback

            servicio.precioTotalCanasta += (itemActual.amount*itemActual.price);//getPrice(); 

            if(itemActual !== null) {

              if(tipo === globals.ARTICULO_SIMPLE){            
                servicio.basket.articulos.push({
                  id_article: itemActual.id_article,
                  color: itemActual.color,
                  name: itemActual.name,
                  article_image_url: itemActual.article_image_url,
                  price: itemActual.price,
                  scale: itemActual.scale,
                  measurement_unit_abbreviation: itemActual.measurement_unit_abbreviation,
                  show_equivalence: itemActual.show_equivalence,
                  equivalence: itemActual.equivalence,
                  measurement_unit_equivalence_abbreviation: itemActual.measurement_unit_equivalence_abbreviation,
                  amount: itemActual.amount
                });
              } 
              else {
                if(tipo === globals.ARTICULO_COMPLEJO){            
                  servicio.basket.articulos.push({
                    id_complex_article: itemActual.id_complex_article,
                    color: itemActual.color,
                    name: itemActual.name,
                    article_image_url: itemActual.article_image_url,
                    price: itemActual.price,
                    amount: itemActual.amount
                  });
                }
              }
            }
            deferred.reject(error);
            return deferred.promise;
          });
        } else {
          deferred.reject('El artículo no está en la canasta.');
          return deferred.promise;
        }
      } else {
        deferred.reject('No está autenticado');
        return deferred.promise;
      }
    };//eliminar

    servicio.comment_purchase = 'Agregá tus comentarios ';
    servicio.add_comment = true;
    servicio.observation = null;

    servicio.addCommentPurchase=function(){
      servicio.add_comment = !servicio.add_comment;
      if (!servicio.add_comment) {
        servicio.observation = null;
        servicio.comment_purchase = 'Quitar comentarios ';
      } else {
        servicio.comment_purchase = 'Agregá tus comentarios ';
      }
    };    

    servicio.selectedAddress = {};
    servicio.selectedHour = null;
    servicio.selectedDate = null;

    servicio.mostrarResumenDeCompra = function() {
      if(authentication.user) {
         if(servicio.basket !== null && servicio.basket !== undefined && servicio.basket.articulos !== undefined && servicio.basket.articulos !== null && servicio.basket.articulos.length > 0 && servicio.precioTotalCanasta > 0) {
          //Si se cargaron los datos necesarios para la entrega (dirección, día y horario), cierro la canasta
          if (servicio.selectedAddress !== null && servicio.selectedAddress !== undefined &&
            servicio.selectedAddress.id_user_address !== null && servicio.selectedAddress.id_user_address !== undefined &&
            servicio.selectedHour !== null && servicio.selectedHour !== undefined &&
            servicio.selectedDate !== null && servicio.selectedDate !== undefined) {

            var modalOptions = {
              closeButtonText: ' ',
              actionButtonText: ' ',
              headerText: '¡Tu compra!',
              bodyText: ' ',
              bodyUrl: 'modules/articles/client/views/basket/basket-confirm-purchase.client.view.html'
            };

            var modalDefaults = {
              backdrop: true,
              keyboard: true,
              modalFade: true,
              templateUrl: '/modules/core/client/views/modal.client.view.html',
              size: 'sm'
            };

            modalService.showModal(modalDefaults, modalOptions);
          } else {
            sweet.show({
              title: 'Faltan Datos',
              text: 'Debe cargar los datos de entrega',
              animation: 'slide-from-top'
            });
          }
        } else {
          sweet.show({
            title: 'Canasta Vacía',
            text: 'Su canasta está vacía',
            animation: 'slide-from-top'
          });
        }
      } else {
        sweet.show({
          title: 'No está autenticado',
          text: '',
          animation: 'slide-from-top'
        });
      }
    }; //mostrarResumenDeCompra

    //Cierro el modal
    servicio.cancelar = function(modalOptions) {
      if (modalOptions !== null && modalOptions !== undefined) { 
        modalOptions.ok();
      }
    };
    
    //Cierra la canasta (luego de la confirmación de los datos)
    servicio.cerrar = function(modalOptions){
      var deferred = $q.defer();

      if(authentication.user) {
        if(servicio.basket === null || servicio.basket === undefined) {
          servicio.basket = getArticlesBasket(); //conformada por [{ cabecera:{}, articulos:[] }] >>> {cabecera: Object, articulos: Array[0]}
          servicio.precioTotalCanasta = getPrice();
        }
        if(servicio.basket === null || servicio.basket === undefined) {
          sweet.show({
            title: 'Canasta Vacía',
            text: 'Su canasta está vacía',
            animation: 'slide-from-top'
          });
          deferred.reject('Su canasta está vacía.');
          return deferred.promise;
        }
        //Si se cargaron los datos necesarios para la entrega (dirección, día y horario), cierro la canasta
        if (servicio.selectedAddress !== null && servicio.selectedAddress !== undefined &&
          servicio.selectedAddress.id_user_address !== null && servicio.selectedAddress.id_user_address !== undefined &&
          servicio.selectedHour !== null && servicio.selectedHour !== undefined &&
          servicio.selectedDate !== null && servicio.selectedDate !== undefined) {
          

          var user_address = "";
          user_address += servicio.selectedAddress.street + " N° ";
          user_address += servicio.selectedAddress.number + " - Piso: ";
          user_address += servicio.selectedAddress.floor + " - Dpto: ";
          user_address += servicio.selectedAddress.apartment; 

          LocationsService.getNameLocation(servicio.selectedAddress.id_location).then(function(data) {
            user_address += ". Localidad: " + data;
            
            ZonesService.getNameZone(servicio.selectedAddress.id_zone).then(function(data) {
              user_address += " - Zona: " + data;
            
              //1-Cierro la canasta en la BD
              var ajax_params = {
                id_location: servicio.id_location_user,
                id_zone: servicio.id_zone_user,
                observation: servicio.observation,
                user_address: user_address,            
                id_hour: servicio.selectedHour.hour_all.id_shipping_time,
                date_basket: servicio.selectedDate.date_mysql            
              };

              BasketArticlesService
              .closeBasket(ajax_params)
              .$promise.then(function (result) {
                //Cierro el modal
                if (modalOptions !== null && modalOptions !== undefined) { 
                  modalOptions.ok();
                }
                servicio.basket = [];
                servicio.precioTotalCanasta = 0;
                
                sweet.show({
                  title: 'Gracias',
                  text: '',
                  type: 'success',
                  animation: 'slide-from-top'
                });
                deferred.resolve(servicio.basket);
                return deferred.promise;
              }, function(error) {  //Ocurre un error al grabar en la BD > rollback
                console.log(error);
                sweet.show({
                title: 'Error al procesar el pedido',
                text: 'Ocurrió un error al grabar su pedido. Intente nuevamente.',
                animation: 'slide-from-top'
              });
                deferred.reject(error);
                return deferred.promise;
              });
            }); //ZonesService.getNameZone
          });//LocationsService.getNameLocation
        } else {
          sweet.show({
            title: 'Faltan Datos',
            text: 'Debe cargar los datos de entrega.',
            animation: 'slide-from-top'
          });
        }
      } else {
        deferred.reject('No está autenticado');
        return deferred.promise;
      }
    };//cerrar

    //Calcula la cantidad de articulo en la canasta tomando el ID, buscándolo primero en la canasta (se usa desde la gondola)
    servicio.cantidadArticuloCanasta = function(articulo) {
      var a = null;
      if(articulo !== undefined && articulo !== null) {
        if(articulo.tipo === globals.ARTICULO_SIMPLE) {
          a = buscar(articulo.id_article, globals.ARTICULO_SIMPLE);
        } 
        else { 
          if(articulo.tipo === globals.ARTICULO_COMPLEJO) {
            a = buscar(articulo.id_complex_article, globals.ARTICULO_COMPLEJO);
          }
        }
        return servicio.calcularUnidadesArticulo(a);
      } 
      return 0;
    }; //cantidadArticuloCanasta



    //Calcula la cantidad de articulo en la canasta tomando como entrada al mismo articulo (se usa desde la canasta)
    servicio.calcularUnidadesArticulo = function(articulo) {
   
      if(articulo !== null && articulo !== undefined) {
        
        if(articulo.tipo === globals.ARTICULO_SIMPLE) {
          var escala = articulo.scale;

          if(escala !== null && escala !== undefined){
              var cantidad = escala.split("/");

            if (cantidad.length < 2) {
              return articulo.amount * escala;
            } else {
              if(cantidad[1] > 0) {
                return articulo.amount * (cantidad[0]/cantidad[1]);
              } else {
                return 0;
              }
            }
          } else {
            return 0;
          }
        }else {
          if(articulo.tipo === globals.ARTICULO_COMPLEJO) {
            return articulo.amount;
          }
        }
      } else {//articulo null o undefined
        return 0;
      }
    };

    servicio.calcularAbrUnidadMedida = function(articulo) {

      var total = servicio.cantidadArticuloCanasta(articulo);
      if (total <= 1) {
        return articulo.measurement_unit_abbreviation;
      } else {
        return articulo.measurement_unit_abbreviation_plural;
      }       
    };
    
    return servicio;
    
  }])//BasketService

.filter('formatoMoneda', function() {
  return function(input) {
    var out = '';
    var valor = 0;
    if(input !== null && input !== undefined) valor = parseFloat(input);
    out = '$' + Math.floor(valor) + '.' + ((valor * 100) % 100 + '00').substr(0,2);
    return out;
  };
});
})();
