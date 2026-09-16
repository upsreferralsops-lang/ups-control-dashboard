# Consola de referidos UPS — brief de diseño

Documento para alimentar a Google Stitch. Describe qué hace el sistema, quién lo
usa y qué contiene cada pantalla.

---

## Qué es

Una **consola de operaciones** para empresas que reclutan personal para UPS a través
del programa de referidos de empleados.

Un asistente automático (bot) conversa con los candidatos por WhatsApp y Telegram:
les pregunta dónde viven, busca vacantes reales en el sitio de empleos de UPS, les
muestra las que les sirven y completa el referido. Esta consola es donde el equipo
humano **mira lo que el bot está haciendo** y actúa cuando hace falta.

**No es una landing page ni una app de marketing.** Es una herramienta de trabajo que
alguien tiene abierta todo el día, con tablas densas de datos y estados que hay que
poder escanear de un vistazo. Se usa mayormente en escritorio.

El idioma es español latinoamericano.

---

## Quién la usa

**Administrador** — la agencia que desarrolla y opera el sistema. Ve todos los bots
y todos los candidatos. Puede crear usuarios, asignarles bots, y dar de alta o de
baja bots.

**Cliente** — cada empresa de reclutamiento. Ve únicamente los candidatos de los bots
que tiene asignados. No puede administrar usuarios ni bots.

Un mismo sistema atiende a varios clientes a la vez, cada uno con su propio bot y su
propio número de WhatsApp o Telegram. Nunca puede ver los candidatos de otro.

---

## Conceptos que aparecen en toda la interfaz

**Candidato** — una persona que escribió al bot buscando trabajo.

**Bot** — el asistente de un cliente, atado a un número de WhatsApp o a una cuenta de
Telegram. Cada cliente tiene el suyo.

**Referido** — el trámite que se completa en el sistema interno de UPS para que el
candidato quede postulado. Es el objetivo final de toda conversación.

**Los cinco estados de un candidato**, del más urgente al menos:

| Estado | Qué significa | Peso visual |
|---|---|---|
| **Búsqueda falló** | El sistema no pudo consultar las vacantes de UPS. No sabemos si hay cupos. Requiere que alguien lo revise. | Crítico |
| **Falló** | El referido no se pudo completar: candidato duplicado o error en el formulario. | Error |
| **En espera** | Quiso aplicar pero no había vacantes del programa en su estado. Queda en lista de espera. | Advertencia |
| **Sin referir** | Todavía no llegó al punto de referirse. Está conversando. | Neutro |
| **Referido** | El referido se envió y quedó confirmado en UPS. Caso cerrado. | Éxito |

**Dato sensible** — a veces un candidato manda por chat su número de seguro social o
similar. El sistema lo descarta antes de guardarlo, pero deja una marca en su ficha
para que el equipo sepa que ocurrió. Es una marca de advertencia, no de error.

---

## Pantallas

### 1. Inicio de sesión

Formulario simple: correo y contraseña. Un texto aclara que con tu cuenta ves solo
los bots que tenés asignados.

Puede aparecer un aviso de que la sesión venció y hay que volver a entrar.

Es la única pantalla que ve alguien sin sesión, así que admite algo más de identidad
visual que el resto: el nombre del producto y una idea de qué hace.

---

### 2. Candidatos (pantalla principal)

Es donde el equipo pasa el día. De arriba hacia abajo:

**Resumen de la operación.** El total de candidatos destacado, y al lado el reparto
por estado: cuántos referidos, cuántos en espera, cuántos fallidos, cuántos
abandonados y cuántos están en proceso de aplicación. Cada cifra debería dejar ver su
peso relativo sobre el total. Si hay candidatos que mandaron datos sensibles, se
indica aparte.

Tres de esos números (referidos, en espera, fallidos) llevan al listado ya filtrado.

**Búsqueda.** Un campo que busca por nombre, correo, teléfono, posición, estado o
usuario asignado. Busca mientras se escribe. Si el usuario tiene más de un bot, hay
además un selector para acotar a uno.

**Filtros por estado.** Una fila de opciones: Todos · Referidos · En espera ·
Fallidos · Búsqueda falló · Sin referir. Al costado, cuántos resultados hay.

**Tabla de candidatos.** Densa, muchas filas visibles a la vez, ordenable por
columna. Columnas:

- **Candidato** — nombre y apellido. Es el enlace al detalle. Puede llevar una marca
  de "dato sensible".
- **Contacto** — correo arriba, teléfono debajo.
- **Zona** — ciudad y código postal.
- **Posición elegida** — el puesto de UPS que le tocó. Puede ser texto largo.
- **Bot / usuario** — a qué bot llegó y qué personas del equipo lo tienen asignado.
  Solo aparece cuando hay más de un bot en juego.
- **Estado** — uno de los cinco. Tiene que distinguirse de un vistazo, sin depender
  solo del color.
- **Últ. mensaje** — hace cuánto escribió por última vez ("recién", "40 min", "3
  días"). Alineado a la derecha.

Los números de columnas distintas tienen que alinearse entre filas.

Cuando no hay resultados, se explica qué probar en vez de dejar la tabla vacía.

---

### 3. Detalle de un candidato

Se llega desde la tabla. Tiene dos zonas lado a lado.

**Encabezado:** volver al listado, el nombre de la persona, su estado con una frase
que lo explica en lenguaje llano, y por qué canal llegó (WhatsApp o Telegram). Si
mandó datos sensibles, un aviso explica que el sistema los descartó.

**Columna izquierda — la ficha.** Los datos que el bot fue recolectando: correo,
teléfono, ciudad, código postal, estado de EE.UU., posición elegida, y dos estados
internos del proceso. Muchos campos pueden estar vacíos, sobre todo al principio de
la conversación.

Debajo, **la acción principal**: marcar el referido como confirmado. Pide confirmación
antes de ejecutarse, con una advertencia de que solo hay que hacerlo si ya se verificó
en el sistema de UPS. Una vez confirmado, muestra que está hecho y ya no se puede
deshacer.

**Columna derecha — la conversación.** El historial completo entre el candidato y el
bot, en orden. Cada mensaje indica quién lo dijo y hace cuánto. Puede ser muy largo,
así que necesita su propio scroll. Arriba, cuántos mensajes hay y cuándo fue el
último.

---

### 4. Administración (solo administradores)

Tres bloques.

**Bots activos.** Una tarjeta por bot con: nombre del cliente, canal (WhatsApp o
Telegram), identificador del bot, cuántos candidatos atendió y qué parte de la
operación total representa. Un bot puede estar **de baja**, y en ese caso se ve
claramente apagado con la leyenda de que no recibe mensajes.

Cada tarjeta permite **dar de baja** el bot (deja de recibir mensajes pero conserva
todo su historial) o **reactivarlo**. Solo si el bot nunca recibió ningún candidato
aparece además la opción de **eliminarlo**, que pide confirmación. Si ya tiene
candidatos, en lugar del botón se explica por qué no se puede borrar.

**Nuevo usuario.** Formulario con correo, nombre, contraseña y rol (Cliente o
Administrador). Si el rol es Cliente, aparecen casillas para elegir qué bots va a
ver — es obligatorio elegir al menos uno, porque un cliente sin bots no ve nada. Si
es Administrador, esas casillas desaparecen porque ve todo por rol.

**Usuarios.** Tabla con: nombre y correo, rol, los bots que tiene asignados (con
casillas que se pueden cambiar ahí mismo y guardar) y cuándo entró por última vez.

---

## Qué tiene que lograr el diseño

**Que lo urgente salte a la vista.** Un candidato con "Búsqueda falló" es trabajo
para el equipo hoy; uno "Referido" ya está cerrado. La diferencia tiene que notarse
sin leer.

**Densidad sin ruido.** El equipo quiere ver muchos candidatos por pantalla. Filas
compactas, pero que se puedan seguir con la vista sin perderse de renglón.

**Números comparables.** Hay cifras en columnas y en el resumen; tienen que poder
compararse de un vistazo.

**Distinguir lo que se puede tocar.** La consola tiene acciones con consecuencias
reales (confirmar un referido, dar de baja un bot). Tienen que verse distintas de lo
que es solo información.

**Dos temas, claro y oscuro.** Se usa muchas horas seguidas.

**Nunca depender solo del color.** Los estados tienen que leerse también sin
distinguir tonos.

---

## Qué evitar

- Una estética de landing page o de producto de marketing: no se vende nada acá.
- Tarjetas grandes con mucho aire alrededor de cada dato. Es una herramienta densa.
- Cifras enormes decorativas que no sean el dato principal de la pantalla.
- Animaciones que retrasen la lectura.
- Íconos como único indicador de un estado.
