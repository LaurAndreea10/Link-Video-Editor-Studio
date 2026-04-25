function createEmptyStateAddon(icon,title,body){return `<div class="empty-state micro-fade-up"><div class="empty-state-icon">${icon}</div><h4>${escapeHtml(title)}</h4><p>${escapeHtml(body)}</p></div>`;}
function applyRevealStaggerAddon(id){const el=document.getElementById(id);if(el)el.classList.add('reveal-stagger');}

const __origRenderSelectedClipVisualAddon = renderSelectedClip;
renderSelectedClip = function(){
  __origRenderSelectedClipVisualAddon();
  const clip = getSelectedClip();
  const timeline = document.getElementById('timeline');
  const slides = document.getElementById('slides');
  const shorts = document.getElementById('shorts');
  const keyframes = document.getElementById('keyframes');
  const translations = document.getElementById('translations');

  if(!clip){
    if(timeline) timeline.innerHTML = createEmptyStateAddon('🎬', state.lang==='ro'?'Niciun demo selectat':'No demo selected', state.lang==='ro'?'Generează un clip nou sau încarcă un preset pentru a vedea timeline-ul premium.':'Generate a new clip or load a preset to see the premium timeline.');
    if(slides) slides.innerHTML = createEmptyStateAddon('🧩', state.lang==='ro'?'Slide-uri negenerate':'No slides yet', state.lang==='ro'?'Slide-urile apar după prima generare.':'Slides appear after the first generation.');
    if(shorts) shorts.innerHTML = createEmptyStateAddon('📱', state.lang==='ro'?'Shorts indisponibile':'Shorts unavailable', state.lang==='ro'?'Alege o sursă și generează pentru a construi shorts.':'Choose a source and generate to build shorts.');
    if(keyframes) keyframes.innerHTML = createEmptyStateAddon('🖼️', state.lang==='ro'?'Cadre-cheie indisponibile':'Keyframes unavailable', state.lang==='ro'?'După generare vei vedea cadre-cheie și overlay-uri sugerate.':'After generation you will see keyframes and suggested overlays.');
    if(translations) translations.innerHTML = createEmptyStateAddon('🌍', state.lang==='ro'?'Traduceri indisponibile':'Translations unavailable', state.lang==='ro'?'Activează limbile dorite și generează un plan.':'Enable languages and generate a plan.');
  }

  ['clipList','timeline','slides','shorts','keyframes','translations'].forEach(applyRevealStaggerAddon);
  document.querySelectorAll('.clip-card,.shot,.slide,.short-card,.frame-card,.translation-card,.stat,.section,.tab').forEach((node)=>node.classList.add('micro-fade-up'));
};

const __origRenderClipListVisualAddon = renderClipList;
renderClipList = function(){
  __origRenderClipListVisualAddon();
  const clipList = document.getElementById('clipList');
  if(clipList && !state.clips.length){
    clipList.innerHTML = createEmptyStateAddon('✨', state.lang==='ro'?'Workspace curat':'Clean workspace', state.lang==='ro'?'Adaugă un URL, un video link sau un fișier pentru a construi primul demo product-grade.':'Add a URL, video link or file to build the first product-grade demo.');
  }
  applyRevealStaggerAddon('clipList');
};

const __origRenderAllVisualAddon = renderAll;
renderAll = function(){
  __origRenderAllVisualAddon();
  document.querySelectorAll('.section,.panel,.stat').forEach((el)=>el.classList.add('micro-fade-up'));
};
