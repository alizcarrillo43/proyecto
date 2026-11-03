'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ClearSaleDialog } from '@/components/pos/clear-sale-dialog';
import { CashWithdrawalDialog } from '@/components/pos/cash-withdrawal-dialog';
import { PriceLookupDialog } from '@/components/pos/price-lookup-dialog';
import { PosTopBar } from '@/components/pos/pos-top-bar';
import { SaleCaptureRow } from '@/components/pos/sale-capture-row';
import { SaleSummary } from '@/components/pos/sale-summary';
import { SaleTable } from '@/components/pos/sale-table';
import { TicketVentaDialog, type TicketVenta } from '@/components/pos/ticket-venta-dialog';
import { TurnoRequeridoAviso } from '@/components/turnos/turno-requerido-aviso';
import { useSesion } from '@/components/session-provider';
import { useArticulos } from '@/hooks/use-articulos';
import { useTurnoAbierto } from '@/hooks/use-turno-abierto';
import { formatMXN } from '@/lib/format';
import { registrarVenta, type MetodoPago } from '@/lib/inventario-api';
import type { Articulo, LineaVenta } from '@/lib/types';

const MENSAJE_SIN_EXISTENCIAS = 'No hay más existencias de este artículo';

function crearLinea(articulo: Articulo, cantidad = 1): LineaVenta {
  return {
    articuloId: articulo.id,
    codigo: articulo.codigo,
    descripcion: articulo.descripcion,
    talla: articulo.talla,
    precio: articulo.precio,
    existencias: articulo.existencias,
    cantidad,
  };
}

export function PosScreen() {
  const { articulos, error: errorArticulos, recargar } = useArticulos();
  const articulosVendibles = articulos.filter((articulo) => articulo.activo);
  const [lineas, setLineas] = useState<LineaVenta[]>([]);
  const [cobrando, setCobrando] = useState(false);
  const [confirmarVaciado, setConfirmarVaciado] = useState(false);
  const [consultaAbierta, setConsultaAbierta] = useState(false);
  const [retiroAbierto, setRetiroAbierto] = useState(false);
  const [ticket, setTicket] = useState<TicketVenta | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const { perfil } = useSesion();
  const turno = useTurnoAbierto(perfil?.rol === 'empleado');
  const avisoTurno = perfil?.rol === 'empleado' && turno.estado !== 'abierto' ? turno.estado : null;
  const codigoRef = useRef<HTMLInputElement>(null);

  const piezas = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
  const total = lineas.reduce(
    (suma, linea) => suma + linea.precio * linea.cantidad,
    0
  );

  function agregarArticulo(articulo: Articulo) {
    const linea = lineas.find((item) => item.articuloId === articulo.id);
    if (!linea) {
      if (articulo.existencias <= 0) {
        toast.error(MENSAJE_SIN_EXISTENCIAS);
        return;
      }
      setLineas((actuales) => [...actuales, crearLinea(articulo)]);
      return;
    }
    if (linea.cantidad >= linea.existencias) {
      toast.error(MENSAJE_SIN_EXISTENCIAS);
      return;
    }
    cambiarCantidad(articulo.id, 1);
  }

  function cambiarCantidad(articuloId: string, cambio: number) {
    const linea = lineas.find((item) => item.articuloId === articuloId);
    if (!linea) return;
    if (cambio > 0 && linea.cantidad >= linea.existencias) {
      toast.error(MENSAJE_SIN_EXISTENCIAS);
      return;
    }
    if (cambio < 0 && linea.cantidad <= 1) return;
    setLineas((actuales) =>
      actuales.map((item) =>
        item.articuloId === articuloId
          ? { ...item, cantidad: item.cantidad + cambio }
          : item
      )
    );
  }

  function quitarLinea(articuloId: string) {
    setLineas((actuales) =>
      actuales.filter((item) => item.articuloId !== articuloId)
    );
  }

  function vaciarVenta() {
    setLineas([]);
    setConfirmarVaciado(false);
    codigoRef.current?.focus();
  }

  async function cobrar() {
    if (cobrando || lineas.length === 0) return;
    const lineasVendidas = lineas;
    setCobrando(true);
    const metodoVendido = metodoPago;
    const resultado = await registrarVenta(lineasVendidas, metodoVendido);
    setCobrando(false);

    if (!resultado.ok) {
      toast.error(resultado.error);
      void recargar();
      return;
    }

    setTicket({
      folio: resultado.folio,
      fecha: new Date(),
      vendedor: perfil?.nombre ?? 'Vendedor',
      lineas: lineasVendidas,
      total: resultado.total,
      metodoPago: metodoVendido,
    });
    setLineas([]);
    void recargar();
  }

  function cerrarTicket(abierto: boolean) {
    if (abierto) return;
    setTicket(null);
    codigoRef.current?.focus();
  }

  function registrarRetiro({ monto }: { monto: number; motivo: string }) {
    toast.success(`Retiro de ${formatMXN(monto)} registrado`);
    setRetiroAbierto(false);
  }

  return (
    <>
      <PosTopBar
        onConsultarPrecio={() => setConsultaAbierta(true)}
        onNuevaVenta={() => setConfirmarVaciado(true)}
        onRetirarEfectivo={() => setRetiroAbierto(true)}
      />

      {avisoTurno ? (
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          <TurnoRequeridoAviso estado={avisoTurno} onReintentar={() => void turno.recargar()} />
        </div>
      ) : (
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        {errorArticulos && (
          <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            <span>{errorArticulos}</span>
            <button type="button" onClick={() => void recargar()} className="font-semibold underline underline-offset-4">
              Reintentar
            </button>
          </div>
        )}

        <SaleCaptureRow
          articulos={articulosVendibles}
          onAgregar={agregarArticulo}
          inputRef={codigoRef}
        />

        <SaleTable
          lineas={lineas}
          onCambiarCantidad={cambiarCantidad}
          onQuitar={quitarLinea}
        />

        <SaleSummary
          piezas={piezas}
          total={total}
          hayLineas={lineas.length > 0}
          metodoPago={metodoPago}
          onCambiarMetodo={setMetodoPago}
          onCobrar={cobrar}
          onCancelar={() => setConfirmarVaciado(true)}
        />
      </div>
      )}

      <PriceLookupDialog
        open={consultaAbierta}
        onOpenChange={setConsultaAbierta}
        articulos={articulosVendibles}
      />
      <CashWithdrawalDialog
        open={retiroAbierto}
        onOpenChange={setRetiroAbierto}
        onRegistrar={registrarRetiro}
      />
      <ClearSaleDialog
        open={confirmarVaciado}
        onOpenChange={setConfirmarVaciado}
        onConfirmar={vaciarVenta}
      />
      <TicketVentaDialog ticket={ticket} onOpenChange={cerrarTicket} />
    </>
  );
}
