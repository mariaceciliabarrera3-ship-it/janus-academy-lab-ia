# JANUS Academy Lab — distribución limpia

Laboratorio educativo para explorar mediciones reales de 16 cabezas de un Transformer **alternativo**, con 13 checkpoints y 128 entradas. No son pesos originales JANUS. La versión estática permite escoger capa, cabeza, entrada, 3 de 16 dimensiones y checkpoint; ofrece vistas individual, por capa y global y un verificador numérico estructurado.

**Estado importante:** la integración opcional de LLM es real pero experimental. En una prueba real después de la limpieza, SmolLM2-135M-Instruct respondió con explicaciones incorrectas y casi idénticas para tres roles. No está validado como tutor y requiere supervisión. Las respuestas de IA se identifican como no verificadas. El verificador rechaza afirmaciones numéricas estructuradas fuera de tolerancia; no valida automáticamente texto libre.

## Uso sin IA

Python 3.11+ y NumPy:

```sh
python -m venv .venv
source .venv/bin/activate                # Windows: .venv\Scripts\activate
python -m pip install -r requirements.txt
python server/server.py
# abrir http://127.0.0.1:8000/
```

Sin IA, sin cuenta y sin clave. Alternativamente `python -m http.server 8000 --directory web` sirve la vista estática; el verificador del navegador funciona, sin API. No abras `web/index.html` mediante `file://`: muchos navegadores bloquean la lectura de binarios locales.

## IA local optativa

```sh
python -m pip install torch==2.15.0 --index-url https://download.pytorch.org/whl/cpu
python -m pip install -r requirements-ai.txt
JANUS_ENABLE_CHAT=1 JANUS_PROVIDER=transformers python server/server.py
```

En la primera consulta se descarga el modelo `HuggingFaceTB/SmolLM2-135M-Instruct`, revisión `12fd25f77366fa6b3b4b768ec3050bf629380bac`, ~271 MB; no está incluido. No es necesario para la app sin IA. La salida pequeña ensayada resultó incorrecta; usarla sólo para investigación y supervisión. `JANUS_MODEL` y `JANUS_REVISION` permiten elegir otro modelo compatible; no fue probado otro modelo aquí. Atención a RAM, electricidad y licencias. El historial reside en memoria de la pestaña, no en base del servidor; no enviar datos sensibles.

También hay un adaptador para Ollama local: instalar Ollama, descargar un modelo y ejecutar `JANUS_ENABLE_CHAT=1 JANUS_PROVIDER=ollama JANUS_MODEL=smollm2:135m python server/server.py`. La API se dirige a `127.0.0.1:11434` desde el servidor. **No se realizó una prueba con Ollama real.** Ver `docs/ARQUITECTURA.md`.

El servidor escucha `127.0.0.1` por defecto y el chat está desactivado. No hay autenticación ni seguridad de producción: **no exponer el backend en Internet** sin TLS, autenticación, límites distribuidos y auditoría. No se incluyen credenciales ni integración comercial.

## Datos y regeneración

`research/activaciones_16.npz` contiene `z`, atención, pérdidas, pasos, IDs, entradas y objetivos; `metricas.csv` y `pares.csv` conservan datos derivados usados en el manifiesto o documentación. El NPZ reducido reproduce exactamente los valores usados de la fuente completa. Reconstruir los tres recursos públicos incluidos:

```sh
python scripts/build_data.py
# web/data/z.bin, attention.bin y manifest.json
```

Este procedimiento fue probado desde archivos públicos borrados. Para repetir **la extracción original desde los checkpoints**, no incluidos en este paquete, ver el archivo externo exacto y hash en `research/ORIGEN.md`. Ese archivo no tiene URL pública conocida y debe aportarlo quien conserve los estudios anteriores. Las dependencias faltantes y archivos ausentes producen errores; no se rellenan con datos inventados.

## Pruebas

```sh
python -m pip install pytest
python -m pytest -v tests/test_lab.py tests/test_links.py
# opcional para navegador:
python -m pip install playwright
python -m playwright install chromium
python server/server.py                 # en otra terminal
python tests/test_browser.py
```

Según el sistema, Chromium puede requerir bibliotecas adicionales (`python -m playwright install-deps chromium`). `JANUS_TEST_URL` permite elegir otra URL para la prueba de navegador. Se registraron siete pruebas unitarias aprobadas, prueba de navegador, API sin IA, comparación de datos con el origen y regeneración en `tests/logs/`. `tests/interaccion_real_limpio.json` registra una prueba real del LLM posterior a la limpieza; no valida su precisión. Ver resultados detallados en `REPORTE_JANUS_ACADEMY_LAB.md`.

## Publicación estática en GitHub

1. Crear un repositorio público y subir el contenido de este directorio.
2. En Settings → Pages, elegir GitHub Actions.
3. Ejecutar el workflow `.github/workflows/pages.yml` en `main`; publica sólo `web/`.
4. Abrir la URL que proporcione GitHub. El microscopio y el verificador estático funcionan; **GitHub Pages no ejecuta el backend de agentes**.

El workflow está incluido, pero no se publicó ni se probó en GitHub en esta entrega. Consultar `docs/COSTOS.md` para límites y costos; no se promete gratuidad ilimitada.

## Mapa de archivos

- `web/`: interfaz, proyección 3D Canvas, memoria local y verificación estructurada.
- `server/`: API opcional y orquestación de roles; sin secretos.
- `research/`: NPZ compacto, métricas y procedencia de la fuente completa externa.
- `scripts/build_data.py`: reconstrucción de recursos web.
- `tests/`: pruebas y registros de ejecución.
- `docs/`: límites científicos, arquitectura, costos y ejemplos.
- `MANIFIESTO_EXCLUSIONES.md` y `REPORTE_JANUS_ACADEMY_LAB.md`: limpieza y auditoría.

Licencia MIT para el código nuevo. Los modelos externos tienen sus propias licencias.
