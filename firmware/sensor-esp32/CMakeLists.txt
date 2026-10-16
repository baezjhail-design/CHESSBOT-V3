cmake_minimum_required(VERSION 3.16)
project(sensor-esp32 VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

file(GLOB SENSOR_SOURCES "src/**/*.cpp")

add_executable(sensor-esp32 ${SENSOR_SOURCES})