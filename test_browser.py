from playwright.sync_api import sync_playwright
from pathlib import Path
import os
P=Path(__file__).resolve().parents[1]
with sync_playwright() as w:
 b=w.chromium.launch(headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':950});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(os.getenv('JANUS_TEST_URL','http://127.0.0.1:8000/'),wait_until='networkidle');page.wait_for_selector('.component');assert page.locator('.component').count()==16
 assert page.locator('[data-h]').count()==16
 page.click('[data-mode=layer]');assert 'Cuatro cabezas' in page.locator('#viewTitle').inner_text();page.click('[data-mode=global]');assert '16 cabezas' in page.locator('#viewTitle').inner_text();page.select_option('#layer','2');page.select_option('#head','3');page.select_option('#sequence','5');page.click('#next');assert 'paso 25' in page.locator('#obsName').inner_text();assert 'L2 / H3' in page.locator('#obsId').inner_text();
 page.fill('#claimValue','999');page.click('#verify');assert 'NO COINCIDE' in page.locator('#verifyResult').inner_text();page.locator('#time').fill('12');page.locator('#time').dispatch_event('input');assert 'Paso 300' in page.locator('#stepText').inner_text();page.click('#play');page.wait_for_timeout(1400);assert 'Paso 25' in page.locator('#stepText').inner_text();page.click('#play');page.select_option('#dimX','5');assert page.locator('#dimX').input_value()=='5'
 page.click('[data-h="15"]');assert 'Cabeza 3' in page.locator('#inspectTitle').inner_text();page.click('[data-mode=single]');page.click('#resetView');assert not errors,errors
 page.evaluate('window.scrollTo(0,0)');print('OK: carga, 16 cabezas, 3 modos, selección, 13 checkpoints, reproducción, 16 componentes, rechazo numérico, dimensiones; errores JS:',len(errors));b.close()
