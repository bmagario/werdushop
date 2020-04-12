'use strict';

var globals = {
  ACTIVO: 1,
  NO_ACTIVO: 2,
  SUSPENDIDO: 3,
  SUSPENDIDO_TEMPORADA: 4,
  CANASTA_ACTIVA: 5, //canasta habilitada para continuar comprando
  CANASTA_CERRADA: 6,	//el cliente culmina su compra
  CANASTA_PENDIENTE_ENTREGA: 7,	//canasta en proceso de compra (mercado), para armar la orden de compra consolidada
  CANASTA_ENTREGADA: 8, //canasta entregada al cliente
  OC_ACTIVA: 9, //Orden de compra activa.
  OC_FINALIZADA: 10, // Orden de compra finalizada.
  OE_ACTIVA: 11, //Orden de entrega activa.
  OE_FINALIZADA: 12, //Orden de entrega finalizada.
  STOCK_ACTIVO: 13, //Stock activo.
  STOCK_CERRADO: 14, //Stock cerrado.
  RELEVAMIENTO_ACTIVO: 15, //Relevamiento activo.
  RELEVAMIENTO_FINALIZADO: 16, //Relevamiento finalizado.
  ARTICULO_A_ENTREGAR: 17, //Articulo a entregar.
  ARTICULO_ENTREGADO: 18, //Articulo entregado.
  ARTICULO_NO_ENTREGADO: 19, //Articulo no entregado.
  ARTICULO_CAMBIADO: 20, //Articulo cambiado.
  ROL_ADMIN: 1, //Rol Admin.
  ROL_USER: 2, //Rol User.
  ERROR: 0,
  OK: 1,
  WARNING: 2,
  WARNING_ARTICULOS_EN_CERO: 3,
  WARNING_ARTICULOS_SIN_STOCK: 4,
  PROVINCES: {
    BUENOS_AIRES: 1,
    CABA: 2
  },
  LOCATIONS: {
    BAHIA_BLANCA: 1,
    CAPITAL_FEDERAL: 2
  },
  ZONES: {
    BAHIA_BLANCA_1: 1,
    CAPITAL_FEDERAL_1: 2
  },
  PANEL_DELIVERIES: 1,
  DELIVERIES: 2,
  INGRESO: 1,
  EGRESO: 2,
  USERS: 3,
  PROVIDERS: 4,

  CANTIDAD_MAX_DIRECCIONES: 2,

  PAYMENT_METHOD_PAGO: 1,
  PAYMENT_METHOD_COBRO: 2,
  PAYMENT_METHOD_AMBOS: 3,
  PAGO_PENDIENTE: 1,
  PAGO_SALDADO: 2,
  PAGOS: {
    CAJA: 1,
    CTA_CORRIENTE: 2,
    SUMA: 1,
    RESTA: -1
  },
  CUENTAS: {
    VENTAS: 1,
    COSTOS: 2,
    PRESENTES: 4,
    DESPERDICIO_COMPRA: 5,
    COMPRAS: 6
  },
  SUBCUENTAS: {
    VENTAS_ONLINE: 1,
    VENTAS_OFFLINE: 2,
    COSTO_VENTAS_ONLINE: 3,
    COSTO_VENTAS_OFFLINE: 4,
    VENTAS_COBRADAS: 5,
    PRESENTES: 7,
    DESPERDICIO_COMPRA: 8,
    COMPRAS_PAGADAS: 9
  },
  ARTICULO_SIMPLE: 0,
  ARTICULO_COMPLEJO: 1
};

module.exports = globals;
