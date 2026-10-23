#ifndef TIPOS_H
#define TIPOS_H

#include <string>

// Color de una pieza del tablero
enum class Color {
    blanco,
    negro
};

// Tipo de pieza de ajedrez
enum class TipoPieza {
    peon,
    torre,
    caballo,
    alfil,
    reina,
    rey
};

// Casilla del tablero (ejemplo: "e4")
struct Casilla {
    std::string nombre;
};

// Resultado de validar una jugada
struct ResultadoValidacion {
    bool es_valida;
    std::string motivo;
};

#endif // TIPOS_H