const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'account-probes.cjs');
const fixture=fs.readFileSync(path.join(__dirname,'workspace.cjs'),'utf8').split('(async()=>{')[0];
const probes=String.raw`
(async()=>{
 await tick();window.diaryAuth=productionAuth;
 $('.hero-cta').click();
 assert.equal(run('activeBook().spreads.length'),4);
 const types=run('activeBook().spreads.flatMap(s=>s.pieces).map(p=>p.type)');
 for(const type of ['note','photo','audio','video','paper'])assert(types.includes(type),type+' in sample');
 const sample=run('JSON.stringify(activeBook().spreads)');
 $('#diary-left').value='Attempted overwrite';$('#diary-left').oninput();
 assert.equal(run('newPiece("note","Attempted addition")'),null);
 run('addSpread()');await send('Diary, clear this whole book.');
 assert.equal(run('JSON.stringify(activeBook().spreads)'),sample,'Sample stays unchanged through text, pieces, pages, and voice');
 run('bookDialog(activeBookId)');assert(!$('#book-dialog').open);
 $('#make-own-book').click();assert($('#login').open);assert(!$('#book-dialog').open);
 assert($('#email-signin-form button').disabled,'Unconfigured sign-in cannot pretend to authenticate');
 assert.equal(run('books.filter(b=>!b.isSample).length'),0);
 const rows=new Map();let current=null,sent=0,listener,conflict=false,oauthOptions=null;
 function table(){let mode='read',data,filters={};return {
  select(){return this},eq(k,v){filters[k]=v;return this},insert(v){mode='insert';data=v;return this},update(v){mode='update';data=v;return this},
  async maybeSingle(){if(mode==='read')return {data:structuredClone(rows.get(filters.user_id)||null)};
   if(conflict||rows.get(filters.user_id)?.revision!==filters.revision)return {data:null};
   rows.set(data.user_id,structuredClone(data));return {data:{revision:data.revision}}},
  async single(){if(rows.has(data.user_id))return {error:{message:'duplicate'}};rows.set(data.user_id,structuredClone(data));return {data:{revision:data.revision}}}
 }}
 const sdk={from:table,auth:{
  onAuthStateChange(fn){listener=fn},async getSession(){return {data:{session:current}}},
  async signInWithOtp(){sent++;return {}},async signInWithOAuth(options){oauthOptions=options;return {}},
  async verifyOtp({email,token}){if(token!=='123456')return {error:{message:'Invalid email code'}};current={user:{id:'account-a',email}};return {data:{session:current}}},
  async signOut(){current=null;listener('SIGNED_OUT',null);return {}}
 }};
 window.location={origin:'http://127.0.0.1:4173'};
 await productionAuth.install(sdk,{google:true});
 assert(!$('#google-signin').disabled);await $('#google-signin').onclick();assert.equal(oauthOptions.provider,'google');assert.equal(oauthOptions.options.redirectTo,'http://127.0.0.1:4173/');assert(!productionAuth.canEdit(),'Starting Google OAuth does not authenticate without a verified session');
 $('#make-own-book').click();$('#signin-email').value='a@example.test';
 await $('#email-signin-form').onsubmit({preventDefault(){}});
 assert.equal(sent,1);assert(!productionAuth.canEdit(),'Sending an email is not authentication');
 $('#signin-code').value='000000';await $('#email-verify-form').onsubmit({preventDefault(){}});assert(!productionAuth.canEdit());
 $('#signin-code').value='123456';await $('#email-verify-form').onsubmit({preventDefault(){}});await tick();
 assert(productionAuth.canEdit());assert($('#book-dialog').open,'Successful verification resumes book creation');
 function create(title){run('bookDialog()');$('#book-title').value=title;$('#book-category').value='Personal';$('#book-form').onsubmit({preventDefault(){}})}
 create('Account A first');assert.equal($('#diary-left').value,'');assert.equal(run('pieces.length'),0);assert($('#book').classList.contains('book-open'));
 create('Account A second');await productionAuth.flush();
 assert.equal(rows.get('account-a').payload.books.length,2);assert(!rows.get('account-a').payload.books.some(b=>b.isSample));
 await productionAuth.transition(null);assert(!productionAuth.canEdit());assert.equal(run('books.filter(b=>!b.isSample).length'),0);
 await productionAuth.transition({user:{id:'account-b',email:'b@example.test'}});assert.equal(run('books.filter(b=>!b.isSample).length'),0);
 create('Account B only');await productionAuth.flush();assert.equal(rows.get('account-b').payload.books.length,1);
 storage.delete('wd-account-account-a-wd-books');storage.delete('wd-account-account-a-wd-memories');
 await productionAuth.transition({user:{id:'account-a',email:'a@example.test'}});
 assert(!$('#books-view').hidden,'Signing back in shows the restored library');
 assert.deepEqual(Array.from(run('books.filter(b=>!b.isSample).map(b=>b.title)')),['Account A first','Account A second']);
 run('showBook(books.find(b=>!b.isSample).id)');$('#diary-left').value='A private entry';$('#diary-left').oninput();await productionAuth.flush();
 assert.equal(rows.get('account-a').revision,2);
 conflict=true;$('#diary-left').value='Preserve unsynced changes';$('#diary-left').oninput();await productionAuth.flush();
 assert($('#cloud-status').textContent.includes('paused'));assert.equal($('#diary-left').value,'Preserve unsynced changes');
 await productionAuth.transition({user:{id:'account-a',email:'a@example.test'}},true);
 assert($('#auth-status').textContent.includes('Unsynced'));assert(run('books.some(b=>b.spreads.some(s=>s.diary.left==="Preserve unsynced changes"))'));
 assert.equal(errors.length,0,JSON.stringify(errors));
 console.log('Account/sample checks passed: read-only media sample, gated creation, verified email, Google OAuth initiation, cloud restore without a local cache, multiple empty books, account isolation, cloud revisions, and conflict recovery. Supabase and email delivery are mocked.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`;
const mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;mod._compile(fixture+probes,filename);
