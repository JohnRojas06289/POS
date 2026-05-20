-- Crear base de datos para desarrollo
CREATE DATABASE nexus_dev;

-- Conectar a nexus_global y crear extensiones
\c nexus_global
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Conectar a nexus_dev y crear extensiones
\c nexus_dev
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
