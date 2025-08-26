document.addEventListener('DOMContentLoaded', function() {
    const gridElement = document.getElementById('role-grid');
    
    // on clicking a card, toggle its flipped state
    if (gridElement) {
        gridElement.addEventListener('click', function(e) {
            const card = e.target.closest('.role-card');
            if (card) {
                card.classList.toggle('flipped');
            }
        });
    }

    // when pressing escape, unflip all cards
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.role-card.flipped').forEach(function(card) {
                card.classList.remove('flipped');
            });
        }
    });
});