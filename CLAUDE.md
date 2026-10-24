## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Reglas de orden

Aplica estas reglas en todas las tareas:

- No crees archivos ni carpetas que no se necesiten ahora. Nada "por si acaso", vacío o de relleno.
- Si un componente o una lógica se repite, conviértelo en un componente o función reutilizable en vez de duplicarlo.
- Un archivo separado solo se justifica si cumple al menos una de estas condiciones:
  1. se reutiliza en más de un lugar;
  2. tiene una responsabilidad claramente distinta (p. ej. la función de cálculo separada de la interfaz);
  3. es tan largo que juntarlo con el archivo que lo usa lo haría difícil de leer.

  Si no cumple ninguna, va dentro del archivo que lo usa.
- Borra los archivos, carpetas, imports y código que no se usen (incluidos los `export` que nadie importa).
- Nombres claros y consistentes: archivos en kebab-case; el código (archivos, componentes, funciones, variables) en inglés; los textos visibles y las URLs en español. Excepción: las siglas contables MPD, MOD y CIF.

## Convenciones del proyecto

- `src/config/routes.ts` es la única fuente de rutas (path + nombre de la pestaña). El menú, los accesos rápidos y cualquier enlace leen de ahí; no escribas URLs a mano.
- Las pestañas aún no construidas las genera `src/pages/[...slug].astro` con la página "En construcción". Para construir una pestaña real, crea su archivo en `src/pages/` (p. ej. `productos.astro`): reemplaza automáticamente a la ruta dinámica.
- Solo front por ahora: los datos salen de `src/data/mock.ts` (y el listado de productos de `src/data/diway-products.ts`). Ningún número se escribe a mano en los componentes; todo se calcula y los montos se muestran con `formatSoles` (`src/utils/format.ts`).
- El costo de un lote se calcula solo en `src/utils/cost-calculation.ts` (función pura, sin lógica de cálculo en los componentes). Replica los Excel de la empresa (`docs/excel/`, fuera de git): no inventes reglas de cálculo. Toda suposición o corrección del Excel lleva el comentario `PENDIENTE CONFIRMAR CON LA EMPRESA` y su pregunta en `docs/pendientes-empresa.md`.

## Alcance actual

Por ahora el sistema solo calcula costos de fabricación **estimados**. No construyas nada de "Para después" hasta que se pida.

**Dentro**

- Pestañas: Inicio, Órdenes de fabricación (con Nueva orden), Productos (con Registrar producto), Materias primas, Mano de obra y Costos indirectos. Construidas: Inicio y Nueva orden de fabricación.
- Las órdenes calculan solo el costo estimado del lote = MPD + MOD + CIF, a partir de la receta del producto (por unidad) y los datos base de su línea. Días del lote = cantidad ÷ rendimiento del producto, redondeado hacia arriba. Estados: Estimada, En proceso y Terminada.
- Nueva orden: solo pide producto y cantidad; las órdenes confirmadas se guardan en memoria (sin back). Solo se pueden elegir productos con receta.
- El precio de cada materia prima se edita directamente en Materias primas.
- Dashboard: costo de producción estimado del mes (suma del costo estimado de todas las órdenes emitidas en el mes, sin importar su estado), órdenes del mes, costo unitario promedio (costo del mes ÷ unidades), gráfico mensual, donut MPD + MOD + CIF, órdenes recientes y accesos rápidos (Nueva orden de fabricación, Registrar producto).

**Para después**

- Compras.
- Reportes.
- Configuración.
- Costo real de las órdenes, desviación real vs. estimado y el estado Cerrada.
- Alertas de alza de precio de materia prima.
- Back: API, base de datos y autenticación.
