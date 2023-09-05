export interface JwtPayload {
  id: string;
  email?: string;
  password?: string;
  fullName?: string;

  //* Añadir todo lo que se quiera grabar en el token JWT
}
