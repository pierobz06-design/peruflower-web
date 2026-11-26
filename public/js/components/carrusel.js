import { prefiereMenosMovimiento } from '../utils/movimiento.js';

/**
 * Carrusel de productos u ocasiones: flechas, arrastre táctil y avance automático opcional
 * (se detiene al pasar el mouse o al enfocar con el teclado).
 */
const UMBRAL_ARRASTRE_PX = 40;

class Carrusel {
  constructor(raiz) {
    this.raiz = raiz;
    this.pista = raiz.querySelector('[data-carrusel-pista]');
    this.items = [...this.pista.children];
    this.botonAnterior = raiz.querySelector('[data-carrusel-anterior]');
    this.botonSiguiente = raiz.querySelector('[data-carrusel-siguiente]');
    this.intervaloAutoplay = Number(raiz.dataset.autoplay) || 0;
    this.indice = 0;
    this.temporizador = null;
    this.pausado = false;

    this.botonAnterior?.addEventListener('click', () => this.mover(-1, true));
    this.botonSiguiente?.addEventListener('click', () => this.mover(1, true));
    this.iniciarArrastre();
    this.iniciarAutoplay();
    new ResizeObserver(() => this.actualizar()).observe(this.raiz);
    this.actualizar();
  }

  visibles() {
    const valor = getComputedStyle(this.raiz).getPropertyValue('--visibles');
    return Math.max(1, parseInt(valor, 10) || 1);
  }

  indiceMaximo() {
    return Math.max(0, this.items.length - this.visibles());
  }

  mover(pasos, porUsuario = false) {
    const maximo = this.indiceMaximo();
    let nuevo = this.indice + pasos;
    // El avance automático vuelve al inicio al llegar al final.
    if (!porUsuario && nuevo > maximo) {
      nuevo = 0;
    }
    this.indice = Math.min(Math.max(nuevo, 0), maximo);
    this.actualizar();
  }

  actualizar() {
    this.indice = Math.min(this.indice, this.indiceMaximo());
    const primerItem = this.items[0];
    if (!primerItem) {
      return;
    }
    const espacio = parseFloat(getComputedStyle(this.pista).columnGap) || 0;
    const desplazamiento = this.indice * (primerItem.getBoundingClientRect().width + espacio);
    this.pista.style.transform = `translateX(${-desplazamiento}px)`;

    const sinDesplazamiento = this.indiceMaximo() === 0;
    this.raiz.classList.toggle('sin-desplazamiento', sinDesplazamiento);
    if (this.botonAnterior) {
      this.botonAnterior.disabled = this.indice === 0;
    }
    if (this.botonSiguiente) {
      this.botonSiguiente.disabled = this.indice >= this.indiceMaximo();
    }

    // Los elementos fuera de la vista no reciben foco con Tab.
    const visibles = this.visibles();
    this.items.forEach((item, posicion) => {
      const fuera = posicion < this.indice || posicion >= this.indice + visibles;
      item.inert = fuera;
    });
  }

  iniciarArrastre() {
    let inicioX = null;
    const ventana = this.raiz.querySelector('.carrusel__ventana');

    ventana.addEventListener('pointerdown', (evento) => {
      if (evento.pointerType === 'mouse') {
        return;
      }
      inicioX = evento.clientX;
    });

    ventana.addEventListener('pointerup', (evento) => {
      if (inicioX === null) {
        return;
      }
      const diferencia = evento.clientX - inicioX;
      inicioX = null;
      if (Math.abs(diferencia) > UMBRAL_ARRASTRE_PX) {
        this.mover(diferencia < 0 ? 1 : -1, true);
      }
    });

    ventana.addEventListener('pointercancel', () => {
      inicioX = null;
    });
  }

  iniciarAutoplay() {
    if (!this.intervaloAutoplay || prefiereMenosMovimiento()) {
      return;
    }
    const pausar = () => {
      this.pausado = true;
    };
    const reanudar = () => {
      this.pausado = false;
    };
    this.raiz.addEventListener('mouseenter', pausar);
    this.raiz.addEventListener('mouseleave', reanudar);
    this.raiz.addEventListener('focusin', pausar);
    this.raiz.addEventListener('focusout', reanudar);

    this.temporizador = window.setInterval(() => {
      if (!this.pausado && !document.hidden) {
        this.mover(1);
      }
    }, this.intervaloAutoplay);
  }
}

export function iniciarCarruseles() {
  document.querySelectorAll('[data-carrusel]').forEach((raiz) => new Carrusel(raiz));
}
