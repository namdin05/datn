import { useEffect, useRef, useState } from 'react';


const steps = [
  { icon: '✦', title: 'Tạo câu hỏi', text: 'Biến kiến thức thành những câu hỏi thú vị.', label: '01 · CHUẨN BỊ' },
  { icon: '⌘', title: 'Kết nối lớp học', text: 'Một mã PIN. Cả lớp cùng tham gia.', label: '02 · THAM GIA' },
  { icon: '↗', title: 'Khám phá kết quả', text: 'Nhìn lại câu trả lời và tiến bộ của lớp.', label: '03 · KHÁM PHÁ' },
];

export function LandingPage() {
  const [selected, setSelected] = useState(0);
  const scene = useRef<HTMLDivElement>(null);
  const cards = useRef<Array<HTMLDivElement | null>>([]);
  const hovered = useRef(false);
  const focused = useRef(false);
  useEffect(() => {
    if (!scene.current) return;
    const container = scene.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let previous = 0;
    const phases = steps.map((_, index) => -Math.PI / 2 + index * Math.PI * 2 / steps.length);
    let orbitAngle = -Math.PI / 2;
    const returning = steps.map(() => false);
    let drag: { id: number; index: number; pointerAngle: number; startX: number; startY: number; moved: boolean } | null = null;
    let suppressClick = false;
    let width = container.clientWidth;
    let height = container.clientHeight;
    const resize = new ResizeObserver(() => { width = container.clientWidth; height = container.clientHeight; });
    resize.observe(container);
    function pointerAngle(event: PointerEvent, index: number) {
      const bounds = container.getBoundingClientRect();
      const radiusX = Math.max(1, width / 2 - (cards.current[index]?.offsetWidth ?? 200) * .54 - 8);
      return Math.atan2((event.clientY - bounds.top - height * .46) / (height * .30), (event.clientX - bounds.left - width / 2) / radiusX);
    }
    function pointerDown(event: PointerEvent) {
      if (!event.isPrimary || event.button !== 0) return;
      const index = cards.current.findIndex(card => card?.contains(event.target as Node));
      if (index < 0) return;
      returning[index] = false;
      suppressClick = false;
      drag = { id: event.pointerId, index, pointerAngle: pointerAngle(event, index), startX: event.clientX, startY: event.clientY, moved: false };
    }
    function pointerMove(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
      if (!drag.moved) { drag.moved = true; container.setPointerCapture(event.pointerId); container.classList.add('is-dragging'); }
      const nextAngle = pointerAngle(event, drag.index);
      const difference = nextAngle - drag.pointerAngle;
      phases[drag.index] = (phases[drag.index] ?? 0) + Math.atan2(Math.sin(difference), Math.cos(difference));
      drag.pointerAngle = nextAngle;
    }
    function pointerUp(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id) return;
      suppressClick = drag.moved;
      if (drag.moved) returning[drag.index] = true;
      drag = null;
      container.classList.remove('is-dragging');
      if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId);
      hovered.current = false;
    }
    function click(event: MouseEvent) { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } }
    container.addEventListener('pointerdown', pointerDown);
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);
    window.addEventListener('pointercancel', pointerUp);
    container.addEventListener('click', click, true);
    function draw(now: number) {
      const delta = previous ? Math.min((now - previous) / 1000, .05) : 0;
      previous = now;
      const advance = !motion.matches && !drag && !hovered.current && !focused.current ? delta * Math.PI * 2 / 72 : 0;
      orbitAngle += advance;
      phases.forEach((phase, index) => {
        if (drag?.index === index) return;
        const target = orbitAngle + index * Math.PI * 2 / steps.length;
        if (!returning[index]) { phases[index] = phase + advance; return; }
        const difference = target - (phase + advance);
        const offset = Math.atan2(Math.sin(difference), Math.cos(difference));
        // Follow the moving formation; ease out as the card reaches its place.
        phases[index] = motion.matches ? target : phase + advance + offset * (1 - Math.exp(-delta * 1.6));
        if (motion.matches || Math.abs(offset) < .003) { phases[index] = target; returning[index] = false; }
      });
      cards.current.forEach((card, index) => {
        if (!card) return;
        const phase = phases[index] ?? 0;
        const depth = Math.sin(phase);
        const scale = .9 + (depth + 1) * .08;
        const radiusX = Math.max(0, width / 2 - card.offsetWidth * .54 - 8);
        const radiusY = height * .30;
        card.style.transform = `translate(-50%, -50%) translate(${Math.cos(phase) * radiusX}px, ${depth * radiusY}px) scale(${scale})`;
        card.style.zIndex = depth > -.15 ? '3' : '1';
        card.style.opacity = String(.78 + (depth + 1) * .11);
      });
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame); resize.disconnect();
      container.removeEventListener('pointerdown', pointerDown);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerUp);
      window.removeEventListener('pointercancel', pointerUp);
      container.removeEventListener('click', click, true);
    };
  }, []);
  return <div className="qf-landing">
    <header className="qf-nav"><a className="qf-logo" href="/" aria-label="QForge trang chủ"><span>Q</span>QForge<span className="qf-logo-dot">.</span></a><nav aria-label="Điều hướng chính"><a href="#experience">Khám phá</a><a href="/preview/join">Tham gia phòng</a><a className="qf-nav-cta" href="/preview/login">Giảng viên <span>↗</span></a></nav></header>
    <main id="main-content">
      <section className="qf-hero" aria-labelledby="qf-title">
        <div className="qf-hero-copy"><div className="qf-kicker"><span/> MỖI CÂU HỎI, MỘT KẾT NỐI</div><h1 id="qf-title">Đánh thức<br/>sự tò mò.<br/><em>Kết nối cả lớp.</em></h1><p>Mang năng lượng mới vào giờ học với những câu hỏi tương tác. Cùng tham gia, cùng thử sức và cùng tiến bộ.</p><div className="qf-actions"><a className="qf-primary" href="/preview/join">Tham gia bằng mã PIN <span>↗</span></a><a className="qf-secondary" href="/preview/login">Không gian giảng viên <span>→</span></a></div><div className="qf-note"><span className="qf-note-icon">✓</span> Học viên tham gia bằng PIN, không cần tài khoản</div></div>
        <div ref={scene} className="qf-universe" aria-label="Hành trình lớp học tương tác">
          <div className="qf-dust" aria-hidden="true"/><div className="qf-ring qf-ring-one" aria-hidden="true"/><div className="qf-ring qf-ring-two" aria-hidden="true"/><div className="qf-ring qf-ring-three" aria-hidden="true"/>
          <div className="qf-core"><span className="qf-core-small">THE LEARNING CORE</span><strong>Q<span>✦</span></strong><span>Ý tưởng bắt đầu từ bạn</span></div>
          {steps.map((step, index) => <div ref={node => { cards.current[index] = node; }} className={`qf-orbit qf-orbit-${index}`} key={step.title} onPointerEnter={() => { hovered.current = true; }} onPointerLeave={() => { hovered.current = false; }} onPointerCancel={() => { hovered.current = false; }}><button type="button" className={`qf-satellite ${selected===index?'is-selected':''}`} onFocus={event => { focused.current = event.currentTarget.matches(':focus-visible'); }} onBlur={() => { focused.current = false; }} onClick={()=>setSelected(index)} aria-pressed={selected===index}><span className="qf-satellite-icon">{step.icon}</span><span><small>{step.label}</small><strong>{step.title}</strong></span><span className="qf-satellite-arrow">↗</span></button></div>)}
          <div className="qf-scene-caption" aria-live="polite"><span>0{selected+1} / 03</span><p>{steps[selected]?.text}</p><small>Kéo các thẻ để xoay khám phá</small></div>
        </div>
      </section>
      <section className="qf-experience" id="experience" aria-labelledby="qf-experience-title"><div className="qf-section-intro"><span>ÍT THAO TÁC. NHIỀU TƯƠNG TÁC.</span><h2 id="qf-experience-title">Một nhịp học, cả lớp cùng hòa.</h2></div><div className="qf-features">{steps.map((step,index)=><article key={step.title}><div className="qf-feature-top"><span>{step.icon}</span><small>0{index+1}</small></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section>
    </main><footer className="qf-footer"><span>QForge · Kết nối tri thức qua từng câu hỏi.</span><a href="/teacher/quizzes">Xem dữ liệu từ DB ↗</a><a href="/preview/join">Bắt đầu cùng lớp của bạn ↗</a></footer>
  </div>;
}
