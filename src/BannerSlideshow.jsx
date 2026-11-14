import { useEffect, useState } from 'react';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop',
    title: 'Create Beautiful Photos',
    label: 'PHOTO STUDIO'
  },
  {
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&auto=format&fit=crop',
    title: 'Make Every Moment Special',
    label: 'AI PORTRAIT'
  },
  {
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1000&auto=format&fit=crop',
    title: 'Design Like A Pro',
    label: 'CREATIVE DESIGN'
  },
  {
    image: 'https://images.unsplash.com/photo-150053085085?auto=format&fit=crop&w=1000&q=85',
    title: 'Explore Your Creativity',
    label: 'PHOTO ART'
  }
];

export default function BannerSlideshow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive(current => (current + 1) % slides.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="banner-slideshow">
      {slides.map((slide, index) => (
        <div
          className={`banner-slide ${active === index ? 'active' : ''}`}
          key={slide.title}
        >
          <img
            src={slide.image}
            alt={slide.title}
            onError={event => {
              event.currentTarget.style.display = 'none';
            }}
          />
          <div className="banner-slide-overlay">
            <span>{slide.label}</span>
            <h3>{slide.title}</h3>
          </div>
        </div>
      ))}

      <button
        className="banner-arrow banner-prev"
        onClick={() =>
          setActive(current => (current - 1 + slides.length) % slides.length)
        }
        aria-label="Previous image"
      >
        ‹
      </button>

      <button
        className="banner-arrow banner-next"
        onClick={() =>
          setActive(current => (current + 1) % slides.length)
        }
        aria-label="Next image"
      >
        ›
      </button>

      <div className="banner-dots">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            className={active === index ? 'active' : ''}
            onClick={() => setActive(index)}
            aria-label={`Show image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}