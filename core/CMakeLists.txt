cmake_minimum_required(VERSION 3.16)
project(chessbot-core VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Directorio de includes
include_directories(include)

# Fuentes del núcleo
file(GLOB CORE_SOURCES "src/**/*.cpp")

add_executable(chessbot-core ${CORE_SOURCES})

target_compile_options(chessbot-core PRIVATE -Wall -Wextra -Wpedantic)

# Pruebas
enable_testing()
add_subdirectory(tests)