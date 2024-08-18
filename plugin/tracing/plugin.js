
window.RevealTracing = window.RevealTracing || (() => {
  let deck;
  return {
    id: 'tracing',
    init: function(reveal) {
      deck = reveal;
      initTracing(deck);
    }
  };
});

const initTracing = function(deck) {
  deck.on('ready', (event) => {
    console.log('Event: ready');
  });

  deck.on('resize', (event) => {
    console.log('Event: resize');
  });

  deck.on('paused', (event) => {
    console.log('Event: paused');
  });

  deck.on('resumed', (event) => {
    console.log('Event: resumed');
  });

  deck.on('beforeslidechange', (event) => {
    console.log('Event: beforeslidechange');
  });

  deck.on('slidechanged', (event) => {
    console.log('Event: slidechanged');
  });

  deck.on('slidetransitionend', (event) => {
    console.log('Event: slidetransitionend');
  });

  deck.on('visible', (event) => {
    console.log('Event: visible');
  });

  deck.on('hidden', (event) => {
    console.log('Event: hidden');
  });

  deck.on('fragmenthidden', (event) => {
    console.log('Event: fragmenthidden');
  });

  deck.on('fragmentshown', (event) => {
    console.log('Event: fragmentshown');
  });
}
