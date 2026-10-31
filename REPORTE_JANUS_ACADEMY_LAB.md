# JANUS Academy Lab — reporte completo del proyecto

**Distribución limpia · modelo experimental alternativo · informe de auditoría**

## Resumen ejecutivo

Se desarrolló un laboratorio que muestra mediciones reales obtenidas al reevaluar checkpoints de un Nano-Transformer alternativo, con 4 capas y 4 cabezas por capa. La interfaz explora una cabeza, las cuatro de una capa o las 16 juntas; permite elegir entrada, checkpoint y tres componentes de una salida `z` de 16 valores. Los datos se conservan completos para las funciones implementadas y se pueden regenerar los recursos web a partir del NPZ compacto.

El núcleo de visualización y el verificador de valores numéricos funcionaron en las pruebas efectuadas después de limpiar. La integración con tres roles LLM es real, pero **la calidad docente no quedó demostrada**: el modelo local pequeño probado respondió con explicaciones incorrectas y casi idénticas. El sistema detecta la similitud de esas respuestas y muestra una advertencia, pero **no verifica semánticamente todo el texto generado**. El paquete no está publicado en GitHub; incluye un workflow para una publicación estática futura.

Los archivos históricos originales se conservaron fuera de esta copia. Los checkpoints y las partes de investigación que la aplicación no utiliza no se incluyen; para reconstruir las mediciones originales desde pesos se necesita el ZIP anterior identificado en `research/ORIGEN.md`.

## A. Historia del desarrollo

### 1. Investigación inicial: una cabeza

No se encontraron pesos identificables del JANUS original en el espacio provisto ni en una búsqueda pública limitada. No se concluyó que tales pesos no existan en otro sitio. Se implementó una alternativa identificada como `nano-copy-v1`, con 4 bloques Transformer causales, 4 cabezas por bloque, `d_model=64`, `head_dim=16`, MLP 64→128→64 y **136.592 parámetros entrenables**. No se ajustó la arquitectura para alcanzar la cifra aproximada no confirmada de JANUS.

Se entrenó una corrida CPU sobre la tarea `[a,b,c,d,a,b,c,d] → a`, con semilla de inicialización 1729, semilla de entrenamiento 31415, lotes 32, AdamW y 300 actualizaciones. Se midió `z=A V` de capa 0/cabeza 0, antes de la proyección de salida, en posición 7 para 512 secuencias, separando checkpoint inicial y final. En el conjunto evaluado, la pérdida pasó de 2,9714 a 0,002109 y la exactitud de 6,64% a 100%; 77 de las 512 entradas habían aparecido en el entrenamiento. No es evidencia sobre texto natural.

Se distinguieron rango observado, cuantiles, dispersión, incertidumbre, región multidimensional y grosor visual. En el checkpoint final los tres primeros componentes PCA explicaron aproximadamente 58,8% de la varianza; una banda cuantílica aporta información frente a una mediana sola, pero no frente a los mismos dos cuantiles comunicados numéricamente. Ninguna estadística demostró un cristal físico.

### 2. Microscopio de una cabeza y 13 checkpoints

La primera investigación conservaba sólo pesos iniciales y finales, no estados intermedios. Se hizo una repetición controlada con las mismas semillas y se guardaron pesos después de 0,25,…,300 actualizaciones; la coincidencia de pesos iniciales y finales con la corrida previa fue exacta en ese entorno. Para las primeras 128 entradas de referencia se guardaron **13 × 128 = 1.664 vectores de 16 componentes**, todos de capa 0/cabeza 0 y posición 7. Los 17 casos que habían aparecido durante el entrenamiento se informaron, no se eliminaron.

El microscopio anterior ofreció una trayectoria del vector proyectado y gráficos construidos por componente, con tubos finos o radio visual proporcional al IQR entre entradas. Los puntos eran estados medidos; los segmentos y mallas eran convenciones visuales. Ningún cruce de pantalla demostró una intersección 16D. Se incorporó un selector de las 128 entradas y reproducción por checkpoint.

### 3. Cuatro cabezas en la capa 0

Se comprobó que los 1.664 vectores previos eran sólo H0 de la capa 0. Se reejecutaron los 13 checkpoints sin reentrenar y se reconstruyeron H0–H3 con las mismas entradas y consulta. Se calculó `z`, atención por posición, contribución residual por cabeza y métricas pareadas. La reconstrucción de H0 coincidió con las medidas anteriores en el entorno usado.

En el checkpoint final, H0 y H3 tuvieron mapas de atención muy similares según Jensen–Shannon media ≈0,000020 nats. H2 atendió principalmente a la posición 4; H0 y H3 a la posición 0. Como la tarea coloca el mismo símbolo en 0 y 4, esta diferencia no prueba especialización. Ablaciones individuales cambiaron la pérdida, pero conservaron 128/128 aciertos en el conjunto.

### 4. Cuatro capas y 16 cabezas

Se verificó que los 13 checkpoints contienen los parámetros de las 4 capas, con matrices QKV `(192,64)` y 4 divisiones de 16. Se extrajeron por reevaluación **13 × 128 × 4 × 4 = 26.624 vectores**; la capa 0 coincidió con la extracción previa para `z`, atención, contribuciones, pérdidas y logits, con diferencia máxima 0,0 en ese entorno. Se calcularon mapas de atención, CKA, dispersión y 208 ablaciones individuales —16 cabezas por 13 checkpoints—. No se reentrenó para esta extensión.

### 5. Laboratorio educativo y agentes

Se construyó una interfaz propia con tres vistas sincronizadas, historial temporal, inspección de 16 componentes, atención por clave y comparaciones numéricas. Se reutilizaron los datos y métodos ya obtenidos, sin modificar las fuentes. Un backend local opcional coordina tres roles LLM: guía, investigador y experimentalista. En modo equipo se ejecutan secuencialmente y los roles posteriores reciben las propuestas previas como **no verificadas**. El estudiante conserva el control de selección y pregunta.

La prueba real con `HuggingFaceTB/SmolLM2-135M-Instruct` produjo respuestas repetitivas y científicamente erróneas; se añadió una advertencia cuando las respuestas son casi idénticas. Este comportamiento contradice el objetivo de funciones docentes complementarias con ese modelo y queda **abierto**, no se oculta como éxito pedagógico. Es un mismo modelo con roles distintos, no tres modelos independientes.

### 6. Verificador y pruebas

Se implementaron verificadores deterministas en navegador y backend para componente concreta, atención a una clave o cambio medio de pérdida por ablación. Comparan un valor propuesto con los datos bajo tolerancia absoluta `10⁻⁶` y devuelven procedencia; rechazan valores incompatibles y tipos no admitidos. El verificador **no comprueba frases abiertas ni todo el texto generado**; las respuestas LLM se rotulan no verificadas.

La investigación inicial registró 15 pruebas de software aprobadas. En la comparación de cuatro cabezas hubo una falla inicial al exigir suma de atención con tolerancia `2×10⁻⁷`: el máximo error float32 fue `2,954×10⁻⁷`; se mantuvieron los datos, se cambió la tolerancia a `5×10⁻⁷` y pasaron 9 pruebas. La extracción de 16 cabezas aprobó 9 pruebas, incluida la recomputación de todas las ablaciones. En el primer test de navegador del laboratorio falló una aserción de mayúsculas (`paso` frente a `Paso`); se corrigió la aserción y se repitió con éxito. Las pruebas no equivalen a validación científica o pedagógica.

## B. Fundamentos científicos y datos conservados

### Qué representa una observación

Para checkpoint `t`, entrada `s`, capa `l`, cabeza `h` y consulta 7, se registra `z(t,s,l,h)∈R^16`, resultado de la atención de esa cabeza antes de `W_O`. Las 16 coordenadas son componentes de **un mismo vector**. El archivo compacto tiene forma `[13,128,4,4,16]` y contiene 26.624 vectores. Las 16 cabezas de un mismo forward no son observaciones independientes; checkpoints de una misma secuencia también están emparejados.

El archivo incluye además `attention[13,128,4,4,8]`, una fila de probabilidades para la consulta 7, y `loss[13,17,128]`: base y 16 ablaciones individuales. Sus IDs, pasos, entradas y objetivos permiten trazabilidad. Las métricas y pares en CSV provienen del estudio previo; los valores de atención son pesos, no Q/K/V ni salidas concatenadas. El archivo compacto omite `residual_contribution` y `logits`, ya que ninguna función actual los usa; el archivo externo completo los conserva.

Las coordenadas de distintas cabezas o capas no tienen correspondencia semántica garantizada. La visualización muestra 3 coordenadas elegidas y pierde información; las líneas unen únicamente checkpoints registrados. La escala es uniforme dentro de la escena, pero se recalcula al cambiar de entrada o conjunto de cabezas. Los cruces en pantalla pueden ser proyecciones o superposiciones visuales y no demuestran intersecciones 16D.

### Mediciones e inferencias

En el checkpoint 300, la pérdida basal media de 128 entradas fue ≈0,002143. La ablación de cada cabeza individual en todas las posiciones aumentó la pérdida media en ≈0,000082–0,000677, mientras la exactitud top-1 permaneció 128/128. Es un efecto medido de esa intervención, no evidencia de necesidad general o especialización; poner `z` a cero puede ser una intervención fuera de distribución. Las posiciones 0 y 4 de cada entrada contienen el mismo símbolo.

CKA entre el inicio y el final de la misma cabeza estuvo aproximadamente entre 0,1588 y 0,3412; entre los últimos dos checkpoints, alrededor de 0,99989–0,999995, para esas entradas y esa métrica. Esto describe una similitud geométrica relativa al final, **no** igualdad de valores, convergencia definitiva ni equivalencia funcional. No se sabe qué sucedió entre checkpoints ni en otras tareas.

## C. Arquitectura de software realmente implementada

| Módulo | Archivos | Qué hace y qué no hace |
|---|---|---|
| Interfaz | `web/index.html`, `web/style.css`, `web/metodo.html` | Navegación, contexto, advertencias y ayuda en navegador. |
| Microscopio | `web/app.js` | Canvas 3D de tres componentes, arrastre/zoom, selección y vistas de 1, 4 o 16 cabezas, reproducción por 13 checkpoints. No reconstruye estados intermedios. |
| Gestión de datos | `research/activaciones_16.npz`, CSV, `web/data/`, `scripts/build_data.py` | Archivo científico compacto y recursos públicos derivados; formas y hashes en manifiesto. No carga pesos para ejecutar la app. |
| Motor pedagógico | Interfaz y roles en `server/lab.py` | Presenta contexto y roles con instrucciones; **no existe un motor curricular adaptativo validado**. |
| Agentes | `server/lab.py` | Guía, investigador y experimentalista mediante LLM local optativo. La calidad de cada rol es dependiente del modelo. |
| Orquestador | `server/lab.py` | Conecta roles secuencialmente con evidencia y propuestas previas marcadas no verificadas; sin herramientas de escritura ni control de selección. |
| Verificador | `server/lab.py` y `web/app.js` | Consulta determinista acotada; no verifica afirmaciones científicas arbitrarias de los agentes. |
| Persistencia científica | NPZ/CSV/JSON y Git | Archivos versionables; no hay base relacional ni servicio de bases de datos. |
| Memoria educativa | `web/app.js` | Selecciones en localStorage; conversación acotada en memoria de pestaña, no persistida por el servidor; borrar sesión disponible. No hay cuentas ni progreso curricular formal. |
| Backend | `server/server.py` | Servidor local estándar y endpoints JSON, opcional para navegación y necesario para orquestación. No es un backend público seguro. |
| Pruebas | `tests/` | Unitarias, reconstrucción, enlaces, navegación real y registros de ejecución. |

Contratos JSON implementados: `status.v1`, `evidence.v1`, `verification.v1` y `agent_response.v1`. El código controla tipos, rangos y checkpoints en el backend. Los resultados de LLM se etiquetan `unverified_ai_proposal` y se acompañan por evidencia numérica calculada; la etiqueta no convierte el texto en una afirmación comprobada.

## D. Decisiones técnicas

- **Canvas 3D y JavaScript estático:** evita construir una escena artificial o requerir un motor 3D, y permite publicar la vista estática con archivos servidos por HTTP. La librería Plotly del microscopio histórico queda fuera de la copia limpia, pero el diseño usa las mismas mediciones. La proyección por coordenadas no es PCA ni una visualización completa 16D.
- **NPZ + CSV + binarios:** simplifica integridad y consultas sin base de datos ni costo de servicio; el NPZ comprimido es fuente compacta para regenerar archivos web. `web/data/manifest.json` contiene los hashes de los binarios y el hash del NPZ compacto. La comprobación en navegador requiere Web Crypto y no es una firma autenticada contra un atacante que altere datos y manifiesto.
- **Python estándar + NumPy:** servidor y cálculos sin framework web adicional; costos de mantenimiento pequeños. No se pretende que el servidor local sea seguro ni escalable como servicio público.
- **LLM opcional:** la interfaz sin IA y el verificador no necesitan proveedor. Transformers permite una prueba local real sin claves; Ollama es una alternativa implementada pero no probada. Ambos modelos requieren descargar pesos y recursos de cómputo; un modelo mejor debe evaluarse por separado. No se ha implementado proveedor comercial.
- **Memoria mínima:** una selección persistente y conversación temporal ayudan a retomar la exploración sin cuentas ni base central. No hay garantía de privacidad si el usuario expone el backend o comparte la computadora.

## E. Problemas, soluciones y cuestiones abiertas

### Espacio, exclusiones y reconstrucción

La fuente completa anterior `activaciones_16.npz` ocupaba 17.613.394 bytes y contenía aportes residuales y logits que la app no utiliza. La copia compacta ocupa **2.472.342 bytes** y mantiene `z`, atención, pérdida, pasos, IDs y entradas. Se comprobó igualdad exacta de todos esos arrays contra la fuente completa. `z` y atención estaban guardados en float64 pero eran resultados float32 ampliados; volver a float32 no alteró sus valores. Los binarios web, además, se distribuyen listos para usar. Se borraron y regeneraron en la copia limpia: los tres hashes resultaron idénticos a los de antes de la regeneración.

Los 13 checkpoints no se incluyen porque el Lab no carga el Transformer. No se afirma que esta distribución pueda regenerar las activaciones **desde pesos** sin archivos externos. La recuperación del ZIP previo y sus hashes está descrita en `research/ORIGEN.md`; no se dispone de URL pública. Se conservaron el script de generación web, las pruebas, las métricas, los datos necesarios y los informes consolidados. La plataforma de trabajo tiene un límite aproximado de instantáneas y excluye cachés y paquetes regenerables; este límite justificó evitar duplicación, pero no se observó pérdida de los archivos científicos al hacer la copia.

### Limitación crítica del LLM

Después de la limpieza se ejecutó una interacción real con el modelo local `HuggingFaceTB/SmolLM2-135M-Instruct` en sus tres roles. La llamada devolvió tres respuestas y evidencia, pero las respuestas fueron casi idénticas y ofrecieron una explicación incorrecta de una cabeza de atención. Se produjo la advertencia de similitud y se conservó `tests/interaccion_real_limpio.json`. El ensayo tardó aproximadamente 75 segundos en ese entorno. No constituye un tutor científicamente confiable. La disponibilidad y calidad de un modelo mayor, así como la vía Ollama real, **no se probaron**.

### Verificación y seguridad

El verificador confirma números concretos bajo tolerancia, no interpreta frases libres ni garantiza veracidad del LLM. La IA puede incluir números o explicaciones falsos; el usuario debe contrastarlos explícitamente. El backend no tiene autenticación, TLS ni protección integral para un despliegue público. Un límite por proceso y el chequeo de Origin no reemplazan una arquitectura de seguridad o límites de gasto. No se incluyen ni se solicitan claves comerciales.

### Dependencias y regeneración

NumPy es necesario para el backend y reconstrucción; el navegador necesita servir archivos HTTP. Transformers/PyTorch sólo se necesitan para IA local opcional y requieren descargar modelo. Ollama requiere instalación separada. Las instrucciones y versiones están en README. Si falta el NPZ o un binario, el script o la interfaz muestran error; no se rellenan datos faltantes.

## F. Guía de auditoría

1. **Integridad y limpieza:** revisar `MANIFIESTO_EXCLUSIONES.md` y `research/ORIGEN.md`; calcular SHA-256 del NPZ compacto y de `web/data` y comparar con el manifiesto generado. Para auditar extracción desde pesos, obtener el ZIP externo identificado y verificar su hash antes de descomprimir. Los hashes no son firmas criptográficas de origen.
2. **Regeneración:** guardar hashes de `web/data/{z.bin,attention.bin,manifest.json}`, quitar esos tres archivos en una copia y ejecutar `python scripts/build_data.py`; deben reconstruirse y coincidir. Los resultados ejecutados están en `tests/logs/regeneracion.log`.
3. **Datos e indexación:** revisar `scripts/build_data.py`, funciones `val`/`att` en `web/app.js` y formas descritas en `docs/CIENCIA.md`. `tests/logs/comparacion_fuente.log` registra igualdad contra la fuente completa disponible durante esta limpieza. El archivo completo y pesos no son necesarios para ejecutar la app, pero sí para repetir esa comparación externa.
4. **Interfaces y selección:** leer `web/index.html`, `web/style.css`, `web/app.js`; comprobar modos, escala, gestión de cámara, marcador, identidad de entrada y paso. `tests/test_browser.py` usa Chromium contra un servidor en ejecución. `tests/test_links.py` comprueba enlaces y anclas de HTML locales; no certifica enlaces remotos ni rutas dentro de texto documental arbitrario.
5. **Orquestador y evidencia:** revisar `server/lab.py` y `server/server.py`. Probar `tests/test_lab.py`; la prueba de orquestación sustituye el modelo por un doble de prueba para comprobar orden y contratos, mientras `tests/interaccion_real_limpio.json` documenta una ejecución real por separado. Confirmar que el verificador devuelve `no_coincide` para componente 0 = 999 y que magnitudes desconocidas se rechazan.
6. **Privacidad y despliegue:** revisar la persistencia local y el historial acotado, solicitudes JSON, Origin, variable de activación del chat y límites. Ejecutar sólo en localhost salvo un entorno efímero controlado; no publicar el backend como servicio multiusuario sin rediseño.
7. **Diagnóstico:** un error de integridad o de tamaño indica binarios faltantes/alterados: regenerar desde el NPZ incluido. Si el backend no encuentra NPZ, verificar ruta `research/activaciones_16.npz`. Si chat devuelve 503 con IA desactivada, habilitar explícitamente y configurar proveedor local; si falla descarga, revisar conectividad/espacio y disponibilidad de la revisión. Un error de Web Crypto en contexto no seguro puede impedir verificar hashes en el navegador; usar `localhost` o HTTPS. Si Chromium no arranca, instalar las bibliotecas de sistema de Playwright.

## G. Instalación, publicación y costos

`README.md` contiene comandos de entorno virtual, servidor local, IA opcional, pruebas y GitHub Actions. `requirements.txt` incluye NumPy; `requirements-ai.txt` agrega Torch y Transformers. El modelo LLM se descarga aparte y no se distribuye. No se necesitan cuentas o credenciales para la versión sin IA.

El workflow `pages.yml` publica `web/` como sitio estático si el usuario lo sube a un repositorio y configura GitHub Actions. **No se ejecutó una publicación real** y GitHub Pages no ejecuta el backend: agentes requieren ejecución local u otro servidor con seguridad. La documentación de GitHub indica, para sitios publicados, máximo 1 GB y límite blando de tráfico de 100 GB/mes; consultar la fuente actual en `docs/COSTOS.md`. Cloudflare Workers AI es una alternativa futura no implementada con una asignación gratuita documentada y eventuales cargos en planes pagos. No se verificó el requisito de tarjeta. El cómputo local no tiene tarifa API pero consume electricidad, almacenamiento y recursos; cero dólares de proveedor no equivale a costo ilimitado o nulo.

## H. Estado final, pruebas y prioridades

| Funcionalidad | Estado | Evidencia / límite |
|---|---|---|
| Visualización de datos reales y vistas de 1/4/16 cabezas | **Implementada y probada** | Chromium con datos del paquete limpio; `tests/logs/navegador.log`. |
| Selectores de capa/cabeza/dimensiones/entrada/checkpoint y reproducción | **Implementada y probada** | Navegador; no se probaron todos los dispositivos. |
| Verificador de valores estructurados y rechazo de falso | **Implementada y probada** | Unitarias, navegador y API sin IA; alcance limitado a magnitudes codificadas. |
| Regeneración de `z.bin`, `attention.bin`, `manifest.json` | **Implementada y probada** | Se eliminaron y regeneraron; hashes iguales en `tests/logs/regeneracion.log`. |
| Procedencia e igualdad con fuente histórica disponible | **Implementada y probada** | Comparación exacta de siete arrays en `tests/logs/comparacion_fuente.log`; fuente completa externa no está en el ZIP. |
| Modo sin IA | **Implementada y probada** | Servidor limpio, datos y API; chat responde 503 explícito. |
| Contratos y secuencia multiagente | **Implementada y probada con doble de modelo** | `tests/test_lab.py`; no prueba calidad del LLM. |
| LLM Transformers local | **Experimental** | Tres llamadas reales posteriores a limpieza; respuestas incorrectas y repetitivas. No apto sin supervisión. |
| Proveedor Ollama | **Implementada, pendiente de validación** | No se ejecutó contra servicio real. |
| Publicación en GitHub Pages | **Implementada, pendiente de validación** | Workflow incluido; sin despliegue real. Pages no proporciona IA. |
| Verificación libre de afirmaciones del LLM | **Pendiente** | Sólo se comprueban consultas numéricas estructuradas; no se declara verificación universal. |
| Backend público seguro, agente educativo validado, evaluación con estudiantes | **Pendiente** | Requiere autenticación, cuotas, protección, evaluación humana y modelo adecuado. |

**Pruebas ejecutadas tras limpieza:** 7/7 unitarias, incluida prueba de enlaces; prueba Chromium de las tres vistas, entrada/dimensiones/tiempo y rechazo; servidor sin IA y API; regeneración de tres recursos; comparación exacta de arrays; interacción real LLM con resultado cualitativamente insatisfactorio. Se extrajo también el ZIP y se repitieron las siete pruebas, regeneración y prueba de navegador desde esa copia (`tests/logs/zip_audit.log`). Registros en `tests/logs/`. Las pruebas históricas son las indicadas en secciones anteriores y pertenecen a sus paquetes externos.

**Prioridades para auditoría posterior:** (1) evaluar y corregir calidad pedagógica con modelos más capaces y casos de referencia; (2) diseñar verificación explícita de afirmaciones extraídas del texto sin prometer cobertura total; (3) auditar seguridad y privacidad antes de cualquier backend público; (4) contrastar visualizaciones y accesibilidad en navegadores/dispositivos; (5) validar despliegue real y costos; (6) estudiar generalización con entradas y tareas controladas adicionales, sin reetiquetar proyecciones como geometría física.
