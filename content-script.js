document.querySelectorAll('[data-hash]').forEach(function (node) {
  const h = node.dataset.hash
  location.hash = h
})