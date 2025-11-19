(function($){
  'use strict';
  window.App = window.App || {};
  const App = window.App;

  const defaultState = {
    text: '',
    settings: {
      ignoreStopWords: true,
      caseInsensitive: true,
      minWordLength: 3,
      topN: 10
    }
  };

  let state = JSON.parse(JSON.stringify(defaultState));

  function applySwitch($el, on) {
    $el.attr('aria-checked', on ? 'true' : 'false');
    $el.data('on', !!on);
    const dot = $el.find('.switch-dot');
    if (on) { $el.addClass('bg-[#E11D48]/20'); dot.addClass('translate-x-6'); dot.removeClass('translate-x-1'); }
    else { $el.removeClass('bg-[#E11D48]/20'); dot.removeClass('translate-x-6'); dot.addClass('translate-x-1'); }
  }

  function badgeFromFlesch(score) {
    if (score >= 90) return { label: 'Very easy', tone: 'bg-[#6366F1]/10 text-[#6366F1]' };
    if (score >= 80) return { label: 'Easy', tone: 'bg-[#6366F1]/10 text-[#6366F1]' };
    if (score >= 70) return { label: 'Fairly easy', tone: 'bg-[#6366F1]/10 text-[#6366F1]' };
    if (score >= 60) return { label: 'Standard', tone: 'bg-[#6366F1]/10 text-[#6366F1]' };
    if (score >= 50) return { label: 'Fairly difficult', tone: 'bg-[#E11D48]/10 text-[#1C1917]' };
    if (score >= 30) return { label: 'Difficult', tone: 'bg-[#E11D48]/10 text-[#1C1917]' };
    return { label: 'Very confusing', tone: 'bg-[#E11D48]/10 text-[#1C1917]' };
  }

  function updateNumbers(id, value, decimals) {
    const $el = $(id);
    const text = (typeof decimals === 'number') ? Number(value).toFixed(decimals) : String(value);
    $el.addClass('opacity-0');
    setTimeout(function(){ $el.text(text).removeClass('opacity-0'); }, 120);
  }

  function toCsv(rows) {
    const header = 'keyword,count,density_percent';
    const lines = rows.map(r => `${r.word.replace(/"/g,'""')},${r.count},${r.density.toFixed(2)}`);
    return [header].concat(lines).join('\n');
  }

  function bindControls() {
    const $stop = $('#ignoreStopwords');
    const $case = $('#caseInsensitive');

    $stop.on('click keydown', function(e){ if (e.type === 'click' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const on = !$(this).data('on');
      applySwitch($(this), on);
      state.settings.ignoreStopWords = on;
      App.updateStats($('#inputText').val());
    }});

    $case.on('click keydown', function(e){ if (e.type === 'click' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const on = !$(this).data('on');
      applySwitch($(this), on);
      state.settings.caseInsensitive = on;
      App.updateStats($('#inputText').val());
    }});

    $('#minWordLength').on('input change', App.Utils.debounce(function(){
      const v = parseInt($(this).val(), 10);
      state.settings.minWordLength = isNaN(v) ? 3 : Math.min(10, Math.max(1, v));
      App.updateStats($('#inputText').val());
    }, 200));

    $('#topN').on('input change', App.Utils.debounce(function(){
      const v = parseInt($(this).val(), 10);
      state.settings.topN = isNaN(v) ? 10 : Math.min(50, Math.max(5, v));
      App.updateStats($('#inputText').val());
    }, 200));

    $('#analyzeBtn').on('click', function(){ App.updateStats($('#inputText').val()); });
    $('#clearBtn').on('click', function(){
      $('#inputText').val('');
      App.updateStats('');
    });

    $('#exportBtn').on('click', function(){
      try {
        const stats = App.currentStats || { topKeywords: [] };
        const csv = toCsv(stats.topKeywords || []);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'keywords.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function(){ URL.revokeObjectURL(url); }, 500);
      } catch(err) { console.error('Export failed', err); }
    });

    $('#sampleBtn').on('click', function(){
      const sample = `Writing well is a practice. You refine tone, strengthen verbs, and keep sentences concise. A good draft balances rhythm and structure. Reading your work out loud helps catch awkward phrasing and pacing. In the end, clear language respects the reader's time.`;
      $('#inputText').val(sample);
      App.updateStats(sample);
      $('#inputText').focus();
    });

    // Live update with debounce
    $('#inputText').on('input', App.Utils.debounce(function(){
      App.updateStats($(this).val());
    }, 350));

    // Keyboard shortcut: Ctrl+Enter
    $(document).on('keydown', function(e){
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        App.updateStats($('#inputText').val());
      }
    });
  }

  App.renderKeywords = function(list) {
    const $tbody = $('#keywordTableBody');
    $tbody.empty();
    if (!list || !list.length) {
      $tbody.append($(`<tr><td class="py-3 pr-6 text-[#78716C]" colspan="3">No keywords yet. Start typing above.</td></tr>`));
      return;
    }
    list.forEach(function(item){
      const row = $(`
        <tr>
          <td class="py-2 pr-6">
            <span class="inline-flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-[#E11D48]"></span>
              <span class="font-medium">${item.word}</span>
            </span>
          </td>
          <td class="py-2 pr-6">${item.count}</td>
          <td class="py-2 pr-6">${item.density.toFixed(2)}%</td>
        </tr>
      `);
      $tbody.append(row);
    });
  };

  App.updateStats = function(text) {
    try {
      state.text = String(text || '');
      const opts = Object.assign({}, state.settings);
      const stats = App.Utils.computeStats(state.text, opts);
      App.currentStats = stats;

      updateNumbers('#wordCount', stats.wordsCount);
      updateNumbers('#charCount', stats.charsWithSpaces);
      updateNumbers('#charCountNoSpaces', stats.charsNoSpaces);
      updateNumbers('#sentenceCount', stats.sentences);
      updateNumbers('#paragraphCount', stats.paragraphs);
      updateNumbers('#avgWordLength', stats.avgWordLength, 2);

      const rt = stats.readingTime;
      const timeStr = (rt.minutes > 0) ? `${rt.minutes} min ${rt.seconds} sec` : `${rt.seconds} sec`;
      $('#readingTime').text(timeStr);

      const fleschRounded = Math.max(0, Math.min(100, Math.round(stats.flesch)));
      const fkRounded = Math.max(-5, Math.round(stats.fk * 10) / 10);
      updateNumbers('#fleschScore', fleschRounded);
      updateNumbers('#fkGrade', fkRounded);

      const badge = badgeFromFlesch(fleschRounded);
      $('#readabilityBadge').removeClass().addClass(`badge ${badge.tone}`).text(badge.label);

      App.renderKeywords(stats.topKeywords);

      // Persist
      App.Storage.saveState(state);
    } catch (e) {
      console.error('Update failed', e);
    }
  };

  App.init = function(){
    try {
      // Load state
      const saved = App.Storage.loadState();
      if (saved && typeof saved === 'object') {
        state = $.extend(true, {}, defaultState, saved);
      }

      // Initialize controls
      applySwitch($('#ignoreStopwords'), !!state.settings.ignoreStopWords);
      applySwitch($('#caseInsensitive'), !!state.settings.caseInsensitive);
      $('#minWordLength').val(state.settings.minWordLength);
      $('#topN').val(state.settings.topN);

      // Fill text
      $('#inputText').val(state.text || '');

      bindControls();
    } catch (err) {
      console.error('Init failed', err);
    }
  };

  App.render = function(){
    App.updateStats($('#inputText').val());
  };

})(jQuery);
