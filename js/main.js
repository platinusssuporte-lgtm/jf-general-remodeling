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

  /* ---------- HERO: expansão controlada pelo scroll ---------- */
  var updateHero = (function(){
    var hero  = $("#hero");
    var media = $("#heroMedia");
    var title = $("#heroTitle");
    if (!hero || !media || !title) return null;

    var titleSpans   = $$("span", title);
    var checklist    = $("#heroChecklist");
    var checkItems   = checklist ? $$("li", checklist) : [];
    var institution  = $("#heroInstitutional");
    var scrollCue    = $(".hero-scroll-cue");
    var mediaScan    = $(".media-scan");
    var plateBefore  = $(".plate-before");
    var plateDuring  = $(".plate-during");
    var plateAfter   = $(".plate-after");

    var MIN_W = 52, MAX_W = 100;
    var MIN_H = 56, MAX_H = 100;
    var MIN_R = 26, MAX_R = 0;

    /* no reduced-motion o hero é estático: mostra o estado final e sai */
    if (reduceMotion){
      titleSpans.forEach(function(s, i){ s.classList.toggle("active", i === 0); });
      if (checklist) checklist.classList.add("is-visible");
      checkItems.forEach(function(li){ li.classList.add("show"); });
      if (institution) institution.classList.add("is-visible");
      if (plateAfter) plateAfter.style.opacity = 1;
      return null;
    }

    return function(){
      var rect  = hero.getBoundingClientRect();
      var total = hero.offsetHeight - window.innerHeight;
      var p     = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;

      media.style.width  = lerp(MIN_W, MAX_W, p) + "vw";
      media.style.height = lerp(MIN_H, MAX_H, p) + "vh";
      media.style.borderRadius = lerp(MIN_R, MAX_R, p) + "px";

      if (mediaScan){
        mediaScan.style.transform = "translateX(" + lerp(-120, 120, clamp(p * 2.2, 0, 1)) + "%)";
      }
      if (plateBefore && plateDuring && plateAfter){
        plateBefore.style.opacity = 1 - clamp(p / .4, 0, 1);
        plateDuring.style.opacity = 1 - Math.abs(p - .55) / .35;
        plateAfter.style.opacity  = clamp((p - .65) / .35, 0, 1);
      }

      var idx = Math.min(titleSpans.length - 1, Math.floor(p * titleSpans.length));
      titleSpans.forEach(function(s, i){ s.classList.toggle("active", i === idx); });

      if (checklist){
        var clP = clamp((p - .1) / .45, 0, 1);
        checklist.classList.toggle("is-visible", clP > .02 && p < .92);
        var show = Math.round(clP * checkItems.length);
        checkItems.forEach(function(li, i){ li.classList.toggle("show", i < show); });
      }
      if (institution) institution.classList.toggle("is-visible", p > .68 && p < .96);
      if (scrollCue) scrollCue.style.opacity = p > .05 ? 0 : 1;
    };
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
    var jobs = [updateHero, updateServices].filter(Boolean);
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

  /* ---------- CARDS 3D ---------- */
  (function tilt(){
    var cards = $$(".tilt-card");
    if (!cards.length) return;
    if (!window.matchMedia("(pointer: fine)").matches || reduceMotion) return;
    var MAX = 10;
    cards.forEach(function(card){
      card.addEventListener("mousemove", function(e){
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        card.style.transform = "perspective(1200px) rotateX(" + ((.5 - y) * MAX * 2) +
                               "deg) rotateY(" + ((x - .5) * MAX * 2) + "deg)";
        card.style.setProperty("--mx", (x * 100) + "%");
        card.style.setProperty("--my", (y * 100) + "%");
      });
      card.addEventListener("mouseleave", function(){
        card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
      });
    });
  })();

  /* ---------- FORMULÁRIO (sem backend: monta um e-mail) ---------- */
  (function quoteForm(){
    var form = $("#quoteForm");
    if (!form) return;
    var status = $("#formStatus");

    /* form.elements.namedItem, e não form.name: em HTMLFormElement `name` é
       propriedade do próprio formulário e engoliria o campo de mesmo nome. */
    var field = function(n){ return form.elements.namedItem(n); };

    form.addEventListener("submit", function(e){
      e.preventDefault();
      var name    = field("name").value.trim();
      var contact = field("contact").value.trim();
      var service = field("service").value;
      var message = field("message").value.trim();

      if (!name || !contact){
        if (status){
          status.textContent = "Please fill in your name and how we can reach you.";
          status.style.color = "#e08b6a";
        }
        return;
      }
      var subject = encodeURIComponent("Free estimate — " + service + " — " + name);
      var body = encodeURIComponent(
        "Name: " + name + "\nContact: " + contact + "\nService: " + service +
        "\n\nProject details:\n" + message
      );
      if (status){
        status.textContent = "Opening your email app with the request ready to send.";
        status.style.color = "";
      }
      window.location.href = "mailto:info@jfgeneralremodeling.com?subject=" + subject + "&body=" + body;
    });
  })();

})();
