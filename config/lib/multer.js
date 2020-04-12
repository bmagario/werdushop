'use strict';

module.exports.articleUploadFileFilter = function (req, file, cb) {
  if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/gif') {
    return cb(new Error('Solo se permiten imágenes!'), false);
  }
  cb(null, true);
};