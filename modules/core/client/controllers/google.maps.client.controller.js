(function () {
  'use strict';

  // GoogleMapsController controller
  angular
    .module('core')
    .controller('GoogleMapsController', GoogleMapsController);

  GoogleMapsController.$inject = ['$scope', 'NgMap'];
  function GoogleMapsController ($scope, NgMap) {
    var vm = this;
    vm.googleApiUrl = "https://maps.google.com/maps/api/js";
    vm.googleMapsUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyAd1xMYT1bt99qtFWQEzXiRBvORDWHgPtk&libraries=places";
    
    NgMap.getMap().then(function(map) {
      vm.map = map;
      vm.paths = [
        new window.google.maps.LatLng(-38.682562,-62.305527),
        new window.google.maps.LatLng(-38.669428,-62.271194),
        new window.google.maps.LatLng(-38.669428,-62.248192),
        new window.google.maps.LatLng(-38.684706,-62.227249),
        new window.google.maps.LatLng(-38.701052,-62.215576),
        new window.google.maps.LatLng(-38.722483,-62.210083),
        new window.google.maps.LatLng(-38.745783,-62.234802),
        new window.google.maps.LatLng(-38.753816,-62.256775),
        new window.google.maps.LatLng(-38.745247,-62.292137),
        new window.google.maps.LatLng(-38.736678,-62.299690),
        new window.google.maps.LatLng(-38.715787,-62.315138),
        new window.google.maps.LatLng(-38.697301,-62.310329),
        new window.google.maps.LatLng(-38.682562,-62.305525)
      ];

      //Center.
      vm.center = new window.google.maps.LatLng(-38.712304,-62.265015);
      vm.map.setCenter(vm.center);

      //Zoom.
      vm.zoom = 11;
      vm.map.setZoom(vm.zoom);

      //Fit bounds to the specific zone.
      var bounds = new window.google.maps.LatLngBounds();
      for (var i = 0, length = vm.paths.length; i < length; i++) {
        var latlng = vm.paths[i];
        bounds.extend(latlng);
      }
      vm.map.fitBounds(bounds);
      vm.pos = 'current';
    });

    //When place is changed.
    vm.placeChanged = function() {
      vm.place = this.getPlace();
      // console.log('location', vm.place.geometry.location);
      vm.map.setCenter(vm.place.geometry.location);
      vm.esta = vm.map.getBounds().contains(vm.place.geometry.location);

    };

    //
    vm.onClick= function(event) {
      console.log(event);
    };

    vm.getCurrentLocation = function(){
      vm.pos = this.getPosition();
    };
  }
})();
