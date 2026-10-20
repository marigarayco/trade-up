/* Trade Up — interacciones del sitio. Sin dependencias. */
(function () {
	'use strict';

	var $ = function (s, c) { return (c || document).querySelector(s); };
	var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
	var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* ---------- Menú móvil (dialog modal: foco atrapado + Esc nativo) ---------- */
	var drawer = $('#drawer'), openBtn = $('#menuOpen'), closeBtn = $('#menuClose');
	if (drawer && openBtn && typeof drawer.showModal === 'function') {
		openBtn.addEventListener('click', function () { drawer.showModal(); });
		closeBtn.addEventListener('click', function () { drawer.close(); });
		drawer.addEventListener('click', function (e) { if (e.target === drawer) { drawer.close(); } });
		$$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { drawer.close(); }); });
	}

	/* ---------- FAQ: una sola pregunta abierta (respaldo para navegadores sin <details name>) ---------- */
	$$('.faq details').forEach(function (d) {
		d.addEventListener('toggle', function () {
			if (!d.open) { return; }
			$$('.faq details[open]').forEach(function (o) { if (o !== d) { o.open = false; } });
		});
	});

	/* ---------- Volver arriba ---------- */
	var toTop = $('#toTop');
	if (toTop) {
		toTop.addEventListener('click', function () {
			window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
			var m = $('#main'); if (m) { m.focus({ preventScroll: true }); }
		});
	}

	/* ---------- Servicios: las tarjetas tapadas retroceden ---------- */
	var cards = $$('.svc-panel');
	function depth() {
		if (!cards.length) { return; }
		var stuck = cards.map(function (c) {
			return c.getBoundingClientRect().top <= parseFloat(getComputedStyle(c).top) + 1;
		});
		cards.forEach(function (c, i) {
			c.style.setProperty('--k', stuck.slice(i + 1).filter(Boolean).length);
		});
	}

	/* ---------- Indicador de sección activa (Cómo trabajamos) en el menú ---------- */
	var svc = $('#servicios');
	var svcLinks = $$('.nav-main a, #drawer nav a').filter(function (a) {
		return /#servicios$/.test(a.getAttribute('href') || '');
	});
	function spy() {
		if (!svc || !svcLinks.length) { return; }
		var y = window.innerHeight * 0.4, r = svc.getBoundingClientRect();
		var on = r.top < y && r.bottom > y;
		svcLinks.forEach(function (a) {
			if (on) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
		});
	}

	/* ---------- Línea de tiempo ---------- */
	var tl = $$('.tl'), vtl = $('#vtl'), fill = $('#vtlFill');
	if (tl.length) {
		if ('IntersectionObserver' in window && !reduce) {
			var io = new IntersectionObserver(function (es) {
				es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
			}, { rootMargin: '0px 0px -20% 0px' });
			tl.forEach(function (t) { io.observe(t); });
		} else {
			tl.forEach(function (t) { t.classList.add('in'); });
		}
	}
	function progress() {
		if (!vtl || !fill) { return; }
		var r = vtl.getBoundingClientRect();
		if (!r.height) { return; }
		var p = Math.min(Math.max((window.innerHeight * 0.6 - r.top) / r.height, 0), 1);
		var fh = p * (r.height - 16);
		fill.style.height = fh + 'px';
		tl.forEach(function (t) { t.classList.toggle('hit', t.getBoundingClientRect().top - r.top <= fh); });
	}

	var header = $('.site-header');

	/* ---------- Header sobre el home: texto claro u oscuro según lo que hay debajo ---------- */
	function isDark(el) {
		for (; el && el.nodeType === 1; el = el.parentElement) {
			var d = el.getAttribute('data-header');
			if (d) { return d === 'dark'; }
			var m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
			if (m && (m.length < 4 || parseFloat(m[3]) > 0.5)) {
				var c = m.slice(0, 3).map(function (v) { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
				return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) < 0.4;
			}
		}
		return false;
	}
	function headerTone() {
		if (!header || !document.body.classList.contains('home')) { return; }
		var r = header.getBoundingClientRect();
		var under = document.elementsFromPoint(window.innerWidth / 2, r.top + r.height / 2).filter(function (e) { return !header.contains(e); })[0];
		var first = $('.svc-inner'), sec = $('#servicios'), hh = r.height;
		var onSvc = !!first && !!sec && first.getBoundingClientRect().top <= hh + 1 && sec.getBoundingClientRect().bottom > hh;
		header.classList.toggle('on-svc', onSvc);
		header.classList.toggle('on-light', onSvc || (!!under && !isDark(under)));
	}
	/* ---------- Header sube junto con el final de Preguntas frecuentes ---------- */
	var zLast = window.scrollY, zPeek = false;
	function headerRide() {
		var zfh = $('.zf-hist') || $('.doc-ops') || $('.post-detail');
		if (header && zfh && (document.body.classList.contains('page-template-page-zona-franca') || document.body.classList.contains('page-template-page-documentacion') || document.body.classList.contains('single-operacion'))) {
			/* Zona Franca: el header sube y desaparece junto con el final de la línea de tiempo, cuando asoma la banda de cierre */
			var zh = header.offsetHeight, zvh = window.innerHeight, za = zfh.getBoundingClientRect().bottom;
			var ze = (window.scrollY + zvh >= document.documentElement.scrollHeight - 2 && za < zvh) ? 1 : Math.max(0, Math.min(1, (zvh - za) / (zvh * 0.5))); /* mismo avance que el descubrimiento de la banda */
			var zdy = window.scrollY - zLast; zLast = window.scrollY;
			if (zdy < -2) { zPeek = true; } else if (zdy > 2) { zPeek = false; } /* al scrollear hacia arriba el header reaparece; hacia abajo vuelve a seguir al descubrimiento */
			if (!ze) { zPeek = false; }
			var zy = zPeek ? 0 : -zh * ze;
			header.classList.toggle('zf-peek', zPeek);
			header.style.transform = zy ? 'translateY(' + zy.toFixed(1) + 'px)' : '';
			return;
		}
		var faq = $('#faq');
		if (!header || !faq || !document.body.classList.contains('home')) { return; }
		var hh = header.offsetHeight, b = faq.getBoundingClientRect().bottom;
		var t = $('.faq-title', faq), th = (t && getComputedStyle(t).position === 'sticky') ? t.offsetHeight : 0;
		/* el header sube pegado al rectángulo del título mientras éste es empujado por el final de la sección */
		var y = Math.max(-hh, Math.min(0, b - th - hh));
		header.style.transform = y ? 'translateY(' + y.toFixed(1) + 'px)' : '';
	}
	/* ---------- Máscaras que revelan Nosotros (desde arriba a la izquierda) y Zona Franca (desde arriba a la derecha) al entrar en pantalla ---------- */
	var masks = $$('.reveal-mask, .reveal-mask-tr, .paint-lr').map(function (el) { return { el: el, started: false }; });
	function playMask(m) {
		if (m.started) { return; }
		m.started = true;
		var t0 = null, dur = m.el.classList.contains('paint-lr') ? 900 : 1600;
		(function step(t) {
			if (t0 === null) { t0 = t; }
			var k = Math.min((t - t0) / dur, 1);
			m.el.style.setProperty('--rv', (1 - Math.pow(1 - k, 3)).toFixed(4)); /* ease-out cúbico */
			if (k < 1) { requestAnimationFrame(step); }
		})(performance.now());
	}
	masks.forEach(function (m) {
		if (reduce) { return; }
		m.el.classList.add('is-masked');
		if ('IntersectionObserver' in window) {
			var mio = new IntersectionObserver(function (es) {
				if (es.some(function (e) { return e.isIntersecting; })) { mio.disconnect(); playMask(m); }
			}, { threshold: 0, rootMargin: '0px 0px -25% 0px' });
			mio.observe(m.el.parentNode); /* el elemento recortado por la máscara no es fiable para detectar visibilidad */
		} else { m.el.classList.remove('is-masked'); }
	});
	function checkMask() { /* respaldo por scroll: arranca cuando el elemento ya asoma en pantalla */
		if (reduce) { return; }
		masks.forEach(function (m) {
			if (m.started) { return; }
			var r = m.el.parentNode.getBoundingClientRect();
			if (r.top < window.innerHeight * 0.75 && r.bottom > 0) { playMask(m); }
		});
	}
	/* ---------- Stats: aparecen al entrar en pantalla y los números suben desde 0 ---------- */
	var statsSec = $('.stats-sec'), statsDone = !statsSec;
	function revealStats() {
		if (statsDone) { return; }
		statsDone = true;
		statsSec.classList.add('in');
		if (reduce) { return; }
		$$('[data-count]', statsSec).forEach(function (el) {
			var end = parseInt(el.getAttribute('data-count'), 10), t0 = null, dur = 1800;
			if (isNaN(end)) { return; }
			function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
			el.textContent = '0';
			(function step(t) {
				if (t0 === null) { t0 = t; }
				var k = Math.min((t - t0) / dur, 1);
				el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - k, 3))));
				if (k < 1) { requestAnimationFrame(step); }
			})(performance.now());
		});
	}
	if (statsSec && reduce) { statsSec.classList.add('in'); statsDone = true; }
	else if (statsSec && 'IntersectionObserver' in window) {
		var sio = new IntersectionObserver(function (es) {
			if (es.some(function (e) { return e.isIntersecting; })) { sio.disconnect(); revealStats(); }
		}, { threshold: 0.25 });
		sio.observe(statsSec);
	} else if (statsSec) { revealStats(); }

	/* ---------- Secciones que se descubren por detrás de la anterior (con parallax) ---------- */
	var reveals = [['.hero-stage', '#nosotros', 0.5], ['#servicios', '#en-accion-home', 0.9], ['#mercosur', '#zflp', 0.5], ['#faq', '#contacto', 0.4], ['#zf-que-sec', '.zf-hist', 0.5], ['#doc-pre', '#doc-operar', 0.5], ['.zf-hist', '.page-end', 0.5]].map(function (p) {
		return { over: $(p[0]), under: $(p[1]), span: p[2] }; /* span: tramo de pantalla (fracción del alto) en el que se completa el parallax */
	}).filter(function (p) { return p.over && p.under; });
	function accReveal() {
		if (reduce) { return; }
		var vh = window.innerHeight, end = window.scrollY + vh >= document.documentElement.scrollHeight - 2;
		reveals.forEach(function (p) {
			var a = p.over.getBoundingClientRect().bottom;
			if (end && a < vh) { p.under.style.setProperty('--er', '1'); return; } /* al final de la página, todo revelado */
			if (a > vh * 1.2 || a < -vh) { return; }
			p.under.style.setProperty('--er', Math.max(0, Math.min(1, (vh - a) / (vh * p.span))).toFixed(3));
		});
	}
	/* ---------- Cards de servicios: borde superior que se traza y título palabra por palabra ---------- */
	if (cards.length && !reduce && 'IntersectionObserver' in window) {
		var cio = new IntersectionObserver(function (es) {
			es.forEach(function (e) {
				if (e.isIntersecting) { e.target.classList.add('in'); cio.unobserve(e.target); }
			});
		}, { threshold: 0, rootMargin: '0px 0px -15% 0px' });
		cards.forEach(function (c) {
			var h = $('h3', c);
			if (h) {
				var words = h.textContent.trim().split(/\s+/);
				h.textContent = '';
				words.forEach(function (w, i) {
					var sp = document.createElement('span');
					sp.className = 'w'; sp.style.setProperty('--wi', i); sp.textContent = w;
					h.appendChild(sp);
					if (i < words.length - 1) { h.appendChild(document.createTextNode(' ')); }
				});
			}
			c.classList.add('svc-anim');
			cio.observe(c);
		});
	}

	function svcParallax() {
		if (!cards.length || reduce) { return; }
		var vh = window.innerHeight;
		cards.forEach(function (c) {
			var r = c.getBoundingClientRect();
			if (r.bottom < -100 || r.top > vh + 100) { return; }
			var p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); /* -1 .. 1 */
			c.style.setProperty('--sp', Math.max(-1, Math.min(1, p)).toFixed(3));
		});
	}
	/* ---------- Footer: capa oscura que se aclara hasta 0 a medida que se revela ---------- */
	var mainEl = $('#main'), footEl = $('footer');
	var footMQ = window.matchMedia('(min-width:821px) and (min-height:640px) and (prefers-reduced-motion:no-preference)');
	function footReveal() {
		if (!mainEl || !footEl || !(document.body.classList.contains('home') || document.body.classList.contains('page-template-page-zona-franca') || document.body.classList.contains('page-template-page-documentacion') || document.body.classList.contains('single-operacion')) || !footMQ.matches) { return; }
		var vh = window.innerHeight, b = mainEl.getBoundingClientRect().bottom;
		var shown = Math.max(0, Math.min(1, (vh - b) / Math.max(1, footEl.offsetHeight)));
		if (window.scrollY + vh >= document.documentElement.scrollHeight - 2) { shown = 1; }
		footEl.style.setProperty('--fd', (1 - shown).toFixed(3));
	}
	/* ---------- FAQ: el fondo negro del título, ya fijo, crece hacia abajo hasta el final de la sección ---------- */
	var faqSec = $('#faq'), faqTitle = faqSec && $('.faq-title', faqSec), faqBox = faqSec && $('.split', faqSec);
	function faqGrow() {
		if (!faqTitle || !faqBox || reduce) { return; }
		if (getComputedStyle(faqTitle).position !== 'sticky') { faqTitle.style.removeProperty('--fg'); return; }
		var stuckTop = parseFloat(getComputedStyle(faqTitle).top) || 0;
		var cb = faqBox.getBoundingClientRect(), tb = faqTitle.getBoundingClientRect();
		var d = Math.max(0, stuckTop - cb.top);
		var h = Math.max(0, Math.min(d * 1.6, cb.bottom - tb.bottom));
		faqTitle.style.setProperty('--fg', h.toFixed(1) + 'px');
	}
	/* ---------- Nosotros (tablet/mobile): el video interno se desplaza con el scroll (parallax) y el contenido lo tapa un poco ---------- */
	var nosSec = $('#nosotros'), nosVid = nosSec && $('.split > .video-frame', nosSec);
	var nosMQ = window.matchMedia('(max-width:820px) and (prefers-reduced-motion:no-preference)');
	function nosParallax() {
		if (!nosVid) { return; }
		if (!nosMQ.matches) { nosVid.style.removeProperty('--np'); nosSec.style.removeProperty('--nt'); return; }
		var vh = window.innerHeight, h = nosVid.offsetHeight, top = nosVid.getBoundingClientRect().top;
		var p = Math.max(0, Math.min(1, (vh - top) / (vh + h))); /* 0: entra por abajo, 1: sale por arriba */
		nosVid.style.setProperty('--np', ((p - 0.5) * 0.6 * h).toFixed(1) + 'px'); /* ±30% del alto del marco */
		nosSec.style.setProperty('--nt', Math.max(0, Math.min(1, (vh * 0.45 - top) / (vh * 0.45))).toFixed(3)); /* 0 → 1 cuando el video ya se reveló y sigue subiendo: el contenido sube hasta --nmax px y vuelve a taparlo */
	}
	var raf = 0;
	function onScroll() {
		if (toTop) { toTop.classList.toggle('show', window.scrollY > 600); }
		if (header) { header.classList.toggle('is-scrolled', window.scrollY > 24); }
		if (raf) { return; }
		raf = requestAnimationFrame(function () { raf = 0; depth(); spy(); progress(); headerTone(); headerRide(); checkMask(); accReveal(); svcParallax(); footReveal(); faqGrow(); nosParallax(); });
	}
	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll);
	onScroll();

	/* ---------- Documentación: la columna derecha arranca a la altura del texto (p) de la columna izquierda, debajo del h2 ---------- */
	function docAlign() {
		$$('.doc-s1 .doc-head, .doc-ops .doc-head').forEach(function (head) {
			var col = head.nextElementSibling, txt = $('.prose', head), h2 = $('.h2', head);
			if (!col) { return; }
			col.style.marginTop = '';
			if (window.innerWidth <= 820) { return; }
			var top = head.getBoundingClientRect().top;
			/* con texto (p) se alinea con su tope; sin texto, justo debajo del título */
			var off = txt ? txt.getBoundingClientRect().top - top : (h2 ? h2.getBoundingClientRect().bottom - top + 18 : 0);
			col.style.marginTop = Math.max(0, off).toFixed(1) + 'px';
		});
	}
	docAlign();
	window.addEventListener('resize', docAlign);
	window.addEventListener('load', docAlign);
	if (document.fonts && document.fonts.ready) { document.fonts.ready.then(docAlign); }

	/* ---------- Detalle de operación: si no se conocía la proporción del video, se toma de su metadata y se respeta (vertical u horizontal) ---------- */
	(function () {
		var v = $('.op-video .video-frame video'), cols = $('.op-cols.has-video');
		if (!v || !cols || v.parentNode.style.aspectRatio) { return; }
		function fit() {
			if (!v.videoWidth || !v.videoHeight) { return; }
			v.parentNode.classList.remove('r-916');
			v.parentNode.style.aspectRatio = v.videoWidth + '/' + v.videoHeight;
			cols.classList.toggle('is-landscape', v.videoWidth > v.videoHeight);
		}
		if (v.readyState >= 1) { fit(); } else { v.addEventListener('loadedmetadata', fit); }
	})();

	/* ---------- Scroll con inercia: la rueda acelera y desacelera con una curva suave (sin frenar de golpe) ---------- */
	(function () {
		var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
		if (reduce || !fine) { return; }
		var cur = window.scrollY, target = cur, last = cur, from = cur, t0 = 0, running = false, DUR = 1200;
		function max() { return document.documentElement.scrollHeight - window.innerHeight; }
		function inner(el) { /* ¿la rueda ocurre sobre un contenedor con scroll propio (textarea, mapa, etc.)? */
			for (; el && el !== document.body && el.nodeType === 1; el = el.parentElement) {
				var cs = getComputedStyle(el);
				if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) { return true; }
			}
			return false;
		}
		function step(now) {
			if (Math.abs(window.scrollY - last) > 2) { cur = target = window.scrollY; running = false; return; } /* el scroll lo movió otra cosa (ancla, teclado, barra) */
			var t = Math.min((now - t0) / DUR, 1);
			cur = from + (target - from) * Math.min(1, 1.001 - Math.pow(2, -10 * t)); /* desaceleración exponencial (misma curva que Lenis) */
			if (t >= 1) { cur = target; }
			window.scrollTo({ top: cur, behavior: 'instant' });
			last = window.scrollY;
			if (cur !== target) { requestAnimationFrame(step); } else { running = false; }
		}
		var padUntil = 0, lastWheel = 0;
		window.addEventListener('wheel', function (e) {
			/* Touchpad: manda eventos chicos y seguidos y ya trae su propia inercia; se deja el scroll nativo (si no, se suman dos suavizados y se siente trabado) */
			var now = performance.now(), gap = now - lastWheel; lastWheel = now;
			if (e.deltaMode === 0 && (Math.abs(e.deltaY) < 50 || e.deltaY % 1 !== 0 || e.deltaX !== 0 || (gap < 30 && !running))) { padUntil = now + 600; }
			if (now < padUntil) { if (running) { running = false; cur = target = window.scrollY; } return; }
			if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY) || document.querySelector('dialog[open]') || inner(e.target)) { return; }
			e.preventDefault();
			if (!running) { cur = target = window.scrollY; }
			var dy = e.deltaMode === 1 ? e.deltaY * 40 : (e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY);
			target = Math.max(0, Math.min(max(), target + dy));
			from = cur; t0 = performance.now(); /* cada giro reinicia la curva desde donde está */
			if (!running) { running = true; last = window.scrollY; requestAnimationFrame(step); }
		}, { passive: false });
	})();

	/* ---------- Formulario: llevar el foco al mensaje de estado ---------- */
	var msg = $('#form-msg');
	if (msg) { setTimeout(function () { msg.focus(); }, 50); }
})();
