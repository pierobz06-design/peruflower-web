import { prefiereMenosMovimiento } from '../utils/movimiento.js';

/**
 * Slider principal con fundido. Avanza solo cada 4 s; se pausa al pasar el mouse,
 * al enfocar con teclado o con el botón de pausa (WCAG 2.2.2).
 */
export function iniciarSliderHero() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) {
    return;
  }
  const slides = [...hero.querySelectorAll('[data-hero-slide]')];
  const puntos = [...hero.querySelectorAll('[data-hero-punto]')];
  const botonPausa = hero.querySelector('[data-hero-pausa]');
  const intervalo = Number(hero.dataset.autoplay) || 4000;
  let actual = 0;
  let pausadoPorUsuario = prefiereMenosMovimiento();
  let pausadoTemporal = false;

  function mostrar(indice) {
    actual = (indice + slides.length) % slides.length;
    const imagenPendiente = slides[actual].querySelector('img[data-src]');
    if (imagenPendiente) {
      imagenPendiente.src = imagenPendiente.dataset.src;
      imagenPendiente.removeAttribute('data-src');
    }
    slides.forEach((slide, posicion) => {
      const activa = posicion === actual;
      slide.classList.toggle('es-activa', activa);
      if (activa) {
        slide.removeAttribute('aria-hidden');
      } else {
        slide.setAttribute('aria-hidden', 'true');
      }
      slide.querySelectorAll('a').forEach((enlace) => {
        enlace.tabIndex = activa ? 0 : -1;
      });
    });
    puntos.forEach((punto, posicion) => {
      if (posicion === actual) {
        punto.setAttribute('aria-current', 'true');
      } else {
        punto.removeAttribute('aria-current');
      }
    });
  }

  function actualizarBotonPausa() {
    hero.classList.toggle('esta-pausado', pausadoPorUsuario);
    botonPausa?.setAttribute(
      'aria-label',
      pausadoPorUsuario ? 'Reanudar presentación' : 'Pausar presentación',
    );
  }

  hero.querySelector('[data-hero-anterior]')?.addEventListener('click', () => mostrar(actual - 1));
  hero.querySelector('[data-hero-siguiente]')?.addEventListener('click', () => mostrar(actual + 1));
  puntos.forEach((punto) => {
    punto.addEventListener('click', () => mostrar(Number(punto.dataset.heroPunto)));
  });
  botonPausa?.addEventListener('click', () => {
    pausadoPorUsuario = !pausadoPorUsuario;
    actualizarBotonPausa();
  });

  hero.addEventListener('mouseenter', () => {
    pausadoTemporal = true;
  });
  hero.addEventListener('mouseleave', () => {
    pausadoTemporal = false;
  });
  hero.addEventListener('focusin', () => {
    pausadoTemporal = true;
  });
  hero.addEventListener('focusout', () => {
    pausadoTemporal = false;
  });

  window.setInterval(() => {
    if (!pausadoPorUsuario && !pausadoTemporal && !document.hidden) {
      mostrar(actual + 1);
    }
  }, intervalo);

  actualizarBotonPausa();
  cargarFotosPendientes(hero);
}

/** Descarga las fotos de las demás diapositivas cuando la página ya terminó de cargar. */
function cargarFotosPendientes(hero) {
  const cargar = () => {
    hero.querySelectorAll('img[data-src]').forEach((imagen) => {
      imagen.src = imagen.dataset.src;
      imagen.removeAttribute('data-src');
    });
  };
  if (document.readyState === 'complete') {
    cargar();
  } else {
    window.addEventListener('load', cargar, { once: true });
  }
}
