# Punto de Venta para Zapatería

Plataforma web de punto de venta diseñada para que una zapatería registre sus ventas, controle su inventario por tallas y maneje su caja por turnos. El sistema distingue entre el dueño (superusuario) y los empleados, y cada uno solo accede a las funciones que le corresponden. Adaptabilidad: se considera el diseño responsivo para computadoras, tabletas y celulares, ajustando la distribución de los elementos, tamaños de texto, botones y tablas.

**Estado del proyecto:** versión para un solo negocio. Todos los datos pertenecen a una única tienda. La conversión a servicio para varios negocios, con plan gratuito y de paga, está planeada en el roadmap.

## OBJETIVO

El objetivo es que el control de ventas, inventario y caja de una zapatería sea más ordenado, rápido y confiable, evitando el uso de libretas y los errores en el corte de caja.

## CARACTERÍSTICAS PRINCIPALES

1. Inicio de sesión y registro con selector de lada de país.
2. Botón para ver u ocultar la contraseña.
3. Dos roles de usuario: superusuario (dueño o gerente) y empleados.
4. Ventas con carrito y selección de artículo y talla.
5. Métodos de pago: efectivo, tarjeta y transferencia.
6. Ticket en pantalla listo para imprimir.
7. Inventario con existencias por talla dentro de un mismo artículo.
8. Turnos de caja con fondo inicial.
9. Corte diario y cierre de turno con conteo de efectivo y diferencia.
10. Historial de turnos, cierre forzado y ajustes con motivo para el dueño.
11. Diseño adaptable a computadoras y dispositivos móviles.

## MÓDULOS DEL SISTEMA

1. Acceso y usuarios: registro, inicio de sesión y alta de empleados por el superusuario.
2. Ventas: carrito, cobro, método de pago, descuento automático de existencias y ticket.
3. Inventario: tabla con código, descripción, precio y existencias por talla (fila "#" con la talla y fila "Existencia" con los pares disponibles).
4. Turnos de caja: apertura con fondo inicial, corte del día, cierre del turno y comprobante imprimible.

## ROLES Y PERMISOS

**Superusuario (dueño o gerente)**
1. Da de alta y administra a las empleadas.
2. Agrega, edita y elimina artículos del inventario.
3. Abre turnos de caja con fondo inicial.
4. Consulta el historial de todos los turnos con filtros por empleada y fecha.
5. Realiza cierres forzados y ajustes a un corte, siempre con motivo obligatorio.

**Empleados**
1. Realizan ventas y consulta el ticket (solo con un turno abierto).
2. Consulta el inventario sin poder modificarlo.
3. Consulta el corte del día y el acumulado de su turno.
4. Cierra su turno capturando el efectivo contado.

Los permisos se validan en la base de datos, no solo en la interfaz: las funciones del servidor comprueban el rol de quien las llama.

## HERRAMIENTAS Y TECNOLOGÍAS

1. Bolt.new: plataforma utilizada para crear y desarrollar la aplicación mediante instrucciones en lenguaje natural.
2. Inteligencia artificial (Claude): apoyo para generar código, mejorar funcionalidades y resolver errores.
3. GitHub: almacenamiento y administración del código fuente.

## TECNOLOGÍAS

1. Next.js (App Router)
2. React
3. TypeScript
4. Tailwind CSS
5. shadcn/ui y lucide-react
6. Supabase (PostgreSQL, funciones RPC y políticas RLS)
7. Netlify (despliegue)

## DISEÑO

La aplicación utiliza una interfaz limpia y profesional con una paleta morada, tarjetas con bordes redondeados y tablas claras para el trabajo diario en caja.

Colores principales:
1. Morado ciruela: #634780
2. Morado uva: #937CAA
3. Lavanda: #DDBBFE
4. Lavanda suave: #C9BED5
5. Morado noche: #3B2155
6. Azul noche: #1F0C33


## ACCESO AL PROYECTO

El punto de venta fue desarrollado con Bolt.new, una plataforma que permite crear aplicaciones web con apoyo de inteligencia artificial, y su código está en GitHub.

REPOSITORIO: https://github.com/alizcarrillo43/proyecto

LINK DE PUBLICACIÓN DEL PROYECTO: https://shoe-store-pos-web-alcp.bolt.host

## PROMPT UTILIZADOS

**PROMPT 1 (roles y permisos):** # Eres un desarrollador full-stack y diseñador UX/UI especializado en puntos de venta para pequeños comercios.
Crea un punto de venta web para una zapatería con tres pantallas:
1. Inicio de sesión: logo, nombre del negocio, usuario, contraseña, "Olvidé la contraseña", "Registrarse" y "Continuar".
2. Registro: nombre, teléfono, usuario, contraseña, y botones "Registrar" y "Cancelar".
3. Ventas: barra lateral (Inicio, Ventas, Artículos), acciones superiores (Agregar artículo, Consultar precio, Nueva venta, Retirar efectivo), nombre y avatar del vendedor, captura por código de barras o artículo, tabla (Descripción, Número, Precio unitario, Cantidad, Importe), número de artículos, total en grande, y botones "Cobrar" y "Cancelar".El total se recalcula en tiempo real, "Cobrar" guarda la venta y descuenta existencias, y "Cancelar" vacía la venta con confirmación. Incluye también una lista básica de historial de ventas y de artículos.
- Usuarios: vendedores con prisa, así que usa botones grandes y pocos clics.
- Español de México, moneda MXN, con ortografía correcta.
- Sigue los wireframes y la paleta que adjunto: #1F0C33, #3B2155, #634780, #937CAA, #C9BED5, #DDBBFE.
- Estilo: campos y botones en forma de píldora, esquinas redondeadas y el total como elemento más grande.
- Backend: Supabase con autenticación, roles (vendedor y administrador) y RLS. Tablas: usuarios, articulos, ventas, detalle_venta y movimientos_caja.
- Diseño responsivo, con foco visible.
- Entrega por fases: primero la interfaz con datos de ejemplo, luego Supabase y por último historial e inventario.
**PROMPT 2 (tabla de artículos):** Modifica únicamente la tabla de artículos del inventario. Columnas en este orden: Código, Descripción, Precio y Existencias por talla. La columna de existencias va dividida en dos filas dentro de la misma celda: la fila superior, con la etiqueta "#", muestra los números de talla, y la fila inferior, con la etiqueta "Existencia", muestra los pares disponibles de cada talla. Cada artículo aparece una sola vez con un solo código. Si la cantidad de una talla es 0, mostrarla en rojo. La tabla debe ser responsiva, con desplazamiento horizontal en pantallas pequeñas, y mantener la paleta morada.


## ROADMAP

1. Función para duplicar un artículo en otro color.
2. Convertir el sistema en un servicio multi-negocio: cada persona que se registre crea su propio negocio como superusuario, con sus datos aislados.
3. Plan gratuito (hasta 15 artículos y 1 empleado) y plan de paga con límites ampliados.
4. Pagos en línea para la mejora de plan.
5. Página pública de presentación del producto.


## LICENCIA
Proyecto de uso personal y educativo.
