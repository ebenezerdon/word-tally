$(function(){
  // Smooth scroll for in-page links
  $(document).on('click', 'a[href^="#"]', function(e){
    const href = $(this).attr('href');
    if (href.length > 1) {
      const $target = $(href);
      if ($target.length) {
        e.preventDefault();
        $('html, body').animate({ scrollTop: $target.offset().top - 70 }, 500);
      }
    }
  });

  // Subtle hero card float on scroll
  const $heroCard = $('.card').first();
  if ($heroCard.length) {
    $(window).on('scroll', function(){
      const y = Math.min(15, $(this).scrollTop() / 30);
      $heroCard.css('transform', `translateY(${y}px)`);
    });
  }
});
