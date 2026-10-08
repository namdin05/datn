import assert from 'node:assert/strict';
import { config } from 'dotenv';
import { JSDOM } from 'jsdom';
import { createDb } from '../../backend/src/config/db';
import { createApp } from '../../backend/src/app';
import { readEnv } from '../../backend/src/config/env';
import { fileURLToPath } from 'node:url';

config({path:fileURLToPath(new URL('../../backend/.env',import.meta.url)),quiet:true});
const pool=createDb();
const server=createApp({...readEnv(),NODE_ENV:'test'},{db:pool}).listen(0,'127.0.0.1');
await new Promise<void>((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});
const addr=server.address();assert.ok(addr&&typeof addr!=='string');
const base=`http://127.0.0.1:${addr.port}`;
const realFetch=globalThis.fetch;
const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost:5173',pretendToBeVisual:true});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,sessionStorage:dom.window.sessionStorage,requestAnimationFrame:dom.window.requestAnimationFrame.bind(dom.window),cancelAnimationFrame:dom.window.cancelAnimationFrame.bind(dom.window),IS_REACT_ACT_ENVIRONMENT:true,React:await import('react')});
dom.window.scrollTo=()=>{};
const {act}=await import('react');const {createRoot}=await import('react-dom/client');const {MemoryRouter}=await import('react-router');const {App}=await import('../src/app/App');
const container=document.getElementById('root')!;let root=createRoot(container);
let failed=false;
globalThis.fetch=async(input,options)=>{
  if(failed)throw new TypeError('offline');
  const url=new URL(String(input));return realFetch(base+url.pathname+url.search,options);
};
async function waitFor(predicate:()=>boolean){
  for(let n=0;n<300;n++){if(predicate())return;await act(async()=>{await new Promise(resolve=>setTimeout(resolve,30));});}
  throw new Error('UI_READ_TIMEOUT');
}
async function mount(path:string){await act(async()=>root.render(<MemoryRouter initialEntries={[path]}><App/></MemoryRouter>));}
async function reset(){await act(async()=>root.unmount());root=createRoot(container);}
try{
  const dashboard=await(await realFetch(base+'/api/dev/dashboard')).json();assert.equal(dashboard.success,true);
  const quiz=dashboard.data.quizzes.find((q:{id:string})=>q.id==='10000000-0000-0000-0000-000000000004');assert.ok(quiz);
  const session=dashboard.data.sessions[0];
  localStorage.setItem('qforge-demo-v1',JSON.stringify({quizzes:[{title:'LOCAL_FAKE_MUST_NOT_RENDER'}],sessions:[]}));
  await mount('/teacher/quizzes');await waitFor(()=>!!container.querySelector('.quiz-grid'));
  assert.match(container.textContent!,/QForge S04 Demo/);assert.ok(!container.textContent!.includes('LOCAL_FAKE_MUST_NOT_RENDER'));
  await reset();await mount(`/teacher/editor/${quiz.id}`);await waitFor(()=>container.querySelectorAll('.db-question').length===5);
  assert.equal(container.querySelectorAll('.teacher-options>div').length,20);
  if(session){
    await reset();await mount(`/teacher/session/${session.id}`);await waitFor(()=>container.textContent!.includes(session.pin));
    const detail=await(await realFetch(base+`/api/dev/sessions/${session.id}`)).json();
    for(const p of detail.data.participants)assert.ok(container.textContent!.includes(p.name));
    if(session.status!=='FINISHED'){
      const publicResponse=await(await realFetch(base+`/api/rooms/${session.pin}`)).json();
      assert.deepEqual(Object.keys(publicResponse.data).sort(),['participantCount','pin','status','title']);
    }
  }
  assert.equal((await realFetch(base+'/api/dev/quizzes/not-a-uuid')).status,400);
  assert.equal((await realFetch(base+'/api/dev/quizzes/ffffffff-ffff-4fff-8fff-ffffffffffff')).status,404);
  await reset();failed=true;await mount('/teacher/quizzes');await waitFor(()=>!!container.querySelector('[role="alert"]'));
  assert.ok(!container.querySelector('.quiz-grid'));failed=false;
  await act(async()=>container.querySelector('[role="alert"] button')!.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})));
  await waitFor(()=>!!container.querySelector('.quiz-grid'));
  console.log('PASS: FE -> HTTP API -> DB thật; dashboard bỏ localStorage, quiz 5 câu/20 options, session/participants, public response, invalid/not-found và retry.');
} finally{
  await act(async()=>root.unmount());dom.window.close();globalThis.fetch=realFetch;
  await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));await pool.end();
}
