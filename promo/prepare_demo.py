"""Create an isolated, fictional UI fixture. Never uses real accounts or books."""
from pathlib import Path
import shutil
import json

ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / '.qa' / 'promo-site'
shutil.copytree(ROOT / 'dist', DEMO, dirs_exist_ok=True)
(DEMO / 'auth-config.json').write_text('{}', encoding='utf-8')
(DEMO / 'account-auth.js').write_text('''
window.libraryScope='promo-recording';
window.diaryAuth={canEdit:()=>true,requireSignedIn:()=>true,user:{id:'fictional-demo',email:'demo@example.invalid'},ready:true,show(){toast('Fictional demo account. No cloud connection.')}};
window.cloudQueue=()=>{document.querySelector('#cloud-status').textContent='Fictional demo library · account saving shown for illustration'};
document.querySelector('#account').textContent='Demo account';document.querySelector('#account').onclick=()=>window.diaryAuth.show();
window.libraryBridge.set({books:[],memories:[]});
''', encoding='utf-8')
index = (DEMO / 'index.html').read_text(encoding='utf-8')
index = index.replace('</body>', '<script src="promo-scene.js"></script></body>')
(DEMO / 'index.html').write_text(index, encoding='utf-8')
shutil.copyfile(ROOT / 'promo' / 'promo-scene.js', DEMO / 'promo-scene.js')
scenes = json.loads((ROOT / 'promo' / 'scenes.json').read_text(encoding='utf-8'))
links = ''.join('<li><a href="/?scene='+s['id']+'">'+s['id']+'</a></li>' for s in scenes)
links += ''.join('<li><a href="/?scene='+name+'">'+name+'</a></li>' for name in ['journal-empty', 'paper', 'ideas'])
(DEMO / 'launcher.html').write_text('<!doctype html><title>Fictional promo scenes</title><h1>Wispr Diary promo scenes</h1><p>Isolated UI fixtures. No user account or diary data.</p><ul>'+links+'</ul>', encoding='utf-8')
print('Isolated fictional demo prepared at', DEMO)
