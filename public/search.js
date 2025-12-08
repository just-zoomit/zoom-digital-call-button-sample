const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

// Submit on Enter key
searchForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const query = searchInput.value.trim();

  if (query.length === 0) {
    window.location.href = '/search';
  } else {
    window.location.href = '/search?q=' + encodeURIComponent(query);
  }
});
