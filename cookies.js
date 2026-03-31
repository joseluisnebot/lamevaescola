// Cookie consent banner — lamevaescola.com
// No tracking cookies used. Banner just informs and records acceptance.

(function() {
  if (localStorage.getItem('cookies_ok')) return;

  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.innerHTML = `
    <div style="
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
      background: #1B4332; color: white;
      padding: 1rem 1.5rem;
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap;
      font-family: Inter, system-ui, sans-serif;
      font-size: 0.82rem; line-height: 1.5;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.2);
    ">
      <span style="flex:1;min-width:240px">
        🍪 Fem servir únicament cookies tècniques necessàries. No fem seguiment ni analítiques.
        <a href="/privacitat.html" style="color:#86EFAC;text-decoration:underline">Política de privacitat</a>
      </span>
      <div style="display:flex;gap:0.5rem;flex-shrink:0">
        <button onclick="
          localStorage.setItem('cookies_ok','1');
          document.getElementById('cookie-banner').remove();
        " style="
          background:#2D6A4F;color:white;border:1.5px solid #86EFAC;
          padding:0.5rem 1.25rem;border-radius:999px;
          font-size:0.82rem;font-weight:700;cursor:pointer;font-family:inherit;
        ">Acceptar</button>
        <a href="/privacitat.html" style="
          background:transparent;color:#86EFAC;border:1.5px solid #86EFAC;
          padding:0.5rem 1.25rem;border-radius:999px;
          font-size:0.82rem;font-weight:700;cursor:pointer;text-decoration:none;
          display:inline-flex;align-items:center;
        ">Més info</a>
      </div>
    </div>
  `;
  document.body.appendChild(banner);
})();
