'use strict';

var excel_properties = {
  //Border.
  borderStyleAll : {
    top: { style:'thin' },
    left: { style:'thin' },
    bottom: { style:'thin' },
    right: { style:'thin' }
  },

  borderStyleAllMedium : {
    top: { style:'medium' },
    left: { style:'medium' },
    bottom: { style:'medium' },
    right: { style:'medium' }
  },

  borderStyleTLR : {
    top: { style:'thin' },
    left: { style:'thin' },
    right: { style:'thin' }
  },

  borderStyleTLRMedium : {
    top: { style:'medium' },
    left: { style:'medium' },
    right: { style:'medium' }
  },

  borderStyleBLR : {
    bottom: { style:'thin' },
    left: { style:'thin' },
    right: { style:'thin' }
  },

  borderStyleBLRMedium : {
    bottom: { style:'medium' },
    left: { style:'medium' },
    right: { style:'medium' }
  },

  borderStyleBL : {
    bottom: { style:'thin' },
    left: { style:'thin' }
  },

  borderStyleBLMedium: {
    bottom: { style:'medium' },
    left: { style:'medium' }
  },

  borderStyleBR : {
    bottom: { style:'thin' },
    right: { style:'thin' }
  },

  borderStyleBRMedium: {
    bottom: { style:'medium' },
    right: { style:'medium' }
  },

  borderStyleLR : {
    left: { style:'thin' },
    right: { style:'thin' }
  },

  borderStyleLRMedium: {
    left: { style:'medium' },
    right: { style:'medium' }
  },

  borderStyleB : {
    bottom: { style:'thin' },
  },

  borderStyleBMedium : {
    bottom: { style:'medium' },
  },

  borderStyleT : {
    top: { style:'thin' },
  },

  borderStyletMedium : {
    top: { style:'medium' },
  },
  borderStyleL : {
    left: { style:'thin' },
  },

  borderStyleLMedium : {
    left: { style:'medium' },
  },

  borderStyleR : {
    right: { style:'thin' },
  },

  borderStyleRMedium : {
    right: { style:'medium' },
  },

  //Aligment.
  alignmentCenter : {
    vertical: 'middle',
    horizontal: 'center'
  },

  //Font
  fontTitle : {
    name: 'Calibri',
    family: 4,
    size: 20,
    bold: true
  },

  fontSubTitle : {
    name: 'Calibri',
    family: 4,
    size: 12,
    bold: true
  },

  fontSubTitleRed : {
    name: 'Calibri',
    family: 4,
    size: 12,
    bold: true,
    color: { argb: 'FFFF0000' }
  },

  //Fill
  fillPromotion : {
    type: 'pattern',
    pattern:'solid',
    fgColor:{ argb:'FFF6F8FA' }
  },

  fillLightBlue: {
    type: 'pattern',
    pattern:'solid',
    fgColor:{ argb:'8EDFD4FF' }
  }
};

module.exports = excel_properties;
