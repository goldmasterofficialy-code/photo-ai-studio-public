import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.photoai.site';

const seoPages = {
  '/': {
    title: 'PhotoAI Studio - Free AI Photo Editor & Image Tools',
    description:
      'Edit photos online with PhotoAI Studio. Remove backgrounds, enhance photos, resize images, create posters and compress pictures with easy online tools.'
  },

  '/generate': {
    title: 'AI Image Generator Online | PhotoAI Studio',
    description:
      'Create images from your ideas with PhotoAI Studio. Explore creative AI image generation and bring your imagination to life.'
  },

  '/ai-image-generator': {
    title: 'AI Image Generator Online | PhotoAI Studio',
    description:
      'Create images from your ideas with PhotoAI Studio. Explore creative AI image generation and bring your imagination to life.'
  },

  '/edit': {
    title: 'AI Photo Editor Online | PhotoAI Studio',
    description:
      'Edit and improve photos online with PhotoAI Studio. Explore simple photo editing tools for your creative projects.'
  },

  '/ai-photo-editor': {
    title: 'AI Photo Editor Online | PhotoAI Studio',
    description:
      'Edit and improve photos online with PhotoAI Studio. Explore simple photo editing tools for your creative projects.'
  },

  '/poster': {
    title: 'Online Poster Maker | PhotoAI Studio',
    description:
      'Create attractive posters online with PhotoAI Studio. Customize images, text and creative layouts.'
  },

  '/advanced-poster': {
    title: 'Advanced Poster Editor Online | PhotoAI Studio',
    description:
      'Design custom posters with photos, text, stickers and creative editing options using PhotoAI Studio.'
  },

  '/projects': {
    title: 'My Photo Projects | PhotoAI Studio',
    description: 'Manage your saved creative projects in PhotoAI Studio.',
    robots: 'noindex, nofollow'
  },

  '/templates': {
    title: 'Creative Photo Templates | PhotoAI Studio',
    description:
      'Explore creative photo templates and design ideas with PhotoAI Studio.'
  },

  '/remove': {
    title: 'Free Image Background Remover | PhotoAI Studio',
    description:
      'Remove image backgrounds online with PhotoAI Studio. Create transparent background images from your photos.'
  },

  '/image-background-remover': {
    title: 'Free Image Background Remover | PhotoAI Studio',
    description:
      'Remove image backgrounds online with PhotoAI Studio. Create transparent background images from your photos.'
  },

  '/enhance': {
    title: 'AI Photo Enhancer Online | PhotoAI Studio',
    description:
      'Enhance photos online with PhotoAI Studio. Improve brightness, sharpness and image appearance.'
  },

  '/ai-photo-enhancer': {
    title: 'AI Photo Enhancer Online | PhotoAI Studio',
    description:
      'Enhance photos online with PhotoAI Studio. Improve brightness, sharpness and image appearance.'
  },

  '/resize': {
    title: 'Image Resizer and Cropper Online | PhotoAI Studio',
    description:
      'Resize and crop images online with PhotoAI Studio. Adjust image dimensions and aspect ratios easily.'
  },

  '/image-resizer': {
    title: 'Image Resizer and Cropper Online | PhotoAI Studio',
    description:
      'Resize and crop images online with PhotoAI Studio. Adjust image dimensions and aspect ratios easily.'
  },

  '/compress': {
    title: 'Image Compressor Online | PhotoAI Studio',
    description:
      'Compress JPG, PNG and WebP images online with PhotoAI Studio. Reduce image file size easily.'
  },

  '/image-compressor': {
    title: 'Image Compressor Online | PhotoAI Studio',
    description:
      'Compress JPG, PNG and WebP images online with PhotoAI Studio. Reduce image file size easily.'
  },

  '/about': {
    title: 'About PhotoAI Studio | Online Photo Tools',
    description:
      'Learn about PhotoAI Studio and its online photo editing, image enhancement and creative tools.'
  },

  '/contact': {
    title: 'Contact PhotoAI Studio | Support',
    description:
      'Contact PhotoAI Studio for questions, feedback and support.'
  },

  '/privacy': {
    title: 'Privacy Policy | PhotoAI Studio',
    description:
      'Read the PhotoAI Studio privacy policy and learn how website information is handled.'
  },

  '/terms': {
    title: 'Terms and Conditions | PhotoAI Studio',
    description:
      'Read the terms and conditions for using PhotoAI Studio and its online tools.'
  },

  '/settings': {
    title: 'Account Settings | PhotoAI Studio',
    description:
      'Manage your PhotoAI Studio account preferences and settings.',
    robots: 'noindex, nofollow'
  }
};

export default function SEO() {
  const location = useLocation();

  useEffect(() => {
    const pathname =
      location.pathname === '/'
        ? '/'
        : location.pathname.replace(/\/+$/, '');

    const page = seoPages[pathname] || {
      title: 'Page Not Found | PhotoAI Studio',
      description: 'The requested page could not be found on PhotoAI Studio.',
      robots: 'noindex, follow'
    };

    const canonicalUrl = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;

    document.title = page.title;

    function setMeta(name, content) {
      let element = document.querySelector(
        `meta[name="${name}"]`
      );

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
    setMeta('robots', page.robots || 'index, follow');

    setProperty('og:title', page.title);
    setProperty('og:description', page.description);
    setProperty('og:type', 'website');
    setProperty('og:url', canonicalUrl);
    setProperty('og:site_name', 'PhotoAI Studio');

    setMeta('twitter:card', 'summary');
    setMeta('twitter:title', page.title);
    setMeta('twitter:description', page.description);

    let canonical = document.querySelector(
      'link[rel="canonical"]'
    );

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }

    canonical.setAttribute('href', canonicalUrl);

  }, [location.pathname]);

  return null;
}