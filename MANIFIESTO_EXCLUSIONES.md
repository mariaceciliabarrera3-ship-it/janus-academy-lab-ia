# Manifiesto de exclusiones de la copia de distribución

La limpieza se realizó sobre `/home/user/janus-lab-clean`; ninguna exclusión modificó `/home/user/janus-academy-lab` ni los estudios y ZIP anteriores.

| Excluido de esta copia | Motivo y recuperación |
|---|---|
| ZIP y directorios completos de investigaciones anteriores | No se necesitan para ejecutar el Lab. El archivo externo exacto para reextraer se identifica en `research/ORIGEN.md`; el usuario indicó que conserva estos ZIP. |
| `research/insumos/checkpoints/*.pt` y otros insumos previos | La app no ejecuta el Transformer ni lee pesos. Son necesarios para **repetir la extracción original**, por eso se documenta el archivo externo y no se afirma que la reconstrucción integral sea autocontenida. |
| `research/codigo/` experimental histórico | No participa en la ejecución ni regeneración de binarios del Lab. Se recupera del ZIP previo; el script actual `scripts/build_data.py` sí se conserva. |
| `research/anteriores/`, incluido el HTML Plotly anterior | Son patrimonio de investigaciones previas ya conservado aparte; reemplazado por el relato consolidado en `REPORTE_JANUS_ACADEMY_LAB.md`. |
| `residual_contribution` y `logits` del NPZ original | Ninguna función actual los lee. Se conservaron todas las salidas `z`, pesos de atención, pérdidas y metadatos utilizados. `research/ORIGEN.md` documenta origen y hash de la fuente completa. |
| NPZ completo original, 17,6 MB | Reemplazado por un NPZ compacto con los arrays necesarios; comprobada igualdad exacta numérica de las matrices utilizadas. No implica nueva medición. |
| `research/evolucion.csv`, manifiesto histórico y logs de investigaciones previas | No los consulta el Lab ni el verificador; las métricas y comparaciones usadas se conservan. Consultar reporte histórico en el ZIP previo. |
| `tests/captura.png`, capturas, `browser_intento1.log`, `real_agent_interaction.json` y logs redundantes | No son necesarios para ejecutar ni testear; el fallo inicial de aserción se declara en el informe consolidado. Se mantienen pruebas y registros nuevos del paquete limpio, incluida otra interacción real. |
| `__pycache__`, `.pytest_cache`, `.venv`, paquetes instalados, modelos LLM externos | Archivos regenerables, dependencias o cachés que no pertenecen al código fuente. Dependencias y descarga opcional del modelo están documentadas. |

El hash previo del paquete completo de Lab también era `60eb4e7a0bc870acccb19cdd90a7a21a2ffec7fb35386d8baef595c013379ec7` (`janus-academy-lab.zip`).
