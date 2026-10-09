import { useState } from 'react';


const steps = [
  { icon: '✦', title: 'Tạo câu hỏi', text: 'Biến kiến thức thành những câu hỏi thú vị.', label: '01 · CHUẨN BỊ' },
  { icon: '⌘', title: 'Kết nối lớp học', text: 'Một mã PIN. Cả lớp cùng tham gia.', label: '02 · THAM GIA' },
  { icon: '↗', title: 'Khám phá kết quả', text: 'Nhìn lại câu trả lời và tiến bộ của lớp.', label: '03 · KHÁM PHÁ' },
];

export function LandingPage() {
  const [selected, setSelected] = useState(0);
  return <div className="qf-landing">
    <header className="qf-nav"><a className="qf-logo" href="/" aria-label="QForge trang chủ"><span>Q</span>QForge<span className="qf-logo-dot">.</span></a><nav aria-label="Điều hướng chính"><a href="#experience">Khám phá</a><a href="/preview/join">Tham gia phòng</a><a className="qf-nav-cta" href="/preview/login">Giảng viên <span>↗</span></a></nav></header>
    <main id="main-content">
      <section className="qf-hero" aria-labelledby="qf-title">
        <div className="qf-hero-copy"><div className="qf-kicker"><span/> MỖI CÂU HỎI, MỘT KẾT NỐI</div><h1 id="qf-title">Đánh thức<br/>sự tò mò.<br/><em>Kết nối cả lớp.</em></h1><p>Mang năng lượng mới vào giờ học với những câu hỏi tương tác. Cùng tham gia, cùng thử sức và cùng tiến bộ.</p><div className="qf-actions"><a className="qf-primary" href="/preview/join">Tham gia bằng mã PIN <span>↗</span></a><a className="qf-secondary" href="/preview/login">Không gian giảng viên <span>→</span></a></div><div className="qf-note"><span className="qf-note-icon">✓</span> Học viên tham gia bằng PIN, không cần tài khoản</div></div>
        <div className="qf-universe" aria-label="Hành trình lớp học tương tác">
          <div className="qf-dust" aria-hidden="true"/><div className="qf-ring qf-ring-one" aria-hidden="true"/><div className="qf-ring qf-ring-two" aria-hidden="true"/><div className="qf-ring qf-ring-three" aria-hidden="true"/>
          <div className="qf-core"><span className="qf-core-small">THE LEARNING CORE</span><strong>Q<span>✦</span></strong><span>Ý tưởng bắt đầu từ bạn</span></div>
          {steps.map((step, index) => <div className={`qf-orbit qf-orbit-${index}`} key={step.title}><button type="button" className={`qf-satellite ${selected===index?'is-selected':''}`} onClick={()=>setSelected(index)} aria-pressed={selected===index}><span className="qf-satellite-icon">{step.icon}</span><span><small>{step.label}</small><strong>{step.title}</strong></span><span className="qf-satellite-arrow">↗</span></button></div>)}
          <div className="qf-scene-caption" aria-live="polite"><span>0{selected+1} / 03</span><p>{steps[selected]?.text}</p></div>
        </div>
      </section>
      <section className="qf-experience" id="experience" aria-labelledby="qf-experience-title"><div className="qf-section-intro"><span>ÍT THAO TÁC. NHIỀU TƯƠNG TÁC.</span><h2 id="qf-experience-title">Một nhịp học, cả lớp cùng hòa.</h2></div><div className="qf-features">{steps.map((step,index)=><article key={step.title}><div className="qf-feature-top"><span>{step.icon}</span><small>0{index+1}</small></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section>
    </main><footer className="qf-footer"><span>QForge · Kết nối tri thức qua từng câu hỏi.</span><a href="/teacher/quizzes">Xem dữ liệu từ DB ↗</a><a href="/preview/join">Bắt đầu cùng lớp của bạn ↗</a></footer>
  </div>;
}
