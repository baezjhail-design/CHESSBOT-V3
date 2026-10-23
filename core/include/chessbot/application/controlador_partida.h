#ifndef CONTROLADOR_PARTIDA_H
#define CONTROLADOR_PARTIDA_H

#include "../domain/tipos.h"

// Estados del juego
enum class EstadoPartida {
    esperando,
    pensando,
    ejecutando_movimiento,
    terminado
};

// Controla el flujo de la partida
class ControladorPartida {
public:
    EstadoPartida obtener_estado() const;
    bool recibir_movimiento_humano(const Casilla& desde, const Casilla& hasta);
    void calcular_respuesta_ia();
    void confirmar_movimiento_robot();
};

#endif // CONTROLADOR_PARTIDA_H