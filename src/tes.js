(() => {
  import('./test2.mjs').then((fn) => {
    console.log('fn', fn);
    fn.default();
  });
})();
