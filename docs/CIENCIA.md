# Ciencia y procedencia

## Identidad del experimento

`nano-copy-v1`, `r1729-replay-checkpoints-v1`: Transformer alternativo causal de 4 capas, 4 cabezas por capa, d_model=64, head_dim=16, 136.592 parámetros. No representa pesos JANUS originales. Una sola corrida entrenada en la tarea artificial `[a,b,c,d,a,b,c,d] → a`. Las activaciones fueron reconstruidas con los 13 pesos originales guardados en pasos 0,25,…,300, para las primeras 128 entradas de referencia; 17 aparecieron en entrenamiento. No representan datos naturales ni una evaluación íntegramente independiente.

Por cada checkpoint y entrada se obtienen 16 vectores `z=A V` en posición 7: 26.624 vectores de 16 valores; dimensiones `[paso,entrada,capa,cabeza,componente]`. Un vector y sus 16 valores tienen una identidad conjunta, no son 16 muestras independientes. Atención `[paso,entrada,capa,cabeza,posición_clave]`. El relato consolidado está en `REPORTE_JANUS_ACADEMY_LAB.md`; la procedencia y recuperación de los estudios previos figuran en `research/ORIGEN.md`.

## Derivaciones

`research/activaciones_16.npz` es una versión compacta derivada que conserva `z`, atención, pérdidas por intervención, entradas e IDs; excluye aportes residuales y logits no usados por la aplicación. `scripts/build_data.py` exporta `z` y atención a float32 little-endian; esta conversión es exacta para los valores que provienen de PyTorch float32. El manifiesto guarda hashes SHA-256 de NPZ y binarios y las tablas de métricas. `tests/test_lab.py` comprueba la igualdad bit a bit de valores numéricos con NPZ. Navegadores con Web Crypto comprueban hashes de binarios al cargar; sin Web Crypto no se verifica ese hash en el navegador. El hash del manifiesto de frontend no es una firma autenticada: un atacante que modifique simultáneamente datos y manifiesto puede engañar la comprobación. Verificar los hashes desde una copia confiable del repositorio.

Cada vista usa tres componentes seleccionadas de `z` y una escala uniforme común dentro de la escena, calculada a partir de las 13 observaciones de la entrada seleccionada y las cabezas visibles. Al cambiar selección puede cambiar la escala. En vistas de varias cabezas/capas, los índices de componentes no aseguran equivalencia semántica; usar diferencias visuales sólo como exploración. La proyección pierde información y los segmentos entre checkpoints no son estados medidos.

La ablación pone a cero una cabeza en todas las posiciones de una capa antes de la proyección de salida. El cambio de pérdida es la media emparejada de 128 entradas, no la diferencia de pérdida de la secuencia seleccionada. El verificador compara un único escalar o media estructurada con tolerancia absoluta 1e-6; no valida preguntas o afirmaciones arbitrarias ni respuestas LLM. No inferir función causal universal, especialización, intención o conciencia.
