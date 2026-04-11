-- ══════════════════════════════════════════
--  WAKFU PANEL — Setup de base de datos
--  Pega esto en phpMyAdmin > pestaña SQL
-- ══════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS wakfu_panel
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE wakfu_panel;

CREATE TABLE IF NOT EXISTS archimonstruos (
    id             VARCHAR(20)   NOT NULL PRIMARY KEY,
    nombre         VARCHAR(100)  NOT NULL,
    nivel          SMALLINT      NOT NULL,
    region         VARCHAR(100)  DEFAULT NULL,
    lugar          VARCHAR(100)  DEFAULT NULL,
    loots          JSON          DEFAULT NULL,
    respawn_min    INT           NOT NULL,
    respawn_custom TINYINT(1)    NOT NULL DEFAULT 0,
    ultima_muerte  BIGINT        DEFAULT NULL   -- timestamp en milisegundos (JS)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Catálogo compartido de materiales
-- El precio aquí es la fuente de verdad: se lee en todos los crafteos que usen ese material
CREATE TABLE IF NOT EXISTS materiales (
    nombre  VARCHAR(100) NOT NULL PRIMARY KEY,  -- clave por nombre normalizado
    precio  INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS profesiones_items (
    id                 VARCHAR(20)   NOT NULL PRIMARY KEY,
    nombre             VARCHAR(100)  NOT NULL,
    nombre_alternativo VARCHAR(100)  DEFAULT NULL,  -- nombre de la versión rara (recolección)
    profesion          VARCHAR(50)   NOT NULL,
    categoria          VARCHAR(20)   NOT NULL DEFAULT 'crafteo', -- 'crafteo' | 'recoleccion' | 'material'
    rareza_mat         VARCHAR(10)   DEFAULT NULL,   -- 'normal' | 'raro' | 'semilla' (solo recolección)
    grupo_recoleccion  VARCHAR(100)  DEFAULT NULL,   -- nombre base del grupo (ej. "Fibra Tosca"), para agrupar normal+raro+semilla
    lugar              VARCHAR(150)  DEFAULT NULL,   -- zona/lugar donde se recolecta
    nivel_item         SMALLINT      DEFAULT NULL,
    nivel_profesion    SMALLINT      DEFAULT NULL,
    tipo               VARCHAR(50)   DEFAULT NULL,   -- subtipo equipable
    rareza             VARCHAR(20)   DEFAULT NULL,
    materiales         JSON          DEFAULT NULL,   -- [{nombre, cantidad}]  SIN precio (precio viene del catálogo)
    recetas_alt        JSON          DEFAULT NULL,   -- [[{nombre,cantidad}], …] recetas alternativas (solo crafteo básicos)
    comprados          INT           NOT NULL DEFAULT 0,
    en_venta           INT           NOT NULL DEFAULT 0,
    vendidos           INT           NOT NULL DEFAULT 0,
    historial_precios  JSON          DEFAULT NULL    -- [{precio, fecha, vendido}]
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ══════════════════════════════════════════
--  ACTUALIZACIÓN (ejecutar solo si ya tenías
--  la tabla profesiones_items creada antes)
-- ══════════════════════════════════════════
-- ALTER TABLE profesiones_items
--   ADD COLUMN IF NOT EXISTS nombre_alternativo VARCHAR(100) DEFAULT NULL,
--   ADD COLUMN IF NOT EXISTS rareza_mat VARCHAR(10) DEFAULT NULL,
--   ADD COLUMN IF NOT EXISTS grupo_recoleccion VARCHAR(100) DEFAULT NULL,
--   ADD COLUMN IF NOT EXISTS lugar VARCHAR(150) DEFAULT NULL;

-- Añadir columna recetas_alt (si ya tenías la tabla creada):
ALTER TABLE profesiones_items
  ADD COLUMN IF NOT EXISTS recetas_alt JSON DEFAULT NULL;
