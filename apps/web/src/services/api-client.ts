// Cliente para hablar con el servidor (API)

export async function obtenerEstadoPartida(): Promise<any> {
  const respuesta = await fetch('/api/v1/partida/estado');
  return respuesta.json();
}

export async function crearPartidaNueva(): Promise<any> {
  const respuesta = await fetch('/api/v1/partida/nueva', {
    method: 'POST'
  });
  return respuesta.json();
}