from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[1]/'web'
class Extract(HTMLParser):
 def __init__(self):super().__init__();self.ids=set();self.targets=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  for attr in ('href','src'):
   if attr in a:self.targets.append((tag,a[attr]))
def test_web_local_links_exist():
 for path in ROOT.glob('*.html'):
  p=Extract();p.feed(path.read_text())
  for tag,href in p.targets:
   u=urlsplit(href)
   if u.scheme or u.netloc or href.startswith('/api/'):continue
   target=(path.parent/unquote(u.path)).resolve() if u.path else path.resolve()
   assert target.is_file(),(path.name,href)
   if u.fragment:
    content=Extract();content.feed(target.read_text());assert u.fragment in content.ids,(path.name,href)
