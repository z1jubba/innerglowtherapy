(()=>{const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
// menu/year
const menu=$('.menu-btn'),nav=$('.site-nav');if(menu&&nav)menu.addEventListener('click',()=>{const o=nav.classList.toggle('is-open');menu.setAttribute('aria-expanded',String(o))});$$('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());
const safeStore={get:k=>{try{return sessionStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch{}},remove:k=>{try{sessionStorage.removeItem(k)}catch{}}};
// performance-aware motion / scroll build / page transition
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const cols=['#ff625b','#ff8a00','#ffc72e','#00a7b5','#ef4c89','#7947ad'];

// Scroll construction system: one lightweight SVG stroke + one transform-only brush.
const buildPath=$('#build-path'),buildShadow=$('#build-path-shadow'),storyMain=$('.story-main');
if(buildPath&&storyMain&&!reduced){
  const svg=$('.scroll-build-svg');
  const len=buildPath.getTotalLength();
  buildPath.style.strokeDasharray=String(len);
  buildPath.style.strokeDashoffset=String(len);
  let ticking=false;
  const updateBuild=()=>{
    ticking=false;
    const top=storyMain.getBoundingClientRect().top+scrollY;
    const end=top+storyMain.offsetHeight-innerHeight*.55;
    const p=Math.max(0,Math.min(1,(scrollY+innerHeight*.36-top)/Math.max(1,end-top)));
    buildPath.style.strokeDashoffset=String(len*(1-p));
  };
  const queue=()=>{if(!ticking){ticking=true;requestAnimationFrame(updateBuild)}};
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);queue();
}

// Reveal/build content only when it enters view. No continuous element wobble.
const buildTargets=$$('[data-build], .story-panel');
if('IntersectionObserver' in window&&!reduced){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('built')}),{rootMargin:'0px 0px -12% 0px',threshold:.14});
  buildTargets.forEach(el=>io.observe(el));
}else buildTargets.forEach(el=>el.classList.add('built'));

// Home jump rail highlights current painted section.
const jumpLinks=$$('.story-jump a'),storySections=$$('[data-story]');
if(jumpLinks.length&&storySections.length&&'IntersectionObserver' in window){
  const jio=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;jumpLinks.forEach(a=>a.classList.toggle('active',a.dataset.jump===e.target.dataset.story))}),{rootMargin:'-38% 0px -50% 0px',threshold:0});
  storySections.forEach(s=>jio.observe(s));
}


// Keep the home section rail useful without letting it sit over the footer.
const siteFooter=$('.site-footer');
if(siteFooter&&jumpLinks.length&&'IntersectionObserver' in window){
  const fio=new IntersectionObserver(entries=>entries.forEach(e=>document.body.classList.toggle('footer-visible',e.isIntersecting)),{threshold:.02});
  fio.observe(siteFooter);
}

// Fast single-brush page transition. Current page remains visible until the stroke fully covers it.
if(!reduced){
  const wipe=document.createElement('div');
  wipe.className='brush-transition';
  wipe.setAttribute('aria-hidden','true');
  wipe.innerHTML='<div class="brush-stroke"><i></i><i></i><i></i></div>';
  document.body.appendChild(wipe);
  const qs=()=>{try{return new URLSearchParams(location.search).get('_ig')==='1'}catch{return location.search.includes('_ig=1')}};
  const incoming=safeStore.get('ig-build-wipe')==='1'||qs();
  const cleanFlag=()=>{safeStore.remove('ig-build-wipe');try{const u=new URL(location.href);u.searchParams.delete('_ig');history.replaceState(null,'',u.href)}catch{}};
  if(incoming){
    wipe.className='brush-transition active hold';
    // Two frames guarantee the real transition layer has painted before removing the head pre-cover.
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      document.documentElement.classList.remove('ig-incoming');
      wipe.className='brush-transition active reveal';
      cleanFlag();
      setTimeout(()=>wipe.className='brush-transition',230);
    }));
  }else document.documentElement.classList.remove('ig-incoming');
  $$('a[href]').forEach(a=>a.addEventListener('click',e=>{
    const h=a.getAttribute('href');
    if(!h||h.startsWith('#')||h.startsWith('mailto:')||h.startsWith('tel:')||a.target==='_blank'||a.hasAttribute('download')||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    let u;try{u=new URL(a.href,location.href)}catch{return}
    if(u.origin!==location.origin)return;
    if(u.pathname===location.pathname&&u.hash)return;
    e.preventDefault();
    wipe.className='brush-transition active cover';
    safeStore.set('ig-build-wipe','1');
    setTimeout(()=>{
      try{u.searchParams.set('_ig','1')}catch{}
      location.href=u.href;
    },220);
  }));
}else document.documentElement.classList.remove('ig-incoming');

// Add lightweight inline social icons while retaining readable link text.
const socialSvg={
 instagram:'<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.4" cy="6.7" r="1.2" fill="currentColor"/></svg>',
 tiktok:'<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v10.1a4.3 4.3 0 1 1-3.5-4.2v2.4a1.9 1.9 0 1 0 1.1 1.8V4h2.4c.4 2.2 1.8 3.7 4 4.2v2.5c-1.6-.2-2.9-.8-4-1.7V4Z" fill="currentColor"/></svg>',
 facebook:'<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 8.2h3V5h-3c-3.1 0-5 1.9-5 5v1.8H6v3.3h3.2V22h3.7v-6.9h3.5l.6-3.3h-4.1V10c0-1.2.4-1.8 1.3-1.8Z" fill="currentColor"/></svg>',
 whatsapp:'<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2a8.3 8.3 0 0 0-7.1 12.6L4 20.9l5-1.3A8.3 8.3 0 1 0 12 3.2Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.1 8.1c.2-.4.4-.5.7-.5h.5c.2 0 .4.1.5.4l.8 1.9c.1.3.1.5-.1.7l-.6.8c-.1.2-.1.3 0 .5.5.9 1.3 1.7 2.2 2.2.2.1.4.1.5-.1l.8-.9c.2-.2.4-.2.7-.1l1.9.9c.3.1.4.3.4.5 0 .3-.2 1.2-.8 1.7-.6.6-1.5.8-2.4.6-1.3-.3-2.9-1.2-4.3-2.6-1.2-1.2-2.1-2.7-2.4-3.9-.3-.9-.1-1.6.6-2.1Z" fill="currentColor"/></svg>'
};
$$('a[href]').forEach(a=>{const h=(a.getAttribute('href')||'').toLowerCase();const k=h.includes('instagram.com')?'instagram':h.includes('tiktok.com')?'tiktok':h.includes('facebook.com')?'facebook':null;if(k&&!a.querySelector('.social-icon')){a.classList.add('social-link','social-'+k);a.insertAdjacentHTML('afterbegin',socialSvg[k])}});
// mood chooser
const moods={make:['MAKE SOMETHING','Arts & Crafts is your corner. Paint, cut, stick, draw, build or simply have a go.','activities.html#arts-crafts'],move:['HAVE A DANCE','Music on, pressure off. Dance for Fun is friendly, relaxed and made for joining in.','activities.html#dance'],chat:['MEET PEOPLE','Coffee & Chat gives you somewhere to pull up a chair, have a brew and spend time around other people.','activities.html#coffee-chat'],pause:['TAKE SOME TIME OUT','Wellbeing activities make room for calm, confidence, mindfulness and a bit of breathing space.','activities.html#wellbeing'],together:['DO SOMETHING TOGETHER','Family & Community Events bring different ages together through making, moving and shared experiences.','activities.html#community']};const mb=$$('[data-mood]'),mt=$('[data-mood-title]'),mc=$('[data-mood-copy]'),ml=$('[data-mood-link]');mb.forEach(b=>b.addEventListener('click',()=>{mb.forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');const [t,c,l]=moods[b.dataset.mood];if(mt)mt.textContent=t;if(mc)mc.textContent=c;if(ml)ml.href=l}));
// home mini canvas
const mini=$('#mini-canvas');if(mini){const c=mini.getContext('2d');let col='#ffc72e',down=false,last=null;const fit=()=>{const r=mini.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),old=document.createElement('canvas');old.width=mini.width;old.height=mini.height;old.getContext('2d').drawImage(mini,0,0);mini.width=r.width*d;mini.height=r.height*d;c.setTransform(d,0,0,d,0,0);c.lineCap='round';c.lineJoin='round';c.drawImage(old,0,0,old.width,old.height,0,0,r.width,r.height)};fit();addEventListener('resize',fit);const p=e=>{const r=mini.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};mini.addEventListener('pointerdown',e=>{down=true;last=p(e);try{mini.setPointerCapture(e.pointerId)}catch{}});mini.addEventListener('pointermove',e=>{if(!down)return;const q=p(e);c.strokeStyle=col;c.lineWidth=14;c.beginPath();c.moveTo(last.x,last.y);c.lineTo(q.x,q.y);c.stroke();last=q});mini.addEventListener('pointerup',()=>down=false);$$('[data-mini-colour]').forEach(b=>b.addEventListener('click',()=>{$$('[data-mini-colour]').forEach(x=>x.classList.remove('active'));b.classList.add('active');col=b.dataset.miniColour}))}
// contact subject + form
$$('[data-contact-subject]').forEach(a=>a.addEventListener('click',()=>safeStore.set('ig-subject',a.dataset.contactSubject||'')));const subj=$('#subject');if(subj){const wanted=new URLSearchParams(location.search).get('subject')||safeStore.get('ig-subject');if(wanted){[...subj.options].some(o=>{if(o.value.toLowerCase()===wanted.toLowerCase()){subj.value=o.value;return true}});safeStore.remove('ig-subject')}}const form=$('#contact-form');if(form)form.addEventListener('submit',e=>{e.preventDefault();const name=$('#name').value.trim(),email=$('#email').value.trim(),sub=$('#subject').value,msg=$('#message').value.trim(),status=$('.form-status');if(!name||!email||!msg){status.textContent='Please add your name, email and a message first.';return}const body=`Name: ${name}\nEmail: ${email}\nInterested in: ${sub||'General'}\n\n${msg}`;location.href=`mailto:innerglowtherapyuk@gmail.com?subject=${encodeURIComponent('Inner Glow enquiry: '+(sub||'General'))}&body=${encodeURIComponent(body)}`;status.textContent='Opening your email app…'});
// full messy desk
const dc=$('#draw-canvas');if(dc){const ctx=dc.getContext('2d'),paper=$('#canvas-paper'),guide=$('#guide-layer'),size=$('#brush-size'),sizeV=$('#brush-size-value'),guideSel=$('#guide-select'),op=$('#guide-opacity'),opV=$('#guide-opacity-value');let colour='#2b1434',brush='paint',stamp=null,drawing=false,last={x:0,y:0},history=[],future=[];let cssW=1000,cssH=700;const guides={blank:'',heart:`<svg viewBox="0 0 1000 700"><path class="guide-stroke guide-dash" d="M228 218c0-59 45-104 99-104 47 0 80 26 103 64 23-38 56-64 103-64 54 0 99 45 99 104 0 118-173 220-202 267-29-47-202-149-202-267Z"/><path class="guide-stroke" d="M180 560c93-80 212-135 351-168 120-28 202-55 285-118"/></svg>`,flower:`<svg viewBox="0 0 1000 700"><circle class="guide-stroke" cx="500" cy="295" r="52"/><path class="guide-stroke guide-dash" d="M500 160c33-80 122-94 153-16-37 28-93 48-153 16Zm0 0c-33-80-122-94-153-16 37 28 93 48 153 16Zm0 140c33 80 122 94 153 16-37-28-93-48-153-16Zm0 0c-33 80-122 94-153 16 37-28 93-48 153-16Z"/><path class="guide-stroke" d="M500 347v210M503 452c-40-17-72 11-77 50 44 12 70-6 77-50Zm0 42c42-17 74 10 78 50-44 13-72-6-78-50Z"/></svg>`,butterfly:`<svg viewBox="0 0 1000 700"><path class="guide-stroke" d="M500 190c-18 71-20 190 0 320"/><path class="guide-stroke guide-dash" d="M500 205c45-75 141-110 183-31-3 79-76 158-183 164Zm0 0c-45-75-141-110-183-31 3 79 76 158 183 164Zm0 118c45 37 118 50 169 131-23 60-104 72-169 38Zm0 0c-45 37-118 50-169 131 23 60 104 72 169 38Z"/><path class="guide-stroke" d="M485 169c-18-41-40-59-64-68M515 169c18-41 40-59 64-68"/></svg>`,star:`<svg viewBox="0 0 1000 700"><path class="guide-stroke" d="m500 118 48 134 142 4-113 86 42 135-119-81-119 81 42-135-113-86 142-4Z"/><path class="guide-stroke guide-dash" d="M190 550c65-51 121-90 211-90 76 0 130 38 196 38 80 0 133-41 204-103"/></svg>`,rainbow:`<svg viewBox="0 0 1000 700"><path class="guide-stroke" d="M160 500c12-190 169-336 361-336 192 0 349 146 361 336M218 500c10-160 143-282 303-282 160 0 293 122 303 282M278 500c9-129 118-229 243-229s234 100 243 229M338 500c8-98 92-176 183-176s175 78 183 176"/><circle class="guide-stroke" cx="202" cy="142" r="59"/><path class="guide-stroke" d="M142 565h720M160 565c32-80 100-108 164-78 44 21 75 33 120 8 50-28 90-35 142-2 42 27 82 29 130 5 54-27 106-3 145 67"/></svg>`,house:`<svg viewBox="0 0 1000 700"><path class="guide-stroke" d="m270 328 230-166 230 166"/><rect class="guide-stroke" x="315" y="325" width="370" height="260"/><rect class="guide-stroke" x="451" y="430" width="98" height="155"/><rect class="guide-stroke" x="365" y="380" width="65" height="65"/><rect class="guide-stroke" x="574" y="380" width="65" height="65"/><circle class="guide-stroke" cx="795" cy="158" r="50"/><path class="guide-stroke guide-dash" d="M170 585h660M190 585c18-78 68-116 137-103 49 9 68 33 111 13 54-26 95-31 146 3 42 28 85 29 127 0 52-35 109 4 128 87"/></svg>`,underwater:`<svg viewBox="0 0 1000 700"><path class="guide-stroke" d="M120 182c116 46 220 52 350 15 130-37 263-29 414 25M120 223c126 40 230 46 353 17 140-32 270-22 412 18"/><path class="guide-stroke" d="M275 470c0-52 47-95 105-95s105 43 105 95-47 95-105 95-105-43-105-95Zm210 0 90-62v124Zm130 34c0-39 35-70 78-70s78 31 78 70-35 70-78 70-78-31-78-70Zm156 0 75-51v102Z"/><path class="guide-stroke guide-dash" d="M140 590c75-90 155-21 186-61 21-28-11-65 29-83 62-28 75 75 140 62 46-9 47-73 98-73 58 0 68 76 130 71 43-4 51-55 102-50 32 3 45 31 69 45"/></svg>`,mandala:`<svg viewBox="0 0 1000 700"><g transform="translate(500 350)"><circle class="guide-stroke" r="50"/><circle class="guide-stroke" r="92"/><circle class="guide-stroke" r="136"/><circle class="guide-stroke" r="182"/><path class="guide-stroke" d="M0-220v440M-220 0h440M-156-156l312 312M156-156l-312 312"/><path class="guide-stroke guide-dash" d="M0-182c24-32 61-32 85 0-24 32-61 32-85 0Zm182 0c-32 24-32 61 0 85 32-24 32-61 0-85Zm0 182c-24 32-61 32-85 0 24-32 61-32 85 0Zm-182 0c32-24 32-61 0-85-32 24-32 61 0 85Z"/></g></svg>`};
const resize=()=>{const r=paper.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),snap=dc.toDataURL();cssW=r.width;cssH=r.height;dc.width=Math.round(cssW*d);dc.height=Math.round(cssH*d);ctx.setTransform(d,0,0,d,0,0);ctx.lineCap='round';ctx.lineJoin='round';const im=new Image;im.onload=()=>ctx.drawImage(im,0,0,cssW,cssH);im.src=snap};resize();addEventListener('resize',resize);
const point=e=>{const r=dc.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};const save=()=>{history.push(dc.toDataURL());if(history.length>30)history.shift();future=[]};save();const restore=url=>{ctx.clearRect(0,0,cssW,cssH);const im=new Image;im.onload=()=>ctx.drawImage(im,0,0,cssW,cssH);im.src=url};
const drawSegment=(a,b)=>{const w=+size.value;ctx.save();ctx.strokeStyle=colour;ctx.fillStyle=colour;ctx.lineCap='round';ctx.lineJoin='round';if(brush==='paint'){ctx.globalAlpha=.92;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();for(let i=0;i<2;i++){ctx.globalAlpha=.18;ctx.lineWidth=Math.max(1,w*.18);ctx.beginPath();ctx.moveTo(a.x,a.y+(i-.5)*w*.35);ctx.lineTo(b.x,b.y+(i-.5)*w*.35);ctx.stroke()}}else if(brush==='marker'){ctx.globalAlpha=.72;ctx.lineWidth=w*1.3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}else if(brush==='pencil'){ctx.globalAlpha=.65;ctx.lineWidth=Math.max(1,w*.22);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}else if(brush==='crayon'){for(let i=0;i<5;i++){ctx.globalAlpha=.28;ctx.lineWidth=Math.max(1,w*.25);const j=(Math.random()-.5)*w*.7;ctx.beginPath();ctx.moveTo(a.x,a.y+j);ctx.lineTo(b.x,b.y+j+(Math.random()-.5)*3);ctx.stroke()}}else if(brush==='chalk'){for(let i=0;i<7;i++){ctx.globalAlpha=.22;const t=Math.random();const x=a.x+(b.x-a.x)*t+(Math.random()-.5)*w,y=a.y+(b.y-a.y)*t+(Math.random()-.5)*w;ctx.beginPath();ctx.arc(x,y,Math.max(1,w*.13*Math.random()),0,Math.PI*2);ctx.fill()}}else if(brush==='eraser'){ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=1;ctx.lineWidth=w*1.8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}ctx.restore()};
const stampAt=(x,y)=>{ctx.save();ctx.fillStyle=colour;ctx.strokeStyle=colour;ctx.lineWidth=4;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${Math.max(30,+size.value*3)}px 'Segoe Print','Bradley Hand',cursive`;const map={star:'★',heart:'♥',flower:'✿',music:'♫',sun:'☀',smile:'☺'};ctx.fillText(map[stamp]||'★',x,y);ctx.restore();save()};
dc.addEventListener('pointerdown',e=>{const p=point(e);if(stamp){stampAt(p.x,p.y);return}drawing=true;last=p;try{dc.setPointerCapture(e.pointerId)}catch{}});dc.addEventListener('pointermove',e=>{if(!drawing)return;const p=point(e);drawSegment(last,p);last=p});dc.addEventListener('pointerup',()=>{if(drawing){drawing=false;save()}});dc.addEventListener('pointercancel',()=>drawing=false);
$$('[data-colour]').forEach(b=>b.addEventListener('click',()=>{$$('[data-colour]').forEach(x=>x.classList.remove('active'));b.classList.add('active');colour=b.dataset.colour;stamp=null;$$('[data-stamp]').forEach(x=>x.classList.remove('active'))}));$$('[data-brush]').forEach(b=>b.addEventListener('click',()=>{$$('[data-brush]').forEach(x=>x.classList.remove('active'));b.classList.add('active');brush=b.dataset.brush;stamp=null;$$('[data-stamp]').forEach(x=>x.classList.remove('active'))}));$$('[data-stamp]').forEach(b=>b.addEventListener('click',()=>{$$('[data-stamp]').forEach(x=>x.classList.remove('active'));b.classList.add('active');stamp=b.dataset.stamp}));size.addEventListener('input',()=>sizeV.textContent=size.value);
const setGuide=k=>{guide.innerHTML=guides[k]||''};setGuide(guideSel.value);guideSel.addEventListener('change',()=>setGuide(guideSel.value));const applyOp=()=>{guide.style.opacity=(+op.value/100);opV.textContent=op.value};applyOp();op.addEventListener('input',applyOp);$$('[data-sheet]').forEach(b=>b.addEventListener('click',()=>{guideSel.value=b.dataset.sheet;setGuide(b.dataset.sheet)}));
$('#undo-btn').addEventListener('click',()=>{if(history.length<2)return;future.push(history.pop());restore(history[history.length-1])});$('#redo-btn').addEventListener('click',()=>{if(!future.length)return;const u=future.pop();history.push(u);restore(u)});$('#clear-btn').addEventListener('click',()=>{ctx.clearRect(0,0,cssW,cssH);save()});
const exportArt=async()=>{const out=document.createElement('canvas');out.width=1000;out.height=700;const o=out.getContext('2d');o.fillStyle='#fffdf8';o.fillRect(0,0,1000,700);if(guide.innerHTML){const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700"><style>.guide-stroke{fill:none;stroke:#382341;stroke-width:7;stroke-linecap:round;stroke-linejoin:round}.guide-fill{fill:#fffdf8;stroke:#382341;stroke-width:6}</style>${guide.innerHTML.replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg>`;const im=new Image;await new Promise(r=>{im.onload=r;im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});o.globalAlpha=parseFloat(getComputedStyle(guide).opacity||'.48');o.drawImage(im,0,0,1000,700);o.globalAlpha=1}o.drawImage(dc,0,0,1000,700);return out};const download=async()=>{const out=await exportArt();const a=document.createElement('a');a.href=out.toDataURL('image/png');a.download='inner-glow-artwork.png';a.click()};$('#download-btn').addEventListener('click',download);$('#done-download').addEventListener('click',download);$('#print-btn').addEventListener('click',async()=>{const out=await exportArt();const w=open('','_blank');w.document.write(`<img src="${out.toDataURL('image/png')}" style="max-width:100%;display:block;margin:auto"><script>onload=()=>print()<\/script>`);w.document.close()});
const prompts=['Draw the happiest monster you can imagine.','Invent a flower nobody has ever seen.','Draw how your favourite song feels.','Make a picture using only three colours.','Design the world’s strangest coffee mug.','Draw somewhere that makes you feel calm.','Turn a scribble into an animal.','Draw a dance move as a shape.','Create a new planet and give it a name.','Draw something tiny next to something enormous.'];$('#prompt-btn').addEventListener('click',()=>{$('#prompt-text').textContent=prompts[Math.floor(Math.random()*prompts.length)]});const pop=$('#done-pop');$('#done-btn').addEventListener('click',()=>{pop.classList.add('show');for(let i=0;i<34;i++){const q=document.createElement('span');q.className='confetti-piece';q.style.cssText=`--x:${Math.random()*100}vw;--c:${cols[i%cols.length]};--d:${1.2+Math.random()*1.5}s;--r:${Math.random()*180}deg`;pop.appendChild(q);setTimeout(()=>q.remove(),3000)}});$('#done-close').addEventListener('click',()=>pop.classList.remove('show'));pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('show')});}
})();