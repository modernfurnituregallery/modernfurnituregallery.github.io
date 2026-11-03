(function () {
  // Mobile menu
  var btn = document.getElementById('hamburgerBtn');
  var nav = document.getElementById('mobileNav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // "Show all photos" buttons
  document.querySelectorAll('.show-all').forEach(function (b) {
    b.addEventListener('click', function () {
      var grid = document.getElementById(b.getAttribute('aria-controls'));
      var expanded = grid.classList.toggle('expanded');
      b.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      b.textContent = expanded ? b.dataset.less : b.dataset.more;
      if (!expanded) grid.scrollIntoView({ block: 'start' });
    });
  });


  // Photo viewers: swipe/scroll track + arrows + thumbnails + counter
  document.querySelectorAll('.viewer').forEach(function (v) {
    var track = v.querySelector('.v-track');
    var slides = track.children;
    var thumbs = v.querySelectorAll('.v-thumb');
    var dots = v.querySelectorAll('.v-dots i');
    var count = v.querySelector('.v-count');
    var prev = v.querySelector('.v-prev'), next = v.querySelector('.v-next');
    var cur = 0;
    function go(i) { i = Math.max(0, Math.min(slides.length - 1, i)); track.scrollTo({ left: i * track.clientWidth }); }
    function update() {
      var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      if (i === cur && count && count.dataset.init) return;
      cur = i;
      if (count) { count.textContent = (i + 1) + ' / ' + slides.length; count.dataset.init = 1; }
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
      thumbs.forEach(function (t, n) { t.classList.toggle('on', n === i); });
      dots.forEach(function (d, n) { d.classList.toggle('on', n === i); });
      var t = thumbs[i];
      if (t) { var row = t.parentNode, l = t.offsetLeft - row.offsetLeft;
        if (l < row.scrollLeft || l + t.offsetWidth > row.scrollLeft + row.clientWidth) row.scrollTo({ left: l - row.clientWidth / 2 + t.offsetWidth / 2, behavior: 'smooth' }); }
    }
    var raf;
    track.addEventListener('scroll', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
    if (prev) prev.addEventListener('click', function () { go(cur - 1); });
    if (next) next.addEventListener('click', function () { go(cur + 1); });
    thumbs.forEach(function (t) { t.addEventListener('click', function () { go(+t.dataset.i); }); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
    });
    update();
  });

  // Lightbox
  var lb = document.getElementById('lightbox');
  if (lb) {
    var img = lb.querySelector('.lb-stage img');
    var cap = lb.querySelector('.lb-caption');
    var count = lb.querySelector('.lb-count');
    var items = [], idx = 0, lastFocus = null;

    function show(i) {
      idx = (i + items.length) % items.length;
      var it = items[idx];
      img.src = it.dataset.full;
      img.alt = it.querySelector('img').alt;
      cap.textContent = img.alt;
      count.textContent = (idx + 1) + ' / ' + items.length;
      // preload neighbours
      [idx + 1, idx - 1].forEach(function (n) {
        var x = items[(n + items.length) % items.length];
        if (x) { var p = new Image(); p.src = x.dataset.full; }
      });
    }
    function open(group, i) {
      items = Array.prototype.slice.call(document.querySelectorAll('.photo-btn[data-gallery="' + group + '"]'));
      lastFocus = document.activeElement;
      lb.classList.add('open');
      document.body.classList.add('lb-lock');
      show(i);
      lb.querySelector('.lb-close').focus();
    }
    function close() {
      lb.classList.remove('open');
      document.body.classList.remove('lb-lock');
      img.removeAttribute('src');
      var b = items[idx], tr = b && b.closest('.v-track');
      if (tr) tr.scrollTo({ left: Array.prototype.indexOf.call(tr.children, b.parentNode) * tr.clientWidth, behavior: 'auto' });
      if (lastFocus) lastFocus.focus();
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.photo-btn');
      if (!b) return;
      var group = b.dataset.gallery;
      var all = document.querySelectorAll('.photo-btn[data-gallery="' + group + '"]');
      open(group, Array.prototype.indexOf.call(all, b));
    });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.querySelector('.lb-stage').addEventListener('click', function (e) { if (e.target === this) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'Tab') {
        var f = lb.querySelectorAll('button');
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 45) show(idx + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }

  // Products page: category filter buttons
  var fbtns = document.querySelectorAll('.filter-bar [data-filter]');
  function applyFilter(cat, scroll) {
    fbtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.filter === cat ? 'true' : 'false'); });
    document.querySelectorAll('.ov-card, .product-group').forEach(function (el) {
      el.hidden = !(cat === 'all' || el.dataset.cat === cat);
    });
    if (scroll) { var o = document.querySelector('.overview'); if (o) window.scrollTo({ top: o.getBoundingClientRect().top + window.scrollY - 150 }); }
  }
  fbtns.forEach(function (b) { b.addEventListener('click', function () { applyFilter(b.dataset.filter, true); }); });
  // a link like shop.html#beds shows that collection even if a filter is on
  function showHash() {
    var id = location.hash.slice(1); var el = id && document.getElementById(id);
    if (el && el.classList.contains('product-group') && el.hidden) { applyFilter('all', false); el.scrollIntoView(); }
  }
  window.addEventListener('hashchange', showHash);
  document.querySelectorAll('.ov-card').forEach(function (a) { a.addEventListener('click', function () { applyFilter('all', false); }); });

  // Highlight current collection in the shop jump bar
  var navLinks = document.querySelectorAll('.collection-nav a');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('current'); });
        var a = map[en.target.id];
        if (a) {
          a.classList.add('current');
          var ul = a.closest('ul'); var l = a.offsetLeft - ul.offsetLeft;
          if (l < ul.scrollLeft || l + a.offsetWidth > ul.scrollLeft + ul.clientWidth) ul.scrollTo({ left: l - 16, behavior: 'smooth' });
        }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    document.querySelectorAll('.product-group').forEach(function (s) { io.observe(s); });
  }
})();
