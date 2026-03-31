// Botó descarregar PDF — afegir styles d'impressió i botó
(function() {
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      nav, .form-card, .card:not(.result-card), .btn-submit, .loader,
      .share-bar, .btn-pdf-wrap, footer, .error-box { display: none !important; }
      .result-card { display: block !important; }
      body { background: white !important; }
      .result-card { box-shadow: none !important; border: none !important; }
    }
  `;
  document.head.appendChild(style);

  function addPdfButton() {
    const resultCard = document.querySelector('.result-card');
    if (!resultCard || resultCard.querySelector('.btn-pdf-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'btn-pdf-wrap';
    wrap.style.cssText = 'margin-top:1rem;display:flex;gap:0.75rem;flex-wrap:wrap;';
    wrap.innerHTML = `<button onclick="window.print()" style="background:#2D6A4F;color:#fff;border:none;border-radius:0.6rem;padding:0.6rem 1.2rem;font-size:0.88rem;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:0.4rem;">⬇ Descarregar PDF</button>`;
    resultCard.appendChild(wrap);
  }

  // Observar quan apareix el result-card
  const observer = new MutationObserver(() => {
    const rc = document.querySelector('.result-card.active');
    if (rc) addPdfButton();
  });
  observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
})();
