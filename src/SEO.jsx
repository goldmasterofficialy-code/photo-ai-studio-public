import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.photoai.site';

const seoPages = {
  '/': {
    title: 'PhotoAI Studio – Free Online AI Photo Editor & Image Tools',
    description:
      'PhotoAI Studio offers free online photo editing tools. Remove backgrounds, enhance photos, resize, crop and compress images with easy-to-use tools.'
  },
  '/generate': {
    title: 'AI Image Generator Online | PhotoAI Studio',
    description:
      'Explore AI image generation with PhotoAI Studio and turn creative ideas into beautiful images.'
  },
  '/edit': {
    title: 'Online AI Photo Editor | PhotoAI Studio',
    description:
      'Edit and improve your photos with PhotoAI Studio. Explore creative photo editing features.'
  },
  '/poster': {
    title: 'Online Poster Maker | PhotoAI Studio',
    description:
      'Create and customize posters with PhotoAI Studio using images, text and creative layouts.'
  },
  '/advanced-poster': {
    title: 'Advanced Poster Editor | PhotoAI Studio',
    description:
      'Design custom posters with photos, text, stickers and editing options.'
  },
  '/projects': {
    title: 'My Projects | PhotoAI Studio',
    description: 'Manage your saved creative projects.',
    private: true
  },
  '/templates': {
    title: 'Creative Photo Templates | PhotoAI Studio',
    description: 'Explore creative photo templates and design ideas.'
  },
  '/remove': {
    title: 'Free Background Remover Online | PhotoAI Studio',
    description:
      'Remove image backgrounds online and create transparent background images with PhotoAI Studio.'
  },
  '/enhance': {
    title: 'Free Photo Enhancer Online | PhotoAI Studio',
    description:
      'Improve photo brightness and sharpness with the online PhotoAI Studio photo enhancer.'
  },
  '/resize': {
    title: 'Image Resizer and Cropper | PhotoAI Studio',
    description:
      'Resize and crop images online with customizable dimensions and aspect ratios.'
  },
  '/compress': {
    title: 'Free Image Compressor | PhotoAI Studio',
    description:
      'Compress JPG, PNG and WebP images online with PhotoAI Studio.'
  },
  '/about': {
    title: 'About PhotoAI Studio | Online Photo Tools',
    description:
      'Discover PhotoAI Studio and its collection of online photo editing and image tools.'
  },
  '/contact': {
    title: 'Contact PhotoAI Studio | Support',
    description:
      'Contact PhotoAI Studio for questions, feedback and support.'
  },
  '/privacy': {
    title: 'Privacy Policy | PhotoAI Studio',
    description:
      'Read the PhotoAI Studio privacy policy.'
  },
  '/terms': {
    title: 'Terms and Conditions | PhotoAI Studio',
    description:
      'Read the terms and conditions for using PhotoAI Studio.'
  },
  '/settings': {
    title: 'Account Settings | PhotoAI Studio',
    description: 'Manage your account preferences.',
    private: true
  }
};

export default function SEO() {
  const location = useLocation();

  useEffect(() => {
    const pathname =
      location.pathname === '/'
        ? '/'
        : location.pathname.replace(/\/+$/, '');

    const page = seoPages[pathname] || seoPages['/'];
    const canonicalUrl = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;

    document.title = page.title;

    function setMeta(name, content) {
      let element = document.querySelector(`meta[name="${name}"]`);

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    }

    function setProperty(property, content) {
      let element = document.querySelector(
        `meta[property="${property}"]`
      );

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    }

    setMeta('description', page.description);
    setMeta('robots', page.private ? 'noindex, follow' : 'index, follow');

    setProperty('og:title', page.title);
    setProperty('og:description', page.description);
    setProperty('og:type', 'website');
    setProperty('og:url', canonicalUrl);
    setProperty('og:site_name', 'PhotoAI Studio');

    setMeta('twitter:card', 'summary');
    setMeta('twitter:title', page.title);
    setMeta('twitter:description', page.description);

    let canonical = document.querySelector('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }

    canonical.setAttribute('href', canonicalUrl);

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: 'PhotoAI Studio',
          url: `${SITE_URL}/`
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          name: 'PhotoAI Studio',
          alternateName: 'PhotoAI',
          url: `${SITE_URL}/`,
          publisher: {
            '@id': `${SITE_URL}/#organization`
          }
        }
      ]
    };

    let schema = document.getElementById('photoai-structured-data');

    if (!schema) {
      schema = document.createElement('script');
      schema.id = 'photoai-structured-data';
      schema.type = 'application/ld+json';
      document.head.appendChild(schema);
    }

    schema.textContent = JSON.stringify(structuredData);
  }, [location.pathname]);

  return null;
}