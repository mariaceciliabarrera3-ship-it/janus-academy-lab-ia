from pathlib import Path
import numpy as np,json,csv,hashlib
p=Path(__file__).resolve().parents[1];d=p/'web/data';d.mkdir(parents=True,exist_ok=True);raw=p/'research/activaciones_16.npz';a=np.load(raw)
for key in ['z','attention']:
 v=np.asarray(a[key],dtype='<f4');(d/f'{key}.bin').write_bytes(v.tobytes())
metrics=list(csv.DictReader((p/'research/metricas.csv').open()));pairs=list(csv.DictReader((p/'research/pares.csv').open()))
manifest={'version':1,'model':'nano-copy-v1','run':'r1729-replay-checkpoints-v1','shape_z':list(a['z'].shape),'shape_attention':list(a['attention'].shape),'steps':a['steps'].tolist(),'sequence_ids':a['sequence_ids'].tolist(),'tokens':a['tokens'].tolist(),'targets':a['targets'].tolist(),'query_position':7,'dtype':'float32 little endian','source_npz_sha256':hashlib.sha256(raw.read_bytes()).hexdigest(),'files':{key:hashlib.sha256((d/f'{key}.bin').read_bytes()).hexdigest() for key in ['z','attention']},'metrics':metrics,'pairs':pairs}
(d/'manifest.json').write_text(json.dumps(manifest,separators=(',',':')))
print('public data built; float32 preserves the original model outputs')
