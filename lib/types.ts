export type Articulo = {
  id: string;
  codigo: string;
  descripcion: string;
  talla: string;
  precio: number;
  existencias: number;
};

export type Perfil = {
  id: string;
  nombre: string;
  usuario: string;
  rol: 'vendedor' | 'administrador';
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

export type VentaHistorial = {
  folio: string;
  fecha: string;
  vendedor: string;
  piezas: number;
  total: number;
};
