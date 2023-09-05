import { v4 as uuid } from 'uuid';

// ? Este metodo solo se ejecuta si es que el archivo no es 'undefined', si es 'undefined' se ejecuta el controlador directamente
export const fileNamer = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: Function,
) => {
  if (!file) return callback(new Error('File is Empty'), false);
  const fileExtension = file.mimetype.split('/')[1];
  const fileName = `${uuid()}.${fileExtension}`;

  callback(null, fileName);
};
