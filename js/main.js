/**
 * Jakobsen Rør AS - Main JavaScript
 * VVS & Rørlegger i Mandal og Lindesnes
 */

(function() {
  'use strict';

  // ==========================================================================
  // DOM Ready
  // ==========================================================================

  document.addEventListener('DOMContentLoaded', function() {
    initHeader();
    initMobileMenu();
    initScrollAnimations();
    initSmoothScroll();
    initContactForm();
    initServiceSidebar();
  });

  // ==========================================================================
  // Header Scroll Effect
  // ==========================================================================

  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    let lastScroll = 0;
    const scrollThreshold = 50;

    function handleScroll() {
      const currentScroll = window.pageYOffset;

      // Add/remove scrolled class
      if (currentScroll > scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    }

    // Throttle scroll events
    let ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Initial check
    handleScroll();
  }

  // ==========================================================================
  // Mobile Menu
  // ==========================================================================

  function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMain = document.getElementById('nav-main');

    if (!menuToggle || !navMain) return;

    menuToggle.addEventListener('click', function() {
      menuToggle.classList.toggle('active');
      navMain.classList.toggle('active');

      // Toggle aria-expanded
      const isExpanded = menuToggle.classList.contains('active');
      menuToggle.setAttribute('aria-expanded', isExpanded);

      // Prevent body scroll when menu is open
      document.body.style.overflow = isExpanded ? 'hidden' : '';
    });

    // Close menu when clicking on a link
    const navLinks = navMain.querySelectorAll('.nav-link');
    navLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        menuToggle.classList.remove('active');
        navMain.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && navMain.classList.contains('active')) {
        menuToggle.classList.remove('active');
        navMain.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (navMain.classList.contains('active') &&
          !navMain.contains(e.target) &&
          !menuToggle.contains(e.target)) {
        menuToggle.classList.remove('active');
        navMain.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ==========================================================================
  // Scroll Animations
  // ==========================================================================

  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');

    if (!animatedElements.length) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all elements immediately
      animatedElements.forEach(function(el) {
        el.classList.add('animated');
      });
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          // Add stagger delay if element has data-delay attribute
          const delay = entry.target.dataset.delay || 0;

          setTimeout(function() {
            entry.target.classList.add('animated');
          }, delay);

          // Unobserve after animation
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all animated elements
    animatedElements.forEach(function(el, index) {
      // Add stagger delay based on index within parent
      if (el.parentElement) {
        const siblings = el.parentElement.querySelectorAll('[data-animate]');
        const siblingIndex = Array.from(siblings).indexOf(el);
        if (siblingIndex > 0) {
          el.dataset.delay = siblingIndex * 100;
        }
      }

      observer.observe(el);
    });
  }

  // ==========================================================================
  // Smooth Scroll
  // ==========================================================================

  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(function(link) {
      link.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');

        // Skip if it's just "#"
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          e.preventDefault();

          const headerHeight = document.getElementById('header').offsetHeight || 80;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Update URL without scrolling
          history.pushState(null, null, targetId);
        }
      });
    });
  }

  // ==========================================================================
  // Contact Form
  // ==========================================================================

  function initContactForm() {
    const form = document.getElementById('contact-form');
    const successMessage = document.getElementById('form-success');

    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerHTML;

      // Disable button and show loading state
      submitButton.disabled = true;
      submitButton.innerHTML = `
        <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="animation: spin 1s linear infinite;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        Sender...
      `;

      // Collect form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Add checkboxes (they don't appear in FormData if unchecked)
      data.befaring = form.querySelector('#befaring').checked;
      data.urgent = form.querySelector('#urgent').checked;

      try {
        // Send to Resend API
        const response = await sendEmail(data);

        if (response.success) {
          // Show success message
          form.style.display = 'none';
          if (successMessage) {
            successMessage.style.display = 'block';
          }
        } else {
          throw new Error(response.error || 'Noe gikk galt');
        }
      } catch (error) {
        // Show error alert
        alert('Beklager, noe gikk galt. Vennligst prøv igjen eller ring oss direkte på 476 XX XXX.');

        // Reset button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    });
  }

  /**
   * Send email via Resend API
   * Note: In production, this should go through a backend API
   */
  async function sendEmail(data) {
    // Format the email content
    const emailContent = `
      <h2>Ny henvendelse fra jakobsenror.no</h2>

      <h3>Kontaktinformasjon</h3>
      <ul>
        <li><strong>Navn:</strong> ${escapeHtml(data.name)}</li>
        <li><strong>Telefon:</strong> ${escapeHtml(data.phone)}</li>
        <li><strong>E-post:</strong> ${escapeHtml(data.email)}</li>
        <li><strong>Adresse/Område:</strong> ${escapeHtml(data.address) || 'Ikke oppgitt'}</li>
      </ul>

      <h3>Oppdragsdetaljer</h3>
      <ul>
        <li><strong>Type oppdrag:</strong> ${escapeHtml(data.service)}</li>
        <li><strong>Ønsker befaring:</strong> ${data.befaring ? 'Ja' : 'Nei'}</li>
        <li><strong>Haster:</strong> ${data.urgent ? 'JA - PRIORITER!' : 'Nei'}</li>
      </ul>

      <h3>Beskrivelse</h3>
      <p>${escapeHtml(data.message) || 'Ingen beskrivelse oppgitt.'}</p>

      <hr>
      <p style="color: #666; font-size: 12px;">Denne meldingen ble sendt fra kontaktskjemaet på jakobsenror.no</p>
    `;

    // In a real implementation, this would call your backend API
    // For demonstration, we'll simulate a successful response
    // Replace this with actual Resend API call through your backend

    /*
    // Example backend call:
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'post@jakobsenror.no',
        subject: `Ny henvendelse: ${data.service} - ${data.name}`,
        html: emailContent,
        replyTo: data.email
      })
    });

    return await response.json();
    */

    // Simulated response for demo
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Form data:', data);
        console.log('Email content:', emailContent);
        resolve({ success: true });
      }, 1500);
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================================================
  // Service Sidebar (for tjenester.html)
  // ==========================================================================

  function initServiceSidebar() {
    const sidebarLinks = document.querySelectorAll('.sidebar-services a');

    if (!sidebarLinks.length) return;

    // Highlight current section based on scroll position
    const sections = document.querySelectorAll('.service-detail-section');

    if (!sections.length) return;

    function updateActiveLink() {
      const scrollPosition = window.scrollY + 200; // Offset for header

      sections.forEach(function(section) {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          // Remove active class from all links
          sidebarLinks.forEach(function(link) {
            link.classList.remove('active');
          });

          // Add active class to current link
          const activeLink = document.querySelector(`.sidebar-services a[href="#${sectionId}"]`);
          if (activeLink) {
            activeLink.classList.add('active');
          }
        }
      });
    }

    // Throttle scroll events
    let ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          updateActiveLink();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Initial check
    updateActiveLink();
  }

  // ==========================================================================
  // CSS Animation Keyframe for spinner
  // ==========================================================================

  // Add spinner animation to document
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

})();
