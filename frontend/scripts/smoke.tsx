import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost:5173', pretendToBeVisual: true });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, sessionStorage: dom.window.sessionStorage, requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window), cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window), IS_REACT_ACT_ENVIRONMENT: true });
dom.window.scrollTo = () => {};
const { act } = await import('react');
Object.assign(globalThis, { React: await import('react') });
const { createRoot } = await import('react-dom/client');
const { MemoryRouter } = await import('react-router');
const { LocalDemoApp: App } = await import('../src/app/App');
const { SetupPage } = await import('../src/features/setup/SetupPage');
const { Button } = await import('../src/components/ui/button');
const { demoGateway, readStore } = await import('../src/lib/demo');
Object.assign(globalThis, { Event: dom.window.Event });
const container = document.getElementById('root')!;

let root = createRoot(container);
async function route(path: string) {
  await act(async () => { root.render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>); });
}
async function reset() { await act(async () => root.unmount()); root = createRoot(container); }

await route('/teacher/quizzes');
assert.match(container.textContent!, /Chào mừng trở lại/);
assert.equal(document.title, 'Tài khoản giảng viên · QForge');
assert.ok(container.querySelector('#main-content'));
await reset();

sessionStorage.setItem('qforge-teacher','s05@example.com');
await route('/teacher/quizzes');
assert.ok(container.querySelector('.teacher-shell'));
assert.match(container.textContent!, /Đề thi của tôi/);
assert.equal(container.querySelector('nav a[aria-current="page"]')?.getAttribute('href'), '/teacher/quizzes');
await reset();
await route('/teacher/reports');
assert.match(container.textContent!, /Chưa có phiên học/);
assert.ok(container.querySelector('[data-slot="card"]'));
await reset();
await route('/missing-s05-page');
assert.match(container.textContent!, /Không tìm thấy trang/);
assert.equal(container.querySelector('[data-slot="button"]')?.tagName,'A');
await reset();

const session = demoGateway.createSession(readStore().quizzes[0]!);
const identity = demoGateway.join(session.pin, 'S05 Student');
sessionStorage.setItem('qforge-participant',JSON.stringify(identity));
await route(`/student/session/${session.id}`);
assert.ok(container.querySelector('.student-header'));
assert.match(container.textContent!, /Đang đợi giảng viên/);
await act(async () => demoGateway.action(session.id, 'start'));
assert.equal(container.querySelectorAll('input[type="radio"]').length,4);
assert.equal(container.querySelector('.student-submit button')?.hasAttribute('disabled'),true);
await reset();

await act(async () => { root.render(<form><Button>Action</Button><Button type="submit">Submit</Button><Button disabled>Disabled</Button></form>); });
const buttons = container.querySelectorAll('button');
assert.equal(buttons[0]?.type,'button');
assert.equal(buttons[1]?.type,'submit');
assert.equal(buttons[2]?.disabled,true);
await reset();

const originalFetch = globalThis.fetch;
let rejectRequest: (error: Error) => void = () => {};
globalThis.fetch = () => new Promise<Response>((_resolve,reject) => { rejectRequest = reject; });
await act(async () => { root.render(<MemoryRouter><SetupPage /></MemoryRouter>); });
await act(async () => { container.querySelector('button')!.click(); });
assert.equal(container.querySelector('button')!.disabled,true);
assert.ok(container.querySelector('[aria-busy="true"]'));
await act(async () => rejectRequest(new Error('offline')));
assert.match(container.querySelector('[role="alert"]')!.textContent!, /Không thể kết nối API/);
globalThis.fetch = async () => new Response(JSON.stringify({success:true,data:{status:'ok',service:'qforge-api'}}),{status:200});
await act(async () => { container.querySelector('button')!.click(); });
assert.match(container.textContent!, /API sẵn sàng/);
assert.equal(container.querySelector('button')!.disabled,false);
globalThis.fetch = originalFetch;
await act(async () => root.unmount());
dom.window.close();
console.log('PASS S05: protected demo route, Teacher/Student layouts, lobby/question, empty/404, Button semantics, API loading/error/retry/success.');
