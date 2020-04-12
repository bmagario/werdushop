'use strict';

module.exports = {
  client: {
    lib: {
      css: [
        'public/lib/bootstrap/dist/css/bootstrap.css',
        'public/lib/bootstrap/dist/css/bootstrap-theme.css',
        'public/lib/bootstrap/dist/css/bootstrap.flatten.css',
        'public/lib/font-awesome/css/font-awesome.css',
        'public/lib/font-awesome/css/font-awesome.min.css',
        'public/lib/angular-bootstrap-colorpicker/css/colorpicker.min.css',
        'public/lib/ng-table/dist/ng-table.min.css',
        'public/lib/angular-aside-menu/dist/aside-menu.css',
        'public/lib/angular-loading-bar/src/loading-bar.css',
        'public/lib/angular-ui-bootstrap-datetimepicker/datetimepicker.css',
        'public/lib/sweetalert/dist/sweetalert.css',
        'public/lib/angular-multiple-date-picker/dist/multipleDatePicker.css'
      ],
      js: [
        'public/lib/angular/angular.js',
        'public/lib/angular-resource/angular-resource.js',
        'public/lib/angular-animate/angular-animate.js',
        'public/lib/angular-messages/angular-messages.js',
        'public/lib/angular-ui-router/release/angular-ui-router.js',
        'public/lib/angular-ui-utils/ui-utils.js',
        'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
        'public/lib/angular-file-upload/angular-file-upload.js',
        'public/lib/ng-table/dist/ng-table.min.js',
        'public/lib/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.min.js',
        'public/lib/angular-local-storage/dist/angular-local-storage.min.js',
        'public/lib/owasp-password-strength-test/owasp-password-strength-test.js',
        'public/lib/moment/moment-with-locales.min.js',
        'public/lib/angular-input-masks/angular-input-masks-standalone.min.js',
        'public/lib/angular-i18n/angular-locale_es-ar.js',
        'public/lib/angular-aside-menu/dist/aside-menu.js',
        'public/lib/ngmap/build/scripts/ng-map.min.js',
        'public/lib/angular-svg-round-progressbar/build/roundProgress.min.js',
        'public/lib/angular-loading-bar/src/loading-bar.js',
        'public/lib/angular-ui-bootstrap-datetimepicker/datetimepicker.js',
        'public/lib/sweetalert/dist/sweetalert.min.js',
        'public/lib/angular-sweetalert/dist/ngSweetAlert.min.js',
        'public/lib/angular-file-saver/dist/angular-file-saver.bundle.min.js',
        'public/lib/angular-multiple-date-picker/dist/multipleDatePicker.min.js',
        'public/lib/moment/min/moment.min.js',
        'public/lib/moment/locale/es.js',
        'public/lib/angular-moment/angular-moment.min.js',
      ],
      tests: ['public/lib/angular-mocks/angular-mocks.js']
    },
    css: [
      'modules/*/client/css/*.css'
    ],
    less: [
      'modules/*/client/less/*.less'
    ],
    sass: [
      'modules/*/client/scss/*.scss'
    ],
    js: [
      'modules/core/client/app/config.js',
      'modules/core/client/app/init.js',
      'modules/*/client/*.js',
      'modules/*/client/**/*.js'
    ],
    views: ['modules/*/client/views/**/*.html'],
    templates: ['build/templates.js']
  },
  server: {//ATENCIONNNNNNNNNN. OBSERVAR LA LINEA ROUTES PARA AGREGAR UNA API EN CORE.
    gulpConfig: 'gulpfile.js',
    allJS: ['server.js', 'config/**/*.js', 'modules/*/server/**/*.js'],
    models: 'modules/*/server/models/**/*.js',
    routes: ['modules/!(core)/server/routes/**/*.js', 'modules/**/server/routes/**/*.js'],
    sockets: 'modules/*/server/sockets/**/*.js',
    config: 'modules/*/server/config/*.js',
    policies: 'modules/*/server/policies/*.js',
    views: 'modules/*/server/views/*.html'
  }
};
