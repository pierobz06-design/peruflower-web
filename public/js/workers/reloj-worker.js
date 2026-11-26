// Reloj que no se ralentiza en pestañas ocultas: avisa cada N milisegundos.
let temporizador = null;

self.addEventListener('message', (evento) => {
  const intervalo = Number(evento.data) || 300;
  self.clearInterval(temporizador);
  temporizador = self.setInterval(() => self.postMessage('tic'), intervalo);
});
