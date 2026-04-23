
const groupFragmentsByIndex = function(slide) {
  const fragments = Array.from(slide.querySelectorAll('.fragment'));
  const groups = new Map();

  for (const fragment of fragments) {
    const idx = parseInt(fragment.getAttribute('data-fragment-index'), 10);
    if (!groups.has(idx)) {
      groups.set(idx, []);
    }
    groups.get(idx).push(fragment);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, frags]) => frags);
};


const DESTRUCTIVE_NEXT_CLASSES = [
  'fade-in-then-out',
  'current-visible',
];


const OVERNOTE_CLASSES = [
  'overnote',
  'overnote-bottom',
  'overnote-inline',
  'overnote-display',
  'website',
];


const isDestructiveNext = function(fragment) {
  if (DESTRUCTIVE_NEXT_CLASSES.some(c => fragment.classList.contains(c))) return true;
  if (OVERNOTE_CLASSES.some(c => fragment.classList.contains(c))) return true;
  if (fragment.classList.contains('animate-svg')) return true;
  if (fragment.classList.contains('fade-in-then-semi-out') && fragment.querySelector('.transient')) return true;
  // if (fragment.querySelector('.collapse')) return true;
  return false;
};


const isDestructiveSelf = function(fragment) {
  if (fragment.classList.contains('fade-out')) return true;
  if (OVERNOTE_CLASSES.some(c => fragment.classList.contains(c))) return true;
  return false;
};


const computeBatchBoundaries = function (fragmentGroups) {
  const boundaries = new Set();

  for (let i = 0; i < fragmentGroups.length; i++) {
    const frags = fragmentGroups[i];

    if (frags.some(f => isDestructiveNext(f))) {
      boundaries.add(i);
    }

    if (frags.some(f => isDestructiveSelf(f) || f.hasAttribute('data-batch-break'))) {
      boundaries.add(i - 1);
    }
  }

  boundaries.add(fragmentGroups.length - 1);
  return boundaries;
  // return [...boundaries].sort((a, b) => a - b);
};


const getCollapseIndices = function (slide) {
  const getIndex = (el) => Number(el.dataset.fragmentIndex);

  return new Set(
    [...slide.querySelectorAll('.collapse')].map((el) => {
      const descendantIndices = [...el.querySelectorAll('[data-fragment-index]')]
      .map(getIndex);

      const ancestorIndices = [];
      for (let p = el.parentElement; p && p !== slide; p = p.parentElement) {
        if (p.dataset.fragmentIndex !== undefined) {
          ancestorIndices.push(getIndex(p));
        }
      }

      const all = [...descendantIndices, ...ancestorIndices];
      return all.length ? Math.max(...all) : null;
    }).filter(v => v !== null)
  );
};


const applyFragmentState = function(clone, previousBatchEnd, batchEnd) {
  for (const fragment of clone.querySelectorAll('.fragment')) {
    const idx = parseInt(fragment.getAttribute('data-fragment-index'), 10);
    if (idx <= batchEnd) {
      fragment.classList.add('visible');
      fragment.classList.toggle('current-fragment', idx === batchEnd);
      if (previousBatchEnd < idx) {
        fragment.classList.add('in-batch');
      }
    } else {
      fragment.classList.remove('visible', 'current-fragment');
    }
  }

  for (const el of clone.querySelectorAll('.collapse:has(.fragment.in-batch)')) {
    el.classList.remove('collapse');
  }
  for (const el of clone.querySelectorAll('.fragment.in-batch .collapse')) {
    el.classList.remove('collapse');
  }
}


const applySVGState = function(slide, batchEnd) {
  for (const container of slide.querySelectorAll('span.animate-svg')) {
    const figureContainer = container.previousElementSibling;
    if (!figureContainer) continue;

    const components = Array.from(figureContainer.querySelectorAll('[id]:not(marker)'));

    for (const c of components) {
      c.classList.remove('animate-svg-shown', 'animate-svg-faded', 'animate-svg-high');
      c.classList.add('animate-svg-hidden');
    }

    for (const step of container.querySelectorAll('.fragment.animate-svg')) {
      const idx = parseInt(step.getAttribute('data-fragment-index'), 10);
      if (idx > batchEnd) continue;

      const operation = step.getAttribute('data-svg-operation');
      const ids = step.getAttribute('data-svg-ids').split(',').map(s => s.trim());
      const targets = components.filter(c => ids.includes(c.id));

      for (const target of targets) {
        target.classList.remove(
          'animate-svg-shown', 'animate-svg-faded',
          'animate-svg-hidden', 'animate-svg-high'
        );
        if (operation === 'show') target.classList.add('animate-svg-shown');
        else if (operation === 'hide') target.classList.add('animate-svg-hidden');
        else if (operation === 'fade') target.classList.add('animate-svg-faded');
      }
    }
  }
}

const wrapInPage = function(clone, originalPage) {
  const page = document.createElement('div');
  page.className = originalPage.className;
  page.style.cssText = originalPage.style.cssText;
  page.appendChild(clone);
  return page;
}

export function batchPrint(deck) {
  if (!deck.isPrintView()) return;

  for (const page of document.querySelectorAll('.pdf-page')) {
    const slide = page.querySelector(':scope > section');
    if (!slide) continue;

    const fragmentGroups = groupFragmentsByIndex(slide);
    if (fragmentGroups.length === 0) continue;

    const fragmentEnds = computeBatchBoundaries(fragmentGroups);
    const collapseEnds = getCollapseIndices(slide);
    const allEnds = fragmentEnds.union(collapseEnds);
    const batchEnds = [...allEnds].sort((a, b) => a - b);
    if (batchEnds.length <= 1) continue;

    const newPages = [];
    let previousBatchEnd = -1;
    for (const batchEnd of batchEnds) {
      applySVGState(slide, batchEnd);
      const clone = slide.cloneNode(true);
      applyFragmentState(clone, previousBatchEnd, batchEnd);
      newPages.push(wrapInPage(clone, page));
      previousBatchEnd = batchEnd;
    }

    page.replaceWith(...newPages);
  }
}

export {
  groupFragmentsByIndex,
  isDestructiveNext,
  isDestructiveSelf,
  computeBatchBoundaries,
  applyFragmentState,
  applySVGState,
};
