-- CreateTable
CREATE TABLE `invitados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_consorcio` INTEGER NULL,
    `uf` VARCHAR(512) NULL,
    `txt_nombre` VARCHAR(512) NULL,
    `txt_documento` VARCHAR(512) NULL,
    `txt_patente` VARCHAR(512) NULL,
    `txt_marca_veh` VARCHAR(512) NULL,
    `txt_motivo` VARCHAR(512) NULL,
    `fec_valido_desde` DATE NULL,
    `cant_dias_valido` INTEGER NULL,
    `id_tipo_entrada` INTEGER NULL DEFAULT 1,
    `id_tipo_invitado` INTEGER NULL DEFAULT 1,
    `id_tipo_reingreso` INTEGER NULL DEFAULT 1,
    `id_tipo_ingreso` INTEGER NULL DEFAULT 1,
    `fec_carga` DATETIME NULL,
    `fec_ingreso` DATETIME NULL,
    `fec_bajada` DATETIME NULL,
    `avisar_propietario` VARCHAR(512) NULL,
    `basapp_read_date` DATETIME NULL,
    `basapp_id` VARCHAR(512) NULL,

    INDEX `invitados_id_tipo_invitado_id_consorcio_idx`(`id_tipo_invitado`, `id_consorcio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ufsocios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_consorcio` INTEGER NULL,
    `fecha_moficacion` DATETIME(3) NULL,
    `fecha_eliminacion` DATETIME NULL,
    `momento` DATETIME NULL,
    `nombre` VARCHAR(512) NULL,
    `uf` VARCHAR(512) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
