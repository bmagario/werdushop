(function () {
  'use strict';

  angular
    .module('articles')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
    // Set top bar menu items
    Menus.addMenuItem('leftbar', {
      title: 'Configuración',
      state: 'config',
      type: 'dropdown',
      roles: ['admin']
    });

    // Set top bar menu items
    Menus.addMenuItem('leftbar', {
      title: 'Compras/Ventas/Stock',
      state: 'articles',
      type: 'dropdown',
      roles: ['admin']
    });

    Menus.addMenuItem('leftbar', {
      title: 'Contaduría',
      state: 'accounting',
      type: 'dropdown',
      roles: ['admin']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('leftbar', 'config', {
      title: 'Artículos',
      state: 'articles.list',
      roles: ['admin']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('leftbar', 'config', {
      title: 'Alta Artículos',
      state: 'articles.create',
      roles: ['admin']
    });

    // Add the dropdown list complex articles.
    Menus.addSubMenuItem('leftbar', 'config', {
      title: 'Artículos Complejos',
      state: 'complex_articles.list',
      roles: ['admin']
    });

    Menus.addSubMenuItem('leftbar', 'config', {
      title: 'Alta Artículos Complejos',
      state: 'complex_articles.create',
      roles: ['admin']
    });

    Menus.addSubMenuItem('leftbar', 'config', {
      title: 'Parámetros de la canasta',
      state: 'basket_params.list',
      roles: ['admin']
    });


    // Add the dropdown cargar compras
    Menus.addSubMenuItem('leftbar', 'articles', {
      title: 'Órdenes de Compra',
      state: 'articles_purchases.list',
      roles: ['admin']
    });

    // Add the dropdown cargar relevamiento de precios.
    Menus.addSubMenuItem('leftbar', 'articles', {
      title: 'Relevamiento Precios',
      state: 'articles_surveys',
      roles: ['admin']
    });

    Menus.addSubMenuItem('leftbar', 'articles', {
      title: 'Órdenes de Entrega',
      state: 'deliveries.list',
      roles: ['admin']
    });

    // Add the dropdown cargar precios
    Menus.addSubMenuItem('leftbar', 'articles', {
      title: 'Precios Artículos',
      state: 'articles_prices',
      roles: ['admin']
    });

    // Add the dropdown cargar precios
    Menus.addSubMenuItem('leftbar', 'articles', {
      title: 'Precios Artículos Complejos',
      state: 'complex_articles.prices',
      roles: ['admin']
    });

    // Add the dropdown ver stock.
    Menus.addSubMenuItem('leftbar', 'articles', {
      title: 'Stock',
      state: 'articles_stocks',
      roles: ['admin']
    });

    // Add the dropdown ver stock.
    Menus.addSubMenuItem('leftbar', 'articles', {
      title: 'Carga Marketing',
      state: 'articles_marketing',
      roles: ['admin']
    });

    // Add the dropdown ver stock.
    Menus.addSubMenuItem('leftbar', 'articles', {
      title: 'Carga Consumo',
      state: 'articles_consumption',
      roles: ['admin']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('leftbar', 'accounting', {
      title: 'Cuentas',
      state: 'accounts.list',
      roles: ['admin']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('leftbar', 'accounting', {
      title: 'Crear Cuenta',
      state: 'accounts.create',
      roles: ['admin']
    });

    Menus.addSubMenuItem('leftbar', 'accounting', {
      title: 'Subcuentas',
      state: 'subaccounts.list',
      roles: ['admin']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('leftbar', 'accounting', {
      title: 'Crear Subcuenta',
      state: 'subaccounts.create',
      roles: ['admin']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('leftbar', 'accounting', {
      title: 'Proveedores',
      state: 'providers.list',
      roles: ['admin']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('leftbar', 'accounting', {
      title: 'Agregar Proveedor',
      state: 'providers.create',
      roles: ['admin']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('leftbar', 'accounting', {
      title: 'Cta. Cte. Proveedores',
      state: 'providers_debts.list',
      roles: ['admin']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('leftbar', 'accounting', {
      title: 'Cta. Cte. Clientes',
      state: 'users_debts.list',
      roles: ['admin']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('leftbar', 'accounting', {
      title: 'Caja',
      state: 'cash.view',
      roles: ['admin']
    });

    Menus.addSubMenuItem('leftbar', 'accounting', {
      title: 'Historial Cajas',
      state: 'cash.history',
      roles: ['admin']
    });
  }
})();
