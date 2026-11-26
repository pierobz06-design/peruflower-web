-- =====================================================================
-- Base de datos de Peruflower.com (Perú Flowers) - MySQL 8.4
-- Crea la base y todas las tablas. Se puede ejecutar varias veces:
-- solo crea lo que todavía no existe.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS peruflower
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE peruflower;

-- ---------------------------------------------------------------------
-- Ocasiones del catálogo (Cumpleaños, Para Mamá, Condolencias, Arreglos, Box)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id           SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(60)  NOT NULL,
  slug         VARCHAR(70)  NOT NULL,
  descripcion  VARCHAR(255) NULL,
  imagen       VARCHAR(255) NULL COMMENT 'Ruta pública, ej. /img/ocasiones/cumpleanos.webp',
  orden        TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_nombre (nombre),
  UNIQUE KEY uq_categorias_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- Productos (arreglos florales)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sku            VARCHAR(30)  NOT NULL,
  nombre         VARCHAR(120) NOT NULL,
  slug           VARCHAR(140) NOT NULL,
  descripcion    TEXT         NOT NULL,
  precio         DECIMAL(10,2) NOT NULL,
  precio_oferta  DECIMAL(10,2) NULL,
  categoria_id   SMALLINT UNSIGNED NOT NULL COMMENT 'Categoría principal',
  imagen         VARCHAR(255) NOT NULL COMMENT 'Ruta pública, ej. /img/productos/ramo-20-rosas.webp',
  disponible     TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = hay stock',
  visible        TINYINT(1) NOT NULL DEFAULT 1 COMMENT '0 = oculto desde el panel',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_productos_sku (sku),
  UNIQUE KEY uq_productos_slug (slug),
  KEY idx_productos_categoria (categoria_id),
  KEY idx_productos_catalogo (visible, disponible, precio),
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id)
    REFERENCES categorias (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_productos_precio CHECK (precio > 0),
  CONSTRAINT chk_productos_oferta CHECK (precio_oferta IS NULL OR (precio_oferta > 0 AND precio_oferta < precio))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- Relación producto - ocasión (un arreglo puede servir para varias ocasiones)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS producto_categorias (
  producto_id   INT UNSIGNED NOT NULL,
  categoria_id  SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (producto_id, categoria_id),
  KEY idx_producto_categorias_categoria (categoria_id),
  CONSTRAINT fk_producto_categorias_producto FOREIGN KEY (producto_id)
    REFERENCES productos (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_producto_categorias_categoria FOREIGN KEY (categoria_id)
    REFERENCES categorias (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- Clientes registrados (HU06)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id                         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombres                    VARCHAR(80)  NOT NULL,
  apellidos                  VARCHAR(80)  NOT NULL,
  email                      VARCHAR(160) NOT NULL,
  telefono                   VARCHAR(15)  NOT NULL,
  password_hash              CHAR(60)     NOT NULL COMMENT 'bcrypt',
  acepta_privacidad          TINYINT(1)   NOT NULL COMMENT 'Ley N.° 29733',
  fecha_acepta_privacidad    DATETIME     NOT NULL,
  acepta_promociones         TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Ley N.° 28493',
  fecha_acepta_promociones   DATETIME     NULL,
  created_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clientes_email (email),
  CONSTRAINT chk_clientes_privacidad CHECK (acepta_privacidad = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- Zonas de entrega: distritos de Lima y Callao (HU09)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zonas_entrega (
  id              SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  distrito        VARCHAR(60) NOT NULL,
  provincia       ENUM('Lima', 'Callao') NOT NULL,
  costo           DECIMAL(10,2) NOT NULL,
  es_referencial  TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = costo de ejemplo, por confirmar con el negocio',
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_zonas_entrega_distrito (distrito),
  CONSTRAINT chk_zonas_entrega_costo CHECK (costo >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- Pedidos (HU08, HU10, HU11)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(12)  NULL COMMENT 'Número de pedido visible, ej. PF-000001',
  cliente_id          INT UNSIGNED NOT NULL,
  receptor_nombre     VARCHAR(120) NOT NULL,
  receptor_telefono   VARCHAR(15)  NOT NULL,
  zona_entrega_id     SMALLINT UNSIGNED NOT NULL COMMENT 'Distrito de entrega',
  direccion           VARCHAR(200) NOT NULL,
  referencia          VARCHAR(200) NULL,
  fecha_entrega       DATE         NOT NULL,
  horario_entrega     VARCHAR(40)  NOT NULL,
  dedicatoria         VARCHAR(300) NULL,
  subtotal            DECIMAL(10,2) NOT NULL,
  costo_envio         DECIMAL(10,2) NOT NULL,
  total               DECIMAL(10,2) NOT NULL,
  metodo_pago         ENUM('tarjeta', 'yape', 'plin', 'whatsapp') NULL COMMENT 'Se completa al elegir el pago',
  codigo_operacion    VARCHAR(20)  NULL COMMENT 'Número de operación Yape/Plin',
  tarjeta_ultimos4    CHAR(4)      NULL COMMENT 'Solo los últimos 4 dígitos; nunca la tarjeta completa',
  estado              ENUM('Pendiente', 'Pagado', 'Entregado') NOT NULL DEFAULT 'Pendiente',
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pedidos_codigo (codigo),
  KEY idx_pedidos_cliente (cliente_id),
  KEY idx_pedidos_zona (zona_entrega_id),
  KEY idx_pedidos_estado_fecha (estado, created_at),
  KEY idx_pedidos_fecha_entrega (fecha_entrega),
  CONSTRAINT fk_pedidos_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_pedidos_zona FOREIGN KEY (zona_entrega_id)
    REFERENCES zonas_entrega (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_pedidos_montos CHECK (subtotal >= 0 AND costo_envio >= 0 AND total = subtotal + costo_envio),
  CONSTRAINT chk_pedidos_ultimos4 CHECK (tarjeta_ultimos4 IS NULL OR tarjeta_ultimos4 REGEXP '^[0-9]{4}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- Detalle de cada pedido (productos, cantidades y precios al momento de comprar)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_pedido (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pedido_id        INT UNSIGNED NOT NULL,
  producto_id      INT UNSIGNED NOT NULL,
  nombre_producto  VARCHAR(120) NOT NULL,
  precio_unitario  DECIMAL(10,2) NOT NULL,
  cantidad         SMALLINT UNSIGNED NOT NULL,
  subtotal         DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_detalle_pedido_producto (pedido_id, producto_id),
  KEY idx_detalle_pedido_producto (producto_id),
  CONSTRAINT fk_detalle_pedido_pedido FOREIGN KEY (pedido_id)
    REFERENCES pedidos (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_detalle_pedido_producto FOREIGN KEY (producto_id)
    REFERENCES productos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_detalle_pedido_cantidad CHECK (cantidad BETWEEN 1 AND 50),
  CONSTRAINT chk_detalle_pedido_subtotal CHECK (subtotal = precio_unitario * cantidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- Personal con acceso al panel de administración (HU05, HU10)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS administradores (
  id              SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(100) NOT NULL,
  email           VARCHAR(160) NOT NULL,
  password_hash   CHAR(60)     NOT NULL COMMENT 'bcrypt',
  activo          TINYINT(1)   NOT NULL DEFAULT 1,
  ultimo_acceso   DATETIME     NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_administradores_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- Sesiones de inicio de sesión (tabla técnica usada por express-mysql-session)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  session_id  VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  expires     INT UNSIGNED NOT NULL,
  data        MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (session_id),
  KEY idx_sessions_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
