import { includes } from 'lodash';

// ? Este metodo solo se ejecuta si es que el archivo no es 'undefined', si es 'undefined' se ejecuta el controlador directamente
export const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: Function,
) => {
  if (!file) return callback(new Error('File is Empty'), false);
  const fileExtension = file.mimetype.split('/')[1];
  const validExtensions = ['jpg', 'png', 'jpeg', 'gif'];

  if (includes(validExtensions, fileExtension)) {
    return callback(null, true);
  }

  callback(null, false);
};
