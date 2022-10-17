document.querySelectorAll('[data-hash]').forEach(function (node) {
  node.onclick = () => {
    const h = node.dataset.hash
    location.hash = h
  }
})
