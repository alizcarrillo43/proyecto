export type Articulo = {
  id: string;
  codigo: string;
  descripcion: string;
  talla: string;
  precio: number;
  existencias: number;
  activo: boolean;
};

export type ModeloArticulo = {
  codigo: string;
  descripcion: string;
  precio: number;
  pausado: boolean;
  tallas: Articulo[];
};

export type Perfil = {
  id: string;
  nombre: string;
  usuario: string;
  rol: 'superusuario' | 'empleado';
  debe_cambiar_contrasena: boolean;
};

export type Empleado = {
  id: string;
  nombre: string;
  usuario: string;
  correo: string | null;
  lada: string;
  telefono: string;
  activo: boolean;
  debe_cambiar_contrasena: boolean;
};

export type LineaVenta = {
  articuloId: string;
  codigo: string;
  descripcion: string;
  talla: string;
  precio: number;
  cantidad: number;
  existencias: number;
};

export type LineaHistorial = {
  id: string;
  folio: string;
  fecha: string;
  vendedor: string;
  descripcion: string;
  talla: string;
  cantidad: number;
  precioUnitario: number;
};
