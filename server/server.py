"""Servidor local, sin dependencia web; no exponer directamente con IA habilitada."""
import os,sys,json,threading
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlsplit
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent));import lab
ROOT=Path(__file__).resolve().parents[1]/'web'
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def response_json(self,status,obj):
  raw=json.dumps(obj,ensure_ascii=False,allow_nan=False).encode();self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
 def do_GET(self):
  if urlsplit(self.path).path=='/api/status':return self.response_json(200,{'enabled':lab.ENABLED,'provider':lab.PROVIDER if lab.ENABLED else None,'schema':'status.v1'})
  return super().do_GET()
 def do_POST(self):
  path=urlsplit(self.path).path
  if path not in ['/api/chat','/api/verify']:return self.response_json(404,{'error':'Ruta desconocida'})
  origin=self.headers.get('Origin');host=self.headers.get('Host','');
  if origin and urlsplit(origin).netloc!=host:return self.response_json(403,{'error':'Origen no permitido'})
  if self.headers.get('Content-Type','').split(';')[0]!='application/json':return self.response_json(415,{'error':'Se requiere JSON'})
  try:
   n=int(self.headers.get('Content-Length','0'))
   if n<=0 or n>16384:raise ValueError('Tamaño inválido')
   body=json.loads(self.rfile.read(n))
   if path=='/api/chat':result=lab.chat(body)
   else:result=lab.verify_claim(body['selection'],body['kind'],body['index'],body['claim'])
   return self.response_json(200,result)
  except (ValueError,KeyError,TypeError,json.JSONDecodeError) as e:return self.response_json(400,{'error':str(e)})
  except PermissionError as e:return self.response_json(503,{'error':str(e)})
  except Exception as e:
   # Nunca exponer rutas, credenciales ni trazas internas al cliente.
   print('Error API:',type(e).__name__,flush=True);return self.response_json(503,{'error':'Proveedor no disponible o límite alcanzado; revisá el servidor local.'})
if __name__=='__main__':
 host=os.getenv('JANUS_HOST','127.0.0.1');port=int(os.getenv('PORT','8000'));print(f'JANUS Academy Lab en http://{host}:{port} · agentes {"activados" if lab.ENABLED else "desactivados"}',flush=True);ThreadingHTTPServer((host,port),Handler).serve_forever()
