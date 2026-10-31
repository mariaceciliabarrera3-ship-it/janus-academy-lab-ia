import json,sys,hashlib
from pathlib import Path
import numpy as np
import pytest
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'server'));import lab
S={'layer':0,'head':0,'step':300,'sequence':0,'component':0}
def test_shapes_provenance_and_public_roundtrip():
 with np.load(ROOT/'research/activaciones_16.npz') as a:
  assert a['z'].shape==(13,128,4,4,16);assert a['z'].size//16==26624
  assert np.isfinite(a['z']).all() and np.isfinite(a['attention']).all()
  public=np.frombuffer((ROOT/'web/data/z.bin').read_bytes(),dtype='<f4').reshape(a['z'].shape);np.testing.assert_array_equal(public,a['z'])
  public=np.frombuffer((ROOT/'web/data/attention.bin').read_bytes(),dtype='<f4').reshape(a['attention'].shape);np.testing.assert_array_equal(public,a['attention'])
 m=json.loads((ROOT/'web/data/manifest.json').read_text());assert hashlib.sha256((ROOT/'research/activaciones_16.npz').read_bytes()).hexdigest()==m['source_npz_sha256']
 for key in ['z','attention']:assert hashlib.sha256((ROOT/f'web/data/{key}.bin').read_bytes()).hexdigest()==m['files'][key]
def test_false_claim_rejected():
 r=lab.verify_claim(S,'component',0,999.0);assert r['verdict']=='no_coincide';assert r['evidence']['vector_id'].endswith('/L0/H0/z/s0000/p7')
 r=lab.verify_claim(S,'delta_loss',0,0.0);assert r['verdict']=='no_coincide'
def test_true_claim_accepted():
 value=float(lab.D['z'][12,0,0,0,0]);r=lab.verify_claim(S,'component',0,value);assert r['verdict']=='coincide';assert r['difference']==0
def test_unknown_claim_never_verified():
 with pytest.raises(ValueError):lab.verify_claim(S,'specialization',0,1)
 with pytest.raises(ValueError):lab.verify_claim({**S,'step':1},'component',0,0)
 with pytest.raises(ValueError):lab.verify_claim(S,'attention',8,0)
 with pytest.raises(ValueError):lab.verify_claim(S,'component',0,float('nan'))
def test_multiagent_order_and_independent_evidence(monkeypatch):
 monkeypatch.setattr(lab,'ENABLED',True);monkeypatch.setattr(lab,'rate_limit',lambda:None);calls=[]
 def fake(messages):calls.append(messages);return 'Propuesta '+str(len(calls))
 monkeypatch.setattr(lab,'llm',fake);r=lab.chat({'message':'¿Qué observo?','role':'equipo','selection':S,'history':[]});assert [a['role'] for a in r['agents']]==['guia','cientifico','experimentalista'];assert 'Propuesta 1' in calls[1][0]['content'];assert 'Propuesta 2' in calls[2][0]['content'];assert r['evidence']['component_value']==lab.D['z'][12,0,0,0,0];assert all(a['status']=='unverified_ai_proposal' for a in r['agents'])
def test_history_limit_and_privacy(monkeypatch):
 monkeypatch.setattr(lab,'ENABLED',True)
 with pytest.raises(ValueError):lab.chat({'message':'x','role':'equipo','selection':S,'history':[{}]*9})
 with pytest.raises(ValueError):lab.chat({'message':'x','role':'equipo','selection':{**S,'head':4},'history':[]})
