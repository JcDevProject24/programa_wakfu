<?php
// ══════════════════════════════════════════
//  WAKFU PANEL — Exportar base de datos
//  GET → descarga un .sql con INSERT REPLACE
//       de las tablas: materiales, profesiones_items, archimonstruos
// ══════════════════════════════════════════

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=wakfu_panel;charset=utf8mb4',
        'root', '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'No se pudo conectar: ' . $e->getMessage()]);
    exit;
}

// ── Helpers ───────────────────────────────

function esc(PDO $pdo, $val): string {
    if ($val === null) return 'NULL';
    return $pdo->quote((string)$val);
}

function tableToInserts(PDO $pdo, string $table): string {
    $rows = $pdo->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);
    if (empty($rows)) return "-- (tabla `$table` vacía)\n";

    $cols = '`' . implode('`, `', array_keys($rows[0])) . '`';
    $lines = ["-- $table (" . count($rows) . " filas)"];
    foreach ($rows as $r) {
        $vals = implode(', ', array_map(fn($v) => esc($pdo, $v), array_values($r)));
        $lines[] = "INSERT INTO `$table` ($cols) VALUES ($vals)\n  ON DUPLICATE KEY UPDATE " .
            implode(', ', array_map(fn($c) => "`$c` = VALUES(`$c`)", array_keys($r))) . ';';
    }
    return implode("\n", $lines) . "\n";
}

// ── Construir SQL ─────────────────────────

$fecha  = date('Y-m-d_H-i');
$output = <<<HEADER
-- ══════════════════════════════════════════
--  WAKFU PANEL — Backup generado $fecha
--  Pega esto en phpMyAdmin > pestaña SQL
--  Usa INSERT … ON DUPLICATE KEY UPDATE
--  → seguro de ejecutar sobre datos existentes
-- ══════════════════════════════════════════

USE wakfu_panel;

HEADER;

foreach (['materiales', 'profesiones_items', 'archimonstruos'] as $table) {
    $output .= "\n" . tableToInserts($pdo, $table) . "\n";
}

// ── Enviar como descarga ──────────────────

header('Content-Type: text/plain; charset=utf-8');
header("Content-Disposition: attachment; filename=\"wakfu_backup_$fecha.sql\"");
header('Content-Length: ' . strlen($output));
echo $output;
