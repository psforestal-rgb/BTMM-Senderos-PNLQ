# Prompt maestro — paquete de iconos para módulos D y E

Genera un paquete profesional y coherente de **39 iconos ilustrados** para una PWA móvil de mantenimiento de senderos de un parque nacional de Costa Rica. Los iconos ayudarán a funcionarios de campo a reconocer rápidamente problemas observados y labores ejecutadas.

## Dirección visual obligatoria

- Estilo: pictograma vectorial plano, institucional y amable, con formas simples y lectura inmediata.
- Todos los iconos deben parecer parte de la misma familia: mismo grosor de línea, nivel de detalle, perspectiva frontal o tres cuartos y proporciones visuales.
- Deben ser claramente reconocibles a **48 × 48 px** y conservar buena apariencia hasta 128 × 128 px.
- Fondo completamente transparente.
- Sin palabras, letras, números, marcas de agua, marcos, fotografías, degradados complejos ni logotipos oficiales.
- Evitar detalles diminutos y símbolos ambiguos.
- Paleta principal: azul marino `#021A53`, azul institucional `#002E7A`, verde bosque `#2E6B4F`, verde suave `#8FB38B`, dorado `#CFAC65` y blanco. Usar rojo `#B91C1C` o naranja `#C2410C` únicamente para peligro.
- Trazos redondeados, contraste WCAG razonable sobre fondos blancos y gris muy claro.
- Composición centrada, con margen de seguridad mínimo del 12 %.
- No representar personas identificables ni fauna de forma agresiva.

## Entregables

1. Un archivo **SVG individual** por icono, con `viewBox="0 0 256 256"` y fondo transparente.
2. Una copia **PNG 256 × 256** transparente por icono.
3. Una lámina de contacto con los 39 iconos, identificados solamente fuera del área exportable de cada icono.
4. Un archivo `manifest.json` con `id`, `filename`, `label_es` y una descripción accesible de una oración.
5. Mantener exactamente los nombres de archivo indicados abajo.

## Iconos solicitados

### D. Problemas observados

1. `d01-vegetacion-invasora`: vegetación cerrando lateralmente un sendero.
2. `d02-arbol-caido`: tronco o ramas caídas bloqueando el paso.
3. `d03-raices-piedras`: raíces y piedras expuestas que provocan tropiezo.
4. `d04-huella-erosionada`: huella erosionada o acanalada.
5. `d05-carcavas`: cárcava con pérdida acelerada de suelo.
6. `d06-drenaje-obstruido`: cuneta o drenaje obstruido y agua acumulada.
7. `d07-talud-inestable`: talud inestable o pequeño deslizamiento.
8. `d08-estructura-danada`: puente, pasarela, baranda o escalón dañado.
9. `d09-senalizacion`: señal dañada, ausente o confusa.
10. `d10-basura-vandalismo`: basura, grafiti o vandalismo.
11. `d11-musgo-liquenes`: musgo o líquenes sobre losa o estructura.
12. `d12-atajos`: atajo informal que amplía la huella.
13. `d13-riesgo-biologico`: riesgo por fauna, enjambre u otro factor biológico.
14. `d14-dano-climatico`: daño reciente por lluvia, viento o tormenta.
15. `d15-otro`: problema adicional no clasificado, usando un símbolo neutro de adición.

### E.1 Vegetación y limpieza

16. `e01-roza-lateral`: roza o limpieza lateral de vegetación.
17. `e02-poda-selectiva`: poda selectiva de ramas bajas con herramienta manual.
18. `e03-retiro-caidos`: retiro controlado de árboles o ramas caídas.
19. `e04-retiro-riesgosos`: retiro preventivo de árbol o rama riesgosa.
20. `e05-retiro-obstaculos`: retiro de obstáculos sueltos del sendero.
21. `e06-residuos`: recolección y disposición de residuos.
22. `e07-limpieza-areas`: limpieza de mirador, descanso o espera.
23. `e08-otro-e1`: otra labor de vegetación o limpieza.

### E.2 Huella, drenaje y erosión

24. `e09-limpieza-drenajes`: limpieza de cuneta o salida de agua.
25. `e10-reconformar-huella`: reconformación menor de la huella.
26. `e11-retiro-sedimentos`: retiro de sedimentos o derrumbe menor.
27. `e12-pendiente-transversal`: mejora de pendiente transversal para evacuar agua.
28. `e13-drenaje-superficial`: establecimiento o reparación de drenaje superficial.
29. `e14-material-estabilizante`: colocación puntual de material estabilizante.
30. `e15-cierre-atajo`: cierre y recuperación de un atajo.
31. `e16-otro-e2`: otra labor de huella, drenaje o erosión.

### E.3 Infraestructura, seguridad y señalización

32. `e17-reparar-escalon`: reparación menor de escalón.
33. `e18-reparar-baranda`: reparación menor de baranda.
34. `e19-reparar-puente`: reparación menor de puente o pasarela.
35. `e20-senal-temporal`: ajuste o reposición de señal temporal.
36. `e21-limpieza-rotulo`: limpieza o enderezado de rótulo existente.
37. `e22-aviso-preventivo`: colocación de cinta o aviso preventivo.
38. `e23-cierre-inseguro`: cierre temporal de punto inseguro.
39. `e24-otro-e3`: otra labor de infraestructura o seguridad.

## Control de calidad antes de entregar

- Comprobar que ningún icono se confunda con otro del paquete.
- Mostrar una prueba reducida a 48 × 48 px; si pierde legibilidad, simplificarlo.
- Confirmar fondo transparente real y ausencia de texto incrustado.
- Confirmar que todos los SVG usan el mismo sistema de trazo y que no incluyen imágenes ráster embebidas.
- Entregar los archivos en una carpeta `icons-d-e/`, conservando exactamente los identificadores indicados.

Primero genera una lámina de propuesta con 6 iconos representativos (`d01`, `d06`, `d08`, `e02`, `e13`, `e22`). Espera aprobación del estilo y después produce el paquete completo sin cambiar la dirección visual aprobada.
