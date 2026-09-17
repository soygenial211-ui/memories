# Cómo armar tu Google Sheet (v5)

Crea una Sheet con DOS hojas: "Lugares" y "Recuerdos". Corre `configurarHojas()`
desde el editor de Apps Script (ver instrucciones dentro de `Code.gs`) para que
se creen solas con encabezados y listas desplegables.

## Hoja "Lugares"
id | nombre | orden | tipo | fechaObjetivo | pistaFecha | password | pistaPassword | desbloqueado | textoDesconocido

- `orden`: número que define la posición del lugar en el camino en zigzag
  (1, 2, 3... de arriba hacia abajo). Tú decides el orden manualmente,
  no depende de fechas ni de nada más.

## Hoja "Recuerdos" (con candado propio, igual que los lugares)
id | lugarId | orden | titulo | imagenUrl | texto | animacion | tipo | fechaObjetivo | pistaFecha | password | pistaPassword | desbloqueado | textoDesconocido

- `tipo` en ambas hojas: `ninguno` | `fecha` | `password` | `ambos` | `desconocido`
- Si es `ambos`: primero pide fecha (con `pistaFecha`), y ya pasada, la
  siguiente vez pide contraseña (con `pistaPassword`). El mensaje de fecha
  no vuelve a aparecer una vez cumplida.
- `desconocido` = ese lugar/cuadrito se ve como "?" y no es clickeable
  (para cosas que aún no armas).
- `animacion`: confetti-dorado, corazones-flotantes, estrella-fugaz,
  sobre-abriendose, cortina-teatro, burbujas, mariposas, flor-abriendose,
  chispas-picantes, luz-de-vela.

## Texto de "desconocido"
Usa la columna `textoDesconocido` (al final de cada hoja) para personalizar
el mensaje que aparece en un lugar o recuerdo marcado como `desconocido`.
Si la dejas vacía, se usa "Aún un misterio..." por defecto. En un recuerdo
(cuadrito pequeño dentro de un lugar), ese texto aparece al mantener
presionado o pasar el cursor sobre el cuadrito.

## Iconos (aplican igual a lugares y a recuerdos)
- 🔒 bloqueado
- ✓ desbloqueado
- ? desconocido / aún en construcción
- ✪ palomita especial — SOLO aparece en un LUGAR cuando **todos** sus
  recuerdos (los que no son "desconocido") ya están desbloqueados

## Texto de bienvenida
Edita `bienvenida.js` — es el único archivo que necesitas tocar para cambiar
ese texto. No necesitas saber programar: solo cambia las palabras dentro de
las comillas invertidas (los símbolos \` al inicio y al final).

## Contraseñas
El campo de contraseña usa el teclado nativo del celular (no uno dibujado
en pantalla), con su placeholder "Escribe contraseña". Lo que ella escriba
se limpia solo: se quitan todos los espacios y se pasa automáticamente a
MAYÚSCULAS antes de comparar contra lo que pusiste en la Sheet — así que en
la Sheet también escribe las contraseñas en mayúsculas y sin espacios.

## El camino
Ya no necesitas subir ninguna imagen de mapa — los lugares aparecen como
nodos conectados por un camino en zigzag, en el orden que definas con la
columna `orden` de la hoja "Lugares". Agregar un lugar nuevo es solo
agregar una fila con el número de orden que quieras. Mientras carga (al
tocar "RECORDAR"), se muestra una pantalla de carga con spinner — ya no se
queda la pantalla en negro.

## Progreso
Vive en la columna `desbloqueado` de cada hoja. Nunca se pierde al agregar
lugares o recuerdos nuevos — puedes seguir editando la Sheet cuando quieras.

## Actualizando desde una versión anterior
Si ya tenías tu Sheet armada, solo vuelve a correr `configurarHojas()` —
agrega la columna `textoDesconocido` al final sin mover ni desordenar tus
datos existentes.
