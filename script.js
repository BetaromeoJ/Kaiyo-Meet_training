/* ============================================================
   開陽高校定時制課程 Google Classroom・Google Meet研修サイト
   script.js

   構成:
     0. initSplash()           … リロード時、黒幕が下から上へ抜けていく演出
     1. initProgressBar()     … スクロール量に応じて進捗バーを更新
     2. initTOC()              … 右側目次のハイライト・現在位置表示・
                                   モバイル用ドロワーの開閉
     3. initBackToTop()        … 右下「TOPへ戻る」ボタンの表示/非表示
     4. initSectionNav()       … 各セクション末尾の「戻る/次へ」ボタン
     5. initScreenshotModal()  … スクリーンショットのクリック拡大表示
     6. initTeacherMemo()      … 「講師メモ」の折りたたみ
     7. initTryItChecklists()  … 「実際にやってみよう」チェックの保存
     8. initFinalChecklist()   … 研修終了チェックリストと進捗表示
     9. initFadeIn()           … カードのフェードイン演出(控えめ)

   保守メモ:
     ・スクリーンショットは .screenshot-placeholder 内の <img> を
       差し替えるだけで反映されます(差し替え手順はindex.html内の
       コメントを参照してください)。
     ・チェック状態は localStorage に保存され、再訪問時も保持されます。
   ============================================================ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STORAGE_PREFIX = 'kaiyo-ict-manual:';

  /* ------------------------------------------------------------
     0. スプラッシュ演出(黒幕が下から上へ抜けていく)
     ------------------------------------------------------------ */
  function initSplash() {
    const splash = document.getElementById('splash');
    if (!splash) return;

    if (prefersReducedMotion) {
      splash.remove();
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => splash.classList.add('show'));
    });
    setTimeout(() => splash.classList.add('hide'), 1100);
    setTimeout(() => splash.remove(), 1650);
  }

  /* ------------------------------------------------------------
     1. 進捗バー
     ------------------------------------------------------------ */
  function initProgressBar() {
    const fill = document.getElementById('progressBarFill');
    if (!fill) return;

    function update() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      fill.style.width = (ratio * 100).toFixed(1) + '%';
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ------------------------------------------------------------
     2. 目次(TOC)
     ------------------------------------------------------------ */
  function initTOC() {
    const toc = document.getElementById('toc');
    const tocLinks = Array.from(document.querySelectorAll('#toc a[href^="#"]'));
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const currentLabel = document.getElementById('currentSectionLabel');
    const toggleBtn = document.getElementById('tocToggle');
    const overlay = document.getElementById('tocOverlay');

    // ---- モバイルドロワー開閉 ----
    function openTOC() {
      if (!toc) return;
      toc.classList.add('open');
      if (overlay) overlay.classList.add('open');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    }
    function closeTOC() {
      if (!toc) return;
      toc.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    }
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        toc.classList.contains('open') ? closeTOC() : openTOC();
      });
    }
    if (overlay) overlay.addEventListener('click', closeTOC);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeTOC();
    });
    tocLinks.forEach((link) => link.addEventListener('click', closeTOC));

    // ---- スクロールスパイ(現在地ハイライト) ----
    if (!sections.length) return;

    function setActive(id) {
      tocLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === '#' + id;
        link.classList.toggle('active', isActive);
        if (isActive && currentLabel) {
          currentLabel.textContent = link.dataset.label || link.textContent.trim();
        }
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((sec) => observer.observe(sec));
  }

  /* ------------------------------------------------------------
     3. TOPへ戻るボタン
     ------------------------------------------------------------ */
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    function toggle() {
      if (window.scrollY > 600) {
        btn.classList.add('show');
      } else {
        btn.classList.remove('show');
      }
    }
    toggle();
    window.addEventListener('scroll', toggle, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------
     4. 前へ/次へボタン
     ------------------------------------------------------------ */
  function initSectionNav() {
    document.querySelectorAll('.section-nav a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  /* ------------------------------------------------------------
     5. スクリーンショット モーダル
     ------------------------------------------------------------ */
  function initScreenshotModal() {
    const overlay = document.getElementById('ssModalOverlay');
    if (!overlay) return;
    const inner = overlay.querySelector('.ss-modal-inner');
    const caption = overlay.querySelector('.ss-modal-caption');
    const closeBtn = overlay.querySelector('.ss-modal-close');
    let lastFocused = null;

    function openModal(placeholder) {
      const img = placeholder.querySelector('img');
      const label = placeholder.dataset.caption || placeholder.querySelector('.ss-label')?.textContent || '';

      if (img) {
        inner.innerHTML = '<img src="' + img.getAttribute('src') + '" alt="' + (img.getAttribute('alt') || label) + '">';
      } else {
        inner.innerHTML =
          '<span class="material-symbols-outlined" aria-hidden="true">image</span>' +
          '<span>ここへスクリーンショットを配置してください</span>';
      }
      caption.textContent = label;

      lastFocused = document.activeElement;
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      closeBtn.focus();
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll('.screenshot-placeholder').forEach((el) => {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener('click', () => openModal(el));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(el);
        }
      });
    });

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });
  }

  /* ------------------------------------------------------------
     6. 講師メモ(折りたたみ)
     ------------------------------------------------------------ */
  function initTeacherMemo() {
    document.querySelectorAll('.teacher-memo-trigger').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const panelId = trigger.getAttribute('aria-controls');
        const panel = document.getElementById(panelId);
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!expanded));
        if (panel) panel.classList.toggle('open', !expanded);
      });
    });
  }

  /* ------------------------------------------------------------
     7. 「実際にやってみよう」チェックの保存
     ------------------------------------------------------------ */
  function initTryItChecklists() {
    document.querySelectorAll('.try-it-box .check-item input[type="checkbox"]').forEach((box) => {
      const key = STORAGE_PREFIX + 'tryit:' + box.id;
      try {
        const saved = localStorage.getItem(key);
        if (saved === '1') box.checked = true;
      } catch (e) { /* localStorage 無効環境では無視 */ }

      box.addEventListener('change', () => {
        try {
          localStorage.setItem(key, box.checked ? '1' : '0');
        } catch (e) { /* 無視 */ }
      });
    });
  }

  /* ------------------------------------------------------------
     8. 研修終了チェックリスト
     ------------------------------------------------------------ */
  function initFinalChecklist() {
    const boxes = Array.from(document.querySelectorAll('.checklist-box input[type="checkbox"]'));
    if (!boxes.length) return;
    const fill = document.getElementById('checklistProgressFill');
    const label = document.getElementById('checklistProgressLabel');

    function updateProgress() {
      const checked = boxes.filter((b) => b.checked).length;
      const ratio = checked / boxes.length;
      if (fill) fill.style.width = (ratio * 100).toFixed(0) + '%';
      if (label) label.textContent = checked + ' / ' + boxes.length + ' 完了';
    }

    boxes.forEach((box) => {
      const key = STORAGE_PREFIX + 'final:' + box.id;
      try {
        const saved = localStorage.getItem(key);
        if (saved === '1') box.checked = true;
      } catch (e) { /* 無視 */ }

      box.addEventListener('change', () => {
        try {
          localStorage.setItem(key, box.checked ? '1' : '0');
        } catch (e) { /* 無視 */ }
        updateProgress();
      });
    });

    updateProgress();
  }

  /* ------------------------------------------------------------
     9. フェードイン(控えめな演出のみ)
     ------------------------------------------------------------ */
  function initFadeIn() {
    const targets = document.querySelectorAll('.fade-in');
    if (!targets.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    targets.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------
     初期化
     ------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', () => {
    initSplash();
    initProgressBar();
    initTOC();
    initBackToTop();
    initSectionNav();
    initScreenshotModal();
    initTeacherMemo();
    initTryItChecklists();
    initFinalChecklist();
    initFadeIn();
  });
})();
