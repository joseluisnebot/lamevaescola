// Shared social sharing component for lamevaescola.com
// Inject after result is shown in each tool page

window.mostrarCompartir = function(titolEina, urlPagina) {
  const existing = document.getElementById('share-block');
  if (existing) return; // already shown

  const url = encodeURIComponent(urlPagina || window.location.href);
  const missatge = encodeURIComponent(
    `He descobert aquesta eina gratuïta per a docents: ${titolEina} — sense registre i alineada amb LOMLOE 🎯\n${decodeURIComponent(url)}`
  );
  const missatgeTwitter = encodeURIComponent(
    `He descobert aquesta eina gratuïta per a docents: ${titolEina} 🎯 Alineada amb #LOMLOE, sense registre.`
  );

  const block = document.createElement('div');
  block.id = 'share-block';
  block.innerHTML = `
    <div style="
      margin-top: 1.5rem;
      background: #F0FAF4;
      border: 1.5px solid #B7DFC8;
      border-radius: 1rem;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    ">
      <div style="flex:1;min-width:180px">
        <div style="font-size:0.88rem;font-weight:700;color:#1B4332;margin-bottom:0.15rem">
          T'ha anat bé? Comparteix amb els teus companys 👩‍🏫
        </div>
        <div style="font-size:0.75rem;color:#6B7B6B">
          Els mestres som comunitat — comparteix les eines gratuïtes
        </div>
      </div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <a href="https://wa.me/?text=${missatge}" target="_blank" rel="noopener"
          style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 1rem;border-radius:999px;background:#25D366;color:white;font-size:0.82rem;font-weight:700;text-decoration:none;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.528 5.855L0 24l6.335-1.506A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.032-1.388l-.361-.214-3.741.890.929-3.638-.235-.374A9.807 9.807 0 012.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z"/></svg>
          WhatsApp
        </a>
        <a href="https://twitter.com/intent/tweet?text=${missatgeTwitter}&url=${url}" target="_blank" rel="noopener"
          style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 1rem;border-radius:999px;background:#000;color:white;font-size:0.82rem;font-weight:700;text-decoration:none;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          X
        </a>
        <a href="https://t.me/share/url?url=${url}&text=${missatge}" target="_blank" rel="noopener"
          style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 1rem;border-radius:999px;background:#2AABEE;color:white;font-size:0.82rem;font-weight:700;text-decoration:none;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/></svg>
          Telegram
        </a>
        <button onclick="
          navigator.clipboard.writeText(window.location.href).then(()=>{
            this.textContent='Copiat!';
            setTimeout(()=>this.textContent='Copiar enllaç',1500);
          });
        " style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 1rem;border-radius:999px;background:#F7F9F7;border:1.5px solid #DDE8DD;color:#1A1917;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:inherit;">
          🔗 Copiar enllaç
        </button>
      </div>
    </div>
  `;
  return block;
};
