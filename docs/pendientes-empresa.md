# Preguntas pendientes sobre el cálculo de costos

Estamos pasando a un sistema los Excel **Costos de Fabricación - Plástico** y **Costos de Fabricación - Metal**. Al revisarlos encontramos algunos puntos que necesitamos confirmar con ustedes.

Mientras no tengamos respuesta, el sistema usa la suposición indicada en cada punto. Las preguntas están ordenadas por importancia dentro de cada tema.

## Productos y recetas

**1. ¿Qué producto es el lote del Excel de Plástico?**
El Excel calcula un lote de 2,329 piezas de polipropileno de 203 g, pero no dice qué producto es, y el listado de productos no tiene pesos.
Por ahora el sistema lo muestra como "Pieza de polipropileno de 203 g (producto por identificar)".
Necesitamos el SKU del producto.

**2. ¿El lote del Excel de Metal es el tapabarro metal posterior clásico?**
El lote es de 1,000 unidades: 500 azules, 300 negras y 200 rojas.
Suponemos que corresponde a los productos 206003163 (azul), 206003167 (negro) y 206003169 (rojo).

**3. Polipropileno por pieza: ¿son 203 g de pieza más 25 g de merma?**
El Excel usa 0.228 kg de polipropileno, pero lo cuenta una sola vez, no por cada pieza del lote.
Suponemos que cada pieza lleva 228 g: 203 g de la pieza más 25 g de colada (12.3% de merma), multiplicados por la cantidad de piezas.
Esto cambia mucho el costo: el lote de 2,329 piezas pasa de S/ 2,951.34 a S/ 6,641.71.

**4. ¿Cuál es la dosificación real de colorante y titanio?**
El Excel tiene 1.48 kg de colorante y 0.11 kg de titanio para el lote, escritos a mano.
Suponemos que se dosifican en proporción a la resina: 2.79 g de colorante y 0.21 g de titanio por kg de resina. Eso equivale a unos 69.7 g y 5.2 g por saco de 25 kg.
Necesitamos los gramos reales por saco o por kg de resina.

**5. ¿El colorante y el titanio cuestan lo mismo?**
Ambos figuran a S/ 114.40 por kg.

**6. ¿Las pinturas de Metal están bien repartidas por color?**
El Excel usa 17 galones de pintura azul para 500 unidades, 10 de negra para 300 y 7 de roja para 200. Eso da 0.034, 0.033 y 0.035 galones por unidad.
La base, el thinner, el aluminio, el gas y la soldadura se reparten por igual entre todos los colores.

**7. ¿Cuántas unidades se producen por día?**
Del Excel sale que en Plástico se hacen 2,329 piezas en 7 días (unas 333 por día) y en Metal 1,000 tapabarros en 6 días (unas 167 por día).
El sistema calcula los días de cada lote con ese ritmo.
¿Es el ritmo real? ¿Cambia según el producto?

**8. ¿Los operarios y máquinas de cada Excel participan en todos los productos de esa línea?**
El sistema aplica a todos los productos de una línea los mismos operarios y máquinas que figuran en su Excel.

## Mano de obra

**9. ¿Por qué el costo por hora se calcula distinto para jornaleros y para sueldos mensuales?**
Para los jornaleros, el pago semanal se divide entre 6 días. Para los sueldos mensuales, se divide entre 4 semanas y luego entre 7 días.
¿Cuál corresponde en cada caso?

**10. ¿Cómo se leen las horas de Godofredo y Jefferson en Plástico?**
Godofredo aparece en 4 filas (8, 9, 8 y 6 horas) y Jefferson en 3 (8, 8 y 0.67 horas).
Suponemos que son las horas totales del lote de 7 días (31 h y 16.67 h) y las repartimos por igual entre los días.

**11. ¿Las horas de almacén, supervisión y empernado dependen de cuánto dura el lote?**
El Excel tiene horas fijas por lote:
- Eneida (sellado y etiquetado): 2.5 h.
- Shirley (supervisión): 12 h.
- Los dos operarios de empernado de Metal: 1 día (8 h).

Suponemos que esas horas aumentan cuando el lote dura más días.
¿Dependen de los días, de la cantidad o son fijas por lote? ¿Quiénes son los dos operarios de empernado? En el Excel no tienen nombre.

**12. ¿La pintura de Metal se paga a destajo, S/ 1.50 por unidad?**
El sistema lo calcula así. La fórmula del Excel solo da ese resultado cuando el lote dura exactamente 6 días.

## Costos indirectos

**13. ¿Qué materiales indirectos se usan en cada lote?**
La hoja MPI no calcula un total, y el Estado Integral de Costos usa S/ 1,500 escritos a mano.
Suponemos que el costo es el uso por lote × el precio unitario: 5 trapos × S/ 10 = S/ 50 por lote. Las dos filas sin nombre no se tomaron en cuenta.
Necesitamos la lista de materiales indirectos por lote, con su cantidad y precio.

**14. ¿Cuánto cuestan los servicios básicos por lote?**
La hoja SSBB da S/ 0 por dos motivos: suma las columnas "Metales" y "Láser", que están vacías, en lugar del consumo mensual (S/ 110 de energía y S/ 111 de agua), y su resultado no entra al Estado Integral de Costos.
Por ahora el sistema usa S/ 0 por lote.

**15. ¿Se trabajan 6 días por semana?**
Los gastos fijos del Excel (alquiler, mantenimiento, internet, etc.) son montos semanales, calculados como monto mensual ÷ 4.
El sistema los reparte según los días que dura cada lote: monto semanal ÷ 6 días × días del lote.

**16. ¿Cuáles son los montos correctos del alquiler y de los servicios generales?**
Las celdas y los comentarios del Excel no coinciden:

| Concepto | Valor en la celda | Valor según el comentario |
| :-- | --: | --: |
| Alquiler | S/ 100 | 5,000 ÷ 4 × 50% = S/ 625 |
| Servicios generales de fábrica | S/ 200 (Plástico) y S/ 370 (Metal) | 914 ÷ 4 = S/ 228.50 |

Por ahora el sistema usa los valores de las celdas.

**17. ¿Está bien calculada la depreciación de las máquinas?**
La depreciación de cada lote se calcula como horas por día × días del lote. Se usan meses de 30 días y jornadas de 8 horas, vida útil de 5 años y valor residual de cero.
La inyectora M5 trabaja 7.4 horas por día y las máquinas de Metal, 8 horas.
