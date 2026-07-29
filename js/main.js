/* ═══════════════════════════════════════════════════════════
   JF GENERAL REMODELING — shared behaviour
   One file for six pages. Every module bails out on its own if
   the markup it needs is not on the current page.
   ═══════════════════════════════════════════════════════════ */
(function(){
  "use strict";

  var $  = function(s, c){ return (c || document).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t){ return a + (b - a) * t; }

  /* ---------- year ---------- */
  $$("[data-year]").forEach(function(el){ el.textContent = new Date().getFullYear(); });

  /* ---------- nav: sombra ao rolar + gaveta mobile ---------- */
  (function nav(){
    var bar = $("#siteNav");
    if (bar){
      window.addEventListener("scroll", function(){
        bar.classList.toggle("is-scrolled", window.scrollY > 40);
      }, { passive: true });
    }
    var burger = $("#navBurger"), drawer = $("#navDrawer");
    if (!burger || !drawer) return;

    function setOpen(open){
      document.body.classList.toggle("nav-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
    }
    burger.addEventListener("click", function(){
      setOpen(!document.body.classList.contains("nav-open"));
    });
    /* fechar ao escolher um destino ou apertar Esc */
    $$("a", drawer).forEach(function(a){ a.addEventListener("click", function(){ setOpen(false); }); });
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) setOpen(false);
    });
    setOpen(false);
  })();

  /* ---------- reveal ao entrar na viewport ---------- */
  (function reveal(){
    var els = $$("[data-reveal]");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)){
      els.forEach(function(el){ el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      });
    }, { threshold: .15, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function(el){ io.observe(el); });
  })();

  /* ---------- SERVIÇOS: pilha sticky ---------- */
  var updateServices = (function(){
    var stack = $("#servicesStack");
    if (!stack) return null;
    var panels = $$(".service-panel", stack);
    var dotsWrap = $("#servicesDots");
    if (!panels.length) return null;

    var dots = [];
    if (dotsWrap){
      panels.forEach(function(_, i){
        var d = document.createElement("span");
        if (i === 0) d.classList.add("is-active");
        dotsWrap.appendChild(d);
      });
      dots = $$("span", dotsWrap);
    }
    if (reduceMotion){
      panels.forEach(function(p){ p.classList.add("is-active"); });
      return null;
    }
    return function(){
      var rect  = stack.getBoundingClientRect();
      var total = stack.offsetHeight - window.innerHeight;
      var p     = total > 0 ? clamp(-rect.top, 0, total) / total : 0;
      var idx   = clamp(Math.floor(p * panels.length), 0, panels.length - 1);
      panels.forEach(function(el, i){ el.classList.toggle("is-active", i === idx); });
      dots.forEach(function(d, i){ d.classList.toggle("is-active", i === idx); });
    };
  })();

  /* ---------- laço mestre de scroll ---------- */
  (function scrollLoop(){
    var jobs = [updateServices].filter(Boolean);
    if (!jobs.length) return;
    var ticking = false;
    function run(){
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function(){
        jobs.forEach(function(fn){ fn(); });
        ticking = false;
      });
    }
    window.addEventListener("scroll", run, { passive: true });
    window.addEventListener("resize", run, { passive: true });
    run();
  })();

  /* ---------- ANTES / DEPOIS ---------- */
  (function beforeAfter(){
    var slider = $("#baSlider"), before = $("#baBefore"), handle = $("#baHandle");
    if (!slider || !before || !handle) return;
    var dragging = false;

    function setPos(clientX){
      var rect = slider.getBoundingClientRect();
      var pct = clamp((clientX - rect.left) / rect.width, 0, 1) * 100;
      before.style.clipPath = "inset(0 " + (100 - pct) + "% 0 0)";
      handle.style.left = pct + "%";
      handle.setAttribute("aria-valuenow", Math.round(pct));
    }
    function point(e){ return e.touches ? e.touches[0].clientX : e.clientX; }

    slider.addEventListener("mousedown", function(e){ dragging = true; setPos(point(e)); });
    slider.addEventListener("touchstart", function(e){ dragging = true; setPos(point(e)); }, { passive: true });
    window.addEventListener("mousemove", function(e){ if (dragging) setPos(point(e)); });
    window.addEventListener("touchmove", function(e){ if (dragging) setPos(point(e)); }, { passive: true });
    window.addEventListener("mouseup", function(){ dragging = false; });
    window.addEventListener("touchend", function(){ dragging = false; });

    /* teclado: a comparação não pode depender de arrastar o mouse */
    handle.addEventListener("keydown", function(e){
      var cur = parseFloat(handle.style.left) || 52;
      var step = e.shiftKey ? 10 : 3;
      if (e.key === "ArrowLeft")  cur -= step;
      else if (e.key === "ArrowRight") cur += step;
      else if (e.key === "Home") cur = 0;
      else if (e.key === "End")  cur = 100;
      else return;
      e.preventDefault();
      var rect = slider.getBoundingClientRect();
      setPos(rect.left + (clamp(cur, 0, 100) / 100) * rect.width);
    });
  })();

  /* ---------- CARDS 3D: tilt + luz que segue o ponteiro ---------- */
  (function cards3d(){
    var cards = $$(".c3d");
    if (!cards.length) return;

    /* toque e reduced-motion recebem o card estático: todo o texto já está
       visível, o 3D é enfeite e nunca condição para ler nada */
    if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;

    var MAX_X = 6, MAX_Y = 8;

    cards.forEach(function(card){
      var inner = $(".c3d__in", card);
      if (!inner) return;
      var frame = null, rect = null;

      function apply(e){
        rect = rect || card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;
        if (frame) return;                       /* um write por quadro */
        frame = requestAnimationFrame(function(){
          frame = null;
          inner.style.setProperty("--rx", ((0.5 - y) * MAX_X * 2).toFixed(2) + "deg");
          inner.style.setProperty("--ry", ((x - 0.5) * MAX_Y * 2).toFixed(2) + "deg");
          inner.style.setProperty("--sc", "1.018");
          inner.style.setProperty("--px", (x * 100).toFixed(1) + "%");
          inner.style.setProperty("--py", (y * 100).toFixed(1) + "%");
          inner.style.setProperty("--lit", "1");
        });
      }
      function reset(){
        if (frame){ cancelAnimationFrame(frame); frame = null; }
        rect = null;
        inner.style.setProperty("--rx", "0deg");
        inner.style.setProperty("--ry", "0deg");
        inner.style.setProperty("--sc", "1");
        inner.style.setProperty("--lit", "0");
      }
      card.addEventListener("pointermove", apply, { passive: true });
      card.addEventListener("pointerleave", reset, { passive: true });
      /* o rect vira inválido quando a página rola ou muda de tamanho */
      window.addEventListener("scroll", function(){ rect = null; }, { passive: true });
      window.addEventListener("resize", function(){ rect = null; }, { passive: true });
    });
  })();

  /* ---------- BOTÕES MAGNÉTICOS ---------- */
  (function magnetic(){
    var els = $$("[data-magnetic]");
    if (!els.length || reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;
    els.forEach(function(el){
      var frame = null;
      el.addEventListener("pointermove", function(e){
        if (frame) return;
        frame = requestAnimationFrame(function(){
          frame = null;
          var r = el.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) * .22;
          var dy = (e.clientY - (r.top + r.height / 2)) * .3;
          el.classList.add("is-pulled");
          el.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
        });
      }, { passive: true });
      el.addEventListener("pointerleave", function(){
        if (frame){ cancelAnimationFrame(frame); frame = null; }
        el.classList.remove("is-pulled");
        el.style.transform = "";
      }, { passive: true });
    });
  })();

  /* ---------- TEXT REVEAL das frases ---------- */
  (function phrases(){
    var els = $$("[data-lines]");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)){
      els.forEach(function(el){ el.classList.add("is-revealed"); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        e.target.classList.add("is-revealed");
        io.unobserve(e.target);
      });
    }, { threshold: .4 });
    els.forEach(function(el){ io.observe(el); });
  })();

  /* ---------- FAQ ---------- */
  (function faq(){
    var qs = $$(".faq-q");
    if (!qs.length) return;
    qs.forEach(function(btn){
      btn.addEventListener("click", function(){
        var open = btn.getAttribute("aria-expanded") === "true";
        /* uma resposta aberta por vez mantém a lista escaneável */
        qs.forEach(function(o){ o.setAttribute("aria-expanded", "false"); });
        btn.setAttribute("aria-expanded", open ? "false" : "true");
      });
    });
  })();

  /* ---------- FORMULÁRIO DE ORÇAMENTO ---------- */
  (function quoteForm(){
    var form = $("#quoteForm");
    if (!form) return;
    var status = $("#formStatus");

    /* form.elements.namedItem, e não form.name: em HTMLFormElement `name` é
       propriedade do próprio formulário e engoliria o campo de mesmo nome. */
    function field(n){ return form.elements.namedItem(n); }
    function wrap(el){ return el ? el.closest(".field") : null; }

    function setErr(name, msg){
      var el = field(name), box = wrap(el);
      if (!box) return;
      box.classList.toggle("is-bad", !!msg);
      var slot = $(".field-err", box);
      if (slot) slot.textContent = msg || "";
    }
    function say(msg, kind){
      if (!status) return;
      status.textContent = msg;
      status.className = "form__status is-on " + kind;
    }

    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var PHONE = /[\d][\d\s().+-]{6,}/;

    form.addEventListener("submit", function(e){
      e.preventDefault();
      var v = {};
      ["name","phone","email","location","service","details","contact","consent"].forEach(function(n){
        var el = field(n);
        if (!el) return;
        v[n] = el.type === "checkbox" ? el.checked : el.value.trim();
      });

      var bad = null;
      setErr("name",""); setErr("phone",""); setErr("email",""); setErr("consent","");

      if (!v.name){ setErr("name","Please tell us your name."); bad = bad || "name"; }
      if (!v.phone || !PHONE.test(v.phone)){
        setErr("phone","Please enter a phone number we can reach you on."); bad = bad || "phone";
      }
      if (v.email && !EMAIL.test(v.email)){
        setErr("email","That email address doesn't look right."); bad = bad || "email";
      }
      if (!v.consent){ setErr("consent","Please confirm before sending."); bad = bad || "consent"; }

      if (bad){
        say("Please check the highlighted fields and try again.", "bad");
        var el = field(bad);
        if (el && el.focus) el.focus();
        return;
      }

      /* ⚠ PONTO DE INTEGRAÇÃO — não há backend. Enquanto não houver, o pedido
         vai por e-mail. Trocar este bloco por um fetch() quando existir API. */
      var subject = encodeURIComponent("Free estimate request — " + (v.service || "General Remodeling"));
      var body = encodeURIComponent(
        "Name: " + v.name +
        "\nPhone: " + v.phone +
        "\nEmail: " + (v.email || "—") +
        "\nProperty location: " + (v.location || "—") +
        "\nService needed: " + (v.service || "—") +
        "\nPreferred contact: " + (v.contact || "—") +
        "\n\nProject description:\n" + (v.details || "—")
      );
      say("Your email app is opening with the request filled in — press send there to reach us.", "ok");
      window.location.href = "mailto:[EMAIL ADDRESS]?subject=" + subject + "&body=" + body;
    });
  })();

})();
