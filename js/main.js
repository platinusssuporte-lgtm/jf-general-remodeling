(function(){
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.innerWidth < 980;
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- NAV ---------- */
  var nav = document.getElementById("siteNav");
  var burger = document.getElementById("navBurger");
  window.addEventListener("scroll", function(){
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  }, { passive: true });
  burger.addEventListener("click", function(){
    document.body.classList.toggle("nav-open");
    var open = document.body.classList.contains("nav-open");
    var links = document.querySelector(".nav-links");
    links.style.display = open ? "flex" : "";
  });

  /* ---------- generic reveal on scroll ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting) e.target.classList.add("is-visible");
    });
  }, { threshold: .18 });
  revealEls.forEach(function(el){ io.observe(el); });

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t){ return a + (b - a) * t; }

  /* ---------- HERO SCROLL EXPANSION ---------- */
  var hero = document.getElementById("hero");
  var heroMedia = document.getElementById("heroMedia");
  var heroTitle = document.getElementById("heroTitle");
  var titleSpans = heroTitle.querySelectorAll("span");
  var checklist = document.getElementById("heroChecklist");
  var checklistItems = checklist.querySelectorAll("li");
  var institutional = document.getElementById("heroInstitutional");
  var scrollCue = document.querySelector(".hero-scroll-cue");
  var mediaScan = document.querySelector(".media-scan");
  var platesBefore = document.querySelector(".plate-before");
  var platesDuring = document.querySelector(".plate-during");
  var platesAfter = document.querySelector(".plate-after");

  var MIN_W = 52, MAX_W = 100;   // vw
  var MIN_H = 56, MAX_H = 100;   // vh
  var MIN_R = 26, MAX_R = 0;     // border-radius px

  function updateHero(){
    var rect = hero.getBoundingClientRect();
    var total = hero.offsetHeight - window.innerHeight;
    var scrolled = -rect.top;
    var p = clamp(scrolled / total, 0, 1);

    var w = lerp(MIN_W, MAX_W, p);
    var h = lerp(MIN_H, MAX_H, p);
    var r = lerp(MIN_R, MAX_R, p);
    heroMedia.style.width = w + "vw";
    heroMedia.style.height = h + "vh";
    heroMedia.style.borderRadius = r + "px";

    if (mediaScan){
      var scanX = lerp(-120, 120, clamp(p * 2.2, 0, 1));
      mediaScan.style.transform = "translateX(" + scanX + "%)";
    }
    if (platesBefore && platesDuring && platesAfter){
      platesBefore.style.opacity = 1 - clamp(p / .4, 0, 1);
      platesDuring.style.opacity = 1 - Math.abs(p - .55) / .35;
      platesAfter.style.opacity = clamp((p - .65) / .35, 0, 1);
    }

    // title crossfade across 5 bands
    var bands = titleSpans.length;
    var idx = Math.min(bands - 1, Math.floor(p * bands));
    titleSpans.forEach(function(s, i){ s.classList.toggle("active", i === idx); });

    // checklist reveal (band 0.12 - 0.55)
    var clStart = .1, clEnd = .55;
    var clP = clamp((p - clStart) / (clEnd - clStart), 0, 1);
    checklist.classList.toggle("is-visible", clP > 0.02 && p < .92);
    var showCount = Math.round(clP * checklistItems.length);
    checklistItems.forEach(function(li, i){ li.classList.toggle("show", i < showCount); });

    // institutional text near end of expansion
    institutional.classList.toggle("is-visible", p > .68 && p < .96);

    // scroll cue fade
    scrollCue.style.opacity = p > .05 ? 0 : 1;
  }

  /* ---------- SERVICES STICKY STACK ---------- */
  var servicesStack = document.getElementById("servicesStack");
  var servicePanels = servicesStack ? servicesStack.querySelectorAll(".service-panel") : [];
  var dotsWrap = document.getElementById("servicesDots");
  servicePanels.forEach(function(_, i){
    var d = document.createElement("span");
    if (i === 0) d.classList.add("is-active");
    dotsWrap.appendChild(d);
  });
  var serviceDots = dotsWrap.querySelectorAll("span");

  function updateServices(){
    if (!servicePanels.length) return;
    var rect = servicesStack.getBoundingClientRect();
    var total = servicesStack.offsetHeight - window.innerHeight;
    var scrolled = clamp(-rect.top, 0, total);
    var p = total > 0 ? scrolled / total : 0;
    var count = servicePanels.length;
    var idx = clamp(Math.floor(p * count), 0, count - 1);

    servicePanels.forEach(function(panel, i){
      panel.classList.toggle("is-active", i === idx);
    });
    serviceDots.forEach(function(d, i){ d.classList.toggle("is-active", i === idx); });
  }

  /* ---------- GALLERY PINNED FADE ---------- */
  var galleryWrap = document.querySelector(".gallery");
  var gallerySticky = document.querySelector(".gallery-sticky");
  var gallerySlides = document.querySelectorAll(".gallery-slide");
  var galleryDotsWrap = document.getElementById("galleryDots");
  gallerySlides.forEach(function(_, i){
    var d = document.createElement("span");
    if (i === 0) d.classList.add("is-active");
    galleryDotsWrap.appendChild(d);
  });
  var galleryDots = galleryDotsWrap.querySelectorAll("span");

  function updateGallery(){
    if (!galleryWrap) return;
    var rect = galleryWrap.getBoundingClientRect();
    var total = galleryWrap.offsetHeight - window.innerHeight;
    var scrolled = clamp(-rect.top, 0, total);
    var p = total > 0 ? scrolled / total : 0;
    var count = gallerySlides.length;
    var idx = clamp(Math.floor(p * count), 0, count - 1);

    gallerySlides.forEach(function(s, i){ s.classList.toggle("is-active", i === idx); });
    galleryDots.forEach(function(d, i){ d.classList.toggle("is-active", i === idx); });
  }

  /* ---------- MASTER SCROLL LOOP (rAF throttled) ---------- */
  var ticking = false;
  function onScroll(){
    if (!ticking){
      window.requestAnimationFrame(function(){
        updateHero();
        updateServices();
        updateGallery();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ---------- BEFORE / AFTER SLIDER ---------- */
  var baSlider = document.getElementById("baSlider");
  var baBefore = document.getElementById("baBefore");
  var baHandle = document.getElementById("baHandle");
  var dragging = false;

  function setBaPos(clientX){
    var rect = baSlider.getBoundingClientRect();
    var pct = clamp((clientX - rect.left) / rect.width, 0, 1) * 100;
    baBefore.style.clipPath = "inset(0 " + (100 - pct) + "% 0 0)";
    baHandle.style.left = pct + "%";
  }
  function startDrag(e){ dragging = true; setBaPos((e.touches ? e.touches[0].clientX : e.clientX)); }
  function moveDrag(e){ if (!dragging) return; setBaPos((e.touches ? e.touches[0].clientX : e.clientX)); }
  function endDrag(){ dragging = false; }

  baSlider.addEventListener("mousedown", startDrag);
  window.addEventListener("mousemove", moveDrag);
  window.addEventListener("mouseup", endDrag);
  baSlider.addEventListener("touchstart", startDrag, { passive: true });
  window.addEventListener("touchmove", moveDrag, { passive: true });
  window.addEventListener("touchend", endDrag);

  /* ---------- 3D TILT CARDS ---------- */
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  if (finePointer && !reduceMotion){
    var tiltCards = document.querySelectorAll(".tilt-card");
    var MAX_TILT = 10;
    tiltCards.forEach(function(card){
      card.addEventListener("mousemove", function(e){
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;
        var rotY = (x - .5) * MAX_TILT * 2;
        var rotX = (.5 - y) * MAX_TILT * 2;
        card.style.transform = "perspective(1200px) rotateX(" + rotX + "deg) rotateY(" + rotY + "deg)";
        card.style.setProperty("--mx", (x * 100) + "%");
        card.style.setProperty("--my", (y * 100) + "%");
      });
      card.addEventListener("mouseleave", function(){
        card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
      });
    });
  }

  /* ---------- CONTACT FORM (mailto fallback, no backend) ---------- */
  var form = document.getElementById("quoteForm");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var nome = form.nome.value.trim();
    var contato = form.contato.value.trim();
    var servico = form.servico.value;
    var mensagem = form.mensagem.value.trim();
    var subject = encodeURIComponent("Orçamento — " + servico + " — " + nome);
    var body = encodeURIComponent(
      "Nome: " + nome + "\nContato: " + contato + "\nServiço: " + servico + "\n\nMensagem:\n" + mensagem
    );
    window.location.href = "mailto:info@jfgeneralremodeling.com?subject=" + subject + "&body=" + body;
  });

})();
