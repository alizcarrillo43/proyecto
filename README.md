# Punto de Venta para Zapatería

Plataforma web de punto de venta diseñada para que una zapatería registre sus ventas, controle su inventario por tallas y maneje su caja por turnos. El sistema distingue entre el dueño (superusuario) y las empleadas, y cada una solo accede a las funciones que le corresponden. Adaptabilidad: se considera el diseño responsivo para computadoras, tabletas y celulares, ajustando la distribución de los elementos, tamaños de texto, botones y tablas.

**Estado del proyecto:** versión desarrollada para **un solo negocio**. Todos los datos pertenecen a una única tienda.

## OBJETIVO

El objetivo es que el control de ventas, inventario y caja de una zapatería sea más ordenado, rápido y confiable, evitando el uso de libretas y los errores en el corte de caja.

## CARACTERÍSTICAS PRINCIPALES

1. Inicio de sesión y registro con selector de lada de país.
2. Botón para ver u ocultar la contraseña.
3. Dos roles de usuario: superusuario (dueño o gerente) y empleada.
4. Ventas con carrito y selección de artículo y talla.
5. Métodos de pago: efectivo, tarjeta y transferencia.
6. Ticket en pantalla listo para imprimir.
7. Inventario con existencias por talla dentro de un mismo artículo.
8. Turnos de caja con fondo inicial.
9. Corte diario y cierre de turno con conteo de efectivo y diferencia.
10. Historial de turnos, cierre forzado y ajustes con motivo para el dueño.
11. Diseño adaptable a computadoras y dispositivos móviles.

## MÓDULOS DEL SISTEMA

1. Acceso y usuarios: registro, inicio de sesión y alta de empleadas por el superusuario.
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

**Empleada**
1. Realiza ventas y consulta el ticket (solo con un turno abierto).
2. Consulta el inventario sin poder modificarlo.
3. Consulta el corte del día y el acumulado de su turno.
4. Cierra su turno capturando el efectivo contado.

Los permisos se validan en la base de datos, no solo en la interfaz: las funciones del servidor comprueban el rol de quien las llama.

## HERRAMIENTAS Y TECNOLOGÍAS

1. Bolt.new: plataforma utilizada para crear y desarrollar la aplicación mediante instrucciones en lenguaje natural.
2. Inteligencia artificial: apoyo para generar código, mejorar funcionalidades y resolver errores.
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

Tipografías: [indica aquí las tipografías que usa tu proyecto]

## ACCESO AL PROYECTO

El punto de venta fue desarrollado con Bolt.new, una plataforma que permite crear aplicaciones web con apoyo de inteligencia artificial, y su código está en GitHub.

REPOSITORIO: https://github.com/alizcarrillo43/proyecto

LINK DE PUBLICACIÓN DEL PROYECTO: [pega aquí el enlace de tu sitio en Netlify]

## PROMPT UTILIZADOS

**PROMPT 1 (roles y permisos):** Actúa como desarrollador full-stack senior. Tengo un punto de venta web para una zapatería con inicio de sesión, ventas, inventario y corte de caja. Necesito agregar control de acceso por roles y rehacer el inventario por tallas, sin romper lo que ya funciona. Roles: "superusuario" (dueño o gerente) y "empleado". Solo puede existir un superusuario, que es el único que da de alta empleados. El empleado puede vender y ver el ticket, ver el inventario sin modificarlo y hacer el corte de caja solo de hoy y de la semana actual, únicamente de sus propias ventas. Los permisos deben validarse en el backend en cada endpoint y responder 403 si la acción no corresponde. Inventario: cada artículo tiene un solo código y sus existencias se guardan por talla en una tabla relacionada; la vista muestra el total de pares y el desglose por talla; al vender se elige artículo y talla y se descuenta solo de esa talla; las tallas agotadas se marcan visualmente. Contraseñas con hash, consultas parametrizadas, código comentado y diseño responsivo.

**PROMPT 2 (tabla de artículos):** Modifica únicamente la tabla de artículos del inventario. Columnas en este orden: Código, Descripción, Precio y Existencias por talla. La columna de existencias va dividida en dos filas dentro de la misma celda: la fila superior, con la etiqueta "#", muestra los números de talla, y la fila inferior, con la etiqueta "Existencia", muestra los pares disponibles de cada talla. Cada artículo aparece una sola vez con un solo código. Si la cantidad de una talla es 0, mostrarla en rojo. La tabla debe ser responsiva, con desplazamiento horizontal en pantallas pequeñas, y mantener la paleta morada.

**PROMPT 3 (turnos de caja):** Agrega un módulo de turno de caja con fondo inicial, corte diario y cierre de turno. El dueño abre un turno para una empleada y captura el fondo inicial; la empleada no puede vender sin un turno abierto. El dinero de las ventas se queda en caja durante el turno y cada día se genera un corte con las ventas del día. El turno no tiene duración fija: puede cerrarse en uno o más días. Al cerrar, la empleada captura el efectivo contado y el sistema calcula el efectivo a entregar (fondo inicial más ventas en efectivo) y la diferencia, con un comprobante imprimible. El dueño ve el historial de todos los turnos, puede hacer un cierre forzado y ajustes a días cerrados, siempre con motivo obligatorio, y recibe una alerta si un turno lleva más de 7 días abierto. Los montos se calculan en el servidor y los permisos se validan en el backend.

## HOJA DE RUTA

1. Función para duplicar un artículo en otro color.
2. Convertir el sistema en un servicio multi-negocio: cada persona que se registre crea su propio negocio como superusuario, con sus datos aislados.
3. Plan gratuito (hasta 15 artículos y 1 empleada) y plan de paga con límites ampliados.
4. Pagos en línea para la mejora de plan.
5. Página pública de presentación del producto.

## DESARROLLO

Para trabajar de forma local necesitas Node.js y npm.

```bash
git clone https://github.com/alizcarrillo43/proyecto.git
cd proyecto
npm i
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

Crea un archivo `.env.local` en la raíz con las credenciales de tu proyecto de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

El esquema de la base de datos (tablas, funciones y políticas de seguridad) está en la carpeta `supabase/migrations`.

No subas tus archivos `.env` al repositorio ni compartas la clave `service_role` de Supabase.

## AUTOR

[Tu nombre] · https://github.com/alizcarrillo43
