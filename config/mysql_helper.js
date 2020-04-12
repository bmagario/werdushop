'use strict';

module.exports.getWhereFilterArticles = function getWhereFilterArticles(connection, query_filter){
  var where = '';
  if(query_filter !== undefined && query_filter.name !== undefined && query_filter.name !== ''){
    where += 'WHERE ';
    where += '  LOWER(a.name) LIKE LOWER(' + connection.escape(query_filter.name+'%') + ') ';
  }

  //Si se envio filtro por grupo.
  if(query_filter !== undefined && query_filter.id_group !== undefined && query_filter.id_group !== '0'){
    if(where !== ''){
      where += 'AND g.id_group = ' + connection.escape(query_filter.id_group) + ' ';
    } else{
      where += 'WHERE ';
      where += '    g.id_group = ' + connection.escape(query_filter.id_group) + ' ';
    }
  }

  if(query_filter !== undefined && query_filter.group_name !== undefined && query_filter.group_name !== ''){
    if(where !== ''){
      where += '  LOWER(g.name) LIKE LOWER(' + connection.escape(query_filter.group_name+'%') + ') ';
    } else{
      where += 'WHERE ';
      where += '  LOWER(g.name) LIKE LOWER(' + connection.escape(query_filter.group_name+'%') + ') ';
    }
  }

  //Si se envio filtro por subgrupo.
  if(query_filter !== undefined && query_filter.id_subgroup !== undefined && query_filter.id_subgroup !== '0'){
    if(where !== ''){
      where += 'AND sg.id_subgroup = ' + connection.escape(query_filter.id_subgroup) + ' ';
    } else{
      where += 'WHERE ';
      where += '    sg.id_subgroup = ' + connection.escape(query_filter.id_subgroup) + ' ';
    }
  }

  if(query_filter !== undefined && query_filter.subgroup_name !== undefined && query_filter.subgroup_name !== ''){
    if(where !== ''){
      where += '  LOWER(sg.name) LIKE LOWER(' + connection.escape(query_filter.subgroup_name+'%') + ') ';
    } else{
      where += 'WHERE ';
      where += '  LOWER(sg.name) LIKE LOWER(' + connection.escape(query_filter.subgroup_name+'%') + ') ';
    }
  }

  //Si se envio filtro por marca.
  if(query_filter !== undefined && query_filter.id_brand !== undefined && query_filter.id_brand !== '0'){
    if(where !== ''){
      where += 'AND b.id_brand = ' + connection.escape(query_filter.id_brand) + ' ';
    } else{
      where += 'WHERE ';
      where += '    b.id_brand = ' + connection.escape(query_filter.id_brand) + ' ';
    }
  }

  if(query_filter !== undefined && query_filter.brand_name !== undefined && query_filter.brand_name !== ''){
    if(where !== ''){
      where += '  LOWER(b.name) LIKE LOWER(' + connection.escape(query_filter.brand_name+'%') + ') ';
    } else{
      where += 'WHERE ';
      where += '  LOWER(b.name) LIKE LOWER(' + connection.escape(query_filter.brand_name+'%') + ') ';
    }
  }

  //Si se envio filtro por estado.
  if(query_filter !== undefined && query_filter.id_status !== undefined && query_filter.id_status !== '0'){
    if(where !== ''){
      where += 'AND st.id_status = ' + connection.escape(query_filter.id_status) + ' ';
    } else{
      where += 'WHERE ';
      where += '    st.id_status = ' + connection.escape(query_filter.id_status) + ' ';
    }
  }

  //Si se envio filtro por full_code
  if(query_filter !== undefined && query_filter.full_code !== undefined){
    var full_code_mysql = 'CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 3, 0))';
    if(where !== ''){
      where += 'AND ' + full_code_mysql + ' LIKE ' + connection.escape(query_filter.full_code+'%') + ' ';
    } else{
      where += 'WHERE ';
      where += '    ' + full_code_mysql + ' LIKE ' + connection.escape(query_filter.full_code+'%') + ' ';
    }
  }

  if(query_filter !== undefined && query_filter.subgroup_code !== undefined){
    var subgroup_code_mysql = 'CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0))';
    if(where !== ''){
      where += 'AND ' + subgroup_code_mysql + ' LIKE ' + connection.escape(query_filter.subgroup_code+'%') + ' ';
    } else{
      where += 'WHERE ';
      where += '    ' + subgroup_code_mysql + ' LIKE ' + connection.escape(query_filter.subgroup_code+'%') + ' ';
    }
  }

  if(query_filter !== undefined && query_filter.group_code !== undefined){
    var group_code_mysql = 'LPAD(g.code, 2, 0)';
    if(where !== ''){
      where += 'AND ' + group_code_mysql + ' LIKE ' + connection.escape(query_filter.group_code+'%') + ' ';
    } else{
      where += 'WHERE ';
      where += '    ' + group_code_mysql + ' LIKE ' + connection.escape(query_filter.group_code+'%') + ' ';
    }
  }

  //Si se envio filtro por id de basket order.
  if(query_filter !== undefined && query_filter.id_basket_order !== undefined && query_filter.id_basket_order !== '0'){
    if(where !== ''){
      where += 'AND bo.id_basket_order = ' + connection.escape(query_filter.id_basket_order) + ' ';
    } else{
      where += 'WHERE ';
      where += '    bo.id_basket_order = ' + connection.escape(query_filter.id_basket_order) + ' ';
    }
  }

  //Si se envio filtro por subgrupo.
  if(query_filter !== undefined && query_filter.id_provider !== undefined && query_filter.id_provider !== '0'){
    if(where !== ''){
      where += 'AND pop.id_provider = ' + connection.escape(query_filter.id_provider) + ' ';
    } else{
      where += 'WHERE ';
      where += '    pop.id_provider = ' + connection.escape(query_filter.id_provider) + ' ';
    }
  }

  return where;
};

module.exports.getOrderBy = function getOrderBy(sort_default, sorting){
  var order_by = 'ORDER BY ';
  if (sorting) {
    var sortKey = Object.keys(sorting)[0];
    var sortValue = sorting[sortKey];
    switch(sortKey){
      case 'full_code':
        order_by += 'full_code ' + sortValue + ' ';
        break;
      case 'name':
        order_by += 'a.name ' + sortValue + ' ';
        break;
      case 'id_subgroup':
        order_by += 'sg.name ' + sortValue + ' ';
        break;
      case 'id_group':
        order_by += 'g.name ' + sortValue + ' ';
        break;
      case 'id_brand':
        order_by += 'b.name ' + sortValue + ' ';
        break;
      case 'created':
        order_by += 'a.created ' + sortValue + ' ';
        break;
      case 'brand_created':
        order_by += 'b.created ' + sortValue + ' ';
        break;
      case 'group_created':
        order_by += 'g.created ' + sortValue + ' ';
        break;
      case 'subgroup_created':
        order_by += 'sg.created ' + sortValue + ' ';
        break;
      case 'group_code':
        order_by += 'g.code ' + sortValue + ' ';
        break;
      case 'subgroup_code':
        order_by += 'sg.code ' + sortValue + ' ';
        break;
      case 'basket_created':
        order_by += 'bo.created ' + sortValue + ' ';
        break;
      case 'purchase_created':
        order_by += 'po.created ' + sortValue + ' ';
        break;
      case 'purchase_number':
        order_by += 'po.number ' + sortValue + ' ';
        break;
      case 'id_provider':
        order_by += 'pr.nombre_fantasia ' + sortValue + ' ';
        break;
      default:
        order_by += sort_default + ' ';
        break;
    }
  } else {
    order_by += sort_default + ' ';
  }

  return order_by;
};

module.exports.getWhereFilterAccount = function getWhereFilterAccount(connection, query_filter){
  var where = '';

  //Si se envio filtro por cuenta.
  if(query_filter !== undefined && query_filter.id_account !== undefined && query_filter.id_account !== '0'){
    if(where !== ''){
      where += 'AND acc.id_account = ' + connection.escape(query_filter.id_account) + ' ';
    } else{
      where += 'WHERE ';
      where += '    acc.id_account = ' + connection.escape(query_filter.id_account) + ' ';
    }
  }

  if(query_filter !== undefined && query_filter.account_type !== undefined && query_filter.account_type !== '0'){
    if(where !== ''){
      where += 'AND acc.account_type = ' + connection.escape(query_filter.account_type) + ' ';
    } else{
      where += 'WHERE ';
      where += '    acc.account_type = ' + connection.escape(query_filter.account_type) + ' ';
    }
  }

  //Filtro por descripcion de cuenta.
  if(query_filter !== undefined && query_filter.acc_description !== undefined && query_filter.acc_description !== ''){
    if(where !== ''){
      where += '  LOWER(acc.description) LIKE LOWER(' + connection.escape(query_filter.acc_description+'%') + ') ';
    } else{
      where += 'WHERE ';
      where += '  LOWER(acc.description) LIKE LOWER(' + connection.escape(query_filter.acc_description+'%') + ') ';
    }
  }

  //Si se envio filtro por estado de cuenta.
  if(query_filter !== undefined && query_filter.acc_id_status !== undefined && query_filter.acc_id_status !== '0'){
    if(where !== ''){
      where += 'AND acc.id_status = ' + connection.escape(query_filter.acc_id_status) + ' ';
    } else{
      where += 'WHERE ';
      where += '    acc.id_status = ' + connection.escape(query_filter.acc_id_status) + ' ';
    }
  }

  if(query_filter !== undefined && query_filter.id_subaccount !== undefined && query_filter.id_subaccount !== '0'){
    if(where !== ''){
      where += 'AND sacc.id_subaccount = ' + connection.escape(query_filter.id_subaccount) + ' ';
    } else{
      where += 'WHERE ';
      where += '    sacc.id_subaccount = ' + connection.escape(query_filter.id_subaccount) + ' ';
    }
  }

  //Filtro por descripcion de subcuenta.
  if(query_filter !== undefined && query_filter.sacc_description !== undefined && query_filter.sacc_description !== ''){
    if(where !== ''){
      where += '  LOWER(sacc.description) LIKE LOWER(' + connection.escape(query_filter.sacc_description+'%') + ') ';
    } else{
      where += 'WHERE ';
      where += '  LOWER(sacc.description) LIKE LOWER(' + connection.escape(query_filter.sacc_description+'%') + ') ';
    }
  }

  //Si se envio filtro por estado de subcuenta.
  if(query_filter !== undefined && query_filter.sacc_id_status !== undefined && query_filter.sacc_id_status !== '0'){
    if(where !== ''){
      where += 'AND sacc.id_status = ' + connection.escape(query_filter.sacc_id_status) + ' ';
    } else{
      where += 'WHERE ';
      where += '    sacc.id_status = ' + connection.escape(query_filter.sacc_id_status) + ' ';
    }
  }

  return where;
};

module.exports.getOrderByAccount = function getOrderByAccount(sort_default, sorting){
  var order_by = 'ORDER BY ';
  if (sorting) {
    var sortKey = Object.keys(sorting)[0];
    var sortValue = sorting[sortKey];
    switch(sortKey){
      case 'acc_description':
        order_by += 'acc.description ' + sortValue + ' ';
        break;
      case 'account_created':
        order_by += 'acc.created ' + sortValue + ' ';
        break;
      case 'id_account':
        order_by += 'acc.id_account ' + sortValue + ' ';
        break;
      case 'sacc_description':
        order_by += 'sacc.description ' + sortValue + ' ';
        break;
      case 'subaccount_created':
        order_by += 'sacc.created ' + sortValue + ' ';
        break;
      case 'id_subaccount':
        order_by += 'sacc.id_subaccount ' + sortValue + ' ';
        break;
      default:
        order_by += sort_default + ' ';
        break;
    }
  } else {
    order_by += sort_default + ' ';
  }

  return order_by;
};

module.exports.getWhereFilterProvider = function getWhereFilterProvider(connection, query_filter){
  var where = '';

  //Filtro por nombre de fantasia del proveedor.
  if(query_filter !== undefined && query_filter.nombre_fantasia !== undefined && query_filter.nombre_fantasia !== ''){
    if(where !== ''){
      where += '  LOWER(nombre_fantasia) LIKE LOWER(' + connection.escape(query_filter.nombre_fantasia+'%') + ') ';
    } else{
      where += 'WHERE ';
      where += '  LOWER(nombre_fantasia) LIKE LOWER(' + connection.escape(query_filter.nombre_fantasia+'%') + ') ';
    }
  }

  if(query_filter !== undefined && query_filter.cuit !== undefined && query_filter.cuit !== ''){
    if(where !== ''){
      where += '  LOWER(cuit) LIKE LOWER(' + connection.escape(query_filter.cuit+'%') + ') ';
    } else{
      where += 'WHERE ';
      where += '  LOWER(cuit) LIKE LOWER(' + connection.escape(query_filter.cuit+'%') + ') ';
    }
  }

  //Si se envio filtro por id de proveedor.
  if(query_filter !== undefined && query_filter.id_provider !== undefined && query_filter.id_provider !== '0'){
    if(where !== ''){
      where += 'AND id_provider = ' + connection.escape(query_filter.id_provider) + ' ';
    } else{
      where += 'WHERE ';
      where += '    id_provider = ' + connection.escape(query_filter.id_provider) + ' ';
    }
  }

  //Si se envio filtro por estado.
  if(query_filter !== undefined && query_filter.id_status !== undefined && query_filter.id_status !== '0'){
    if(where !== ''){
      where += 'AND p.id_status = ' + connection.escape(query_filter.id_status) + ' ';
    } else{
      where += 'WHERE ';
      where += '    p.id_status = ' + connection.escape(query_filter.id_status) + ' ';
    }
  }

  return where;
};

module.exports.getOrderByProvider = function getOrderByProvider(sort_default, sorting){
  var order_by = 'ORDER BY ';
  if (sorting) {
    var sortKey = Object.keys(sorting)[0];
    var sortValue = sorting[sortKey];
    switch(sortKey){
      case 'nombre_fantasia':
        order_by += 'p.nombre_fantasia ' + sortValue + ' ';
        break;
      case 'cuit':
        order_by += 'p.cuit ' + sortValue + ' ';
        break;
      default:
        order_by += sort_default + ' ';
        break;
    }
  } else {
    order_by += sort_default + ' ';
  }

  return order_by;
};

module.exports.getWhereFilterUser = function getWhereFilterUser(connection, query_filter){
  var where = '';

  //Filtro por nombre de fantasia del proveedor.
  if(query_filter !== undefined && query_filter.user_name !== undefined && query_filter.user_name !== ''){
    if(where !== ''){
      where += '  LOWER(CONCAT(u.first_name, " ", u.last_name)) LIKE LOWER(' + connection.escape(query_filter.user_name+'%') + ') ';
    } else{
      where += 'WHERE ';
      where += '  LOWER(CONCAT(u.first_name, " ", u.last_name)) LIKE LOWER(' + connection.escape(query_filter.user_name+'%') + ') ';
    }
  }

  //Si se envio filtro por id de proveedor.
  if(query_filter !== undefined && query_filter.id_user !== undefined && query_filter.id_user !== '0'){
    if(where !== ''){
      where += 'AND id_user = ' + connection.escape(query_filter.id_user) + ' ';
    } else{
      where += 'WHERE ';
      where += '    id_user = ' + connection.escape(query_filter.id_user) + ' ';
    }
  }

  //Si se envio filtro por estado.
  if(query_filter !== undefined && query_filter.id_status !== undefined && query_filter.id_status !== '0'){
    if(where !== ''){
      where += 'AND u.id_status = ' + connection.escape(query_filter.id_status) + ' ';
    } else{
      where += 'WHERE ';
      where += '    up.id_status = ' + connection.escape(query_filter.id_status) + ' ';
    }
  }

  return where;
};

module.exports.getOrderByUser = function getOrderByProvider(sort_default, sorting){
  var order_by = 'ORDER BY ';
  if (sorting) {
    var sortKey = Object.keys(sorting)[0];
    var sortValue = sorting[sortKey];
    switch(sortKey){
      case 'user_name':
        order_by += 'user_name ' + sortValue + ' ';
        break;
      default:
        order_by += sort_default + ' ';
        break;
    }
  } else {
    order_by += sort_default + ' ';
  }

  return order_by;
};

module.exports.getOrderByCash = function getOrderByCash(sort_default, sorting){
  var order_by = 'ORDER BY ';
  if (sorting) {
    var sortKey = Object.keys(sorting)[0];
    var sortValue = sorting[sortKey];
    switch(sortKey){
      case 'cash_type':
        order_by += 'cash_type ' + sortValue + ' ';
        break;
      case 'cash_created':
        order_by += 'cd.created ' + sortValue + ' ';
        break;
      case 'account_type':
        order_by += 'acc.account_type ' + sortValue + ' ';
        break;
      default:
        order_by += sort_default + ' ';
        break;
    }
  } else {
    order_by += sort_default + ' ';
  }

  return order_by;
};

module.exports.getLimitAndPagination = function getLimitAndPagination(page, count){
  var pagination = {
    start: (page - 1) * count,
    count: count
  };
  var limit = 'LIMIT '+pagination.start+', '+pagination.count+';';
  return { limit:limit, pagination: pagination };
};

module.exports.getResult = function getResult(results, total, pagination){
  var result = {
    options : {
      count : pagination.count,
      start : pagination.start
    },
    results : results,
    total : total
  };
  return result;
};
