# Exploraciones reproducibles

## 1. Una coordenada y una afirmación falsa

Elegí capa 0, cabeza 0, entrada s0000, checkpoint 300 y componente 0. El valor guardado es 0,11279769986867905. En el verificador, elegí `Componente z`, índice 0 y proponé 999: debe devolver **NO COINCIDE** y la diferencia. Proponé 0,1127977: debe coincidir dentro de tolerancia absoluta 0,000001. Esto verifica sólo esa afirmación escalar.

## 2. Atención casi idéntica

En capa 0, paso 300, modo «Por capa», mirá H0 y H3. La comparación cuantitativa original sobre las 128 entradas reportó JS media ≈0,000020 nats entre sus mapas de atención; `research/pares.csv` conserva el valor. Ver un solo caso no prueba ese promedio ni igualdad funcional. H0 y H3 tienen contribuciones que pueden diferir incluso si sus mapas se parecen.

## 3. Control experimental

En las entradas `[a,b,c,d,a,b,c,d]`, las posiciones 0 y 4 contienen el mismo token. Al ver atención distinta a esas posiciones, preguntar: ¿persistiría la diferencia si no se repitiera el símbolo? Esa modificación requiere nuevas entradas y reevaluación controlada de checkpoints; no está hecha ni debe presentarse como observación.

## 4. Intervención existente

Paso 300, L0/H0; en el verificador elegí `Cambio medio de pérdida por ablación`. Proponer 0 debe dar **NO COINCIDE** con tolerancia 1e-6; el valor real es ≈0,000677. Se anula esa cabeza en todas las posiciones, no sólo la entrada visible; el resultado es la media de 128 entradas. La exactitud de la intervención fue 128/128: no basta para afirmar que la cabeza es necesaria para esa exactitud.
