<?php
// ══════════════════════════════════════════
//  WAKFU PANEL — Limpiar sección de BD
//  POST { seccion: 'profesiones' | 'archimonstruos' }
// ══════════════════════════════════════════
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'Método no permitido']); exit;
}

$d = json_decode(file_get_contents('php://input'), true);
$seccion = $d['seccion'] ?? '';

$tablas = [
    'profesiones'    => ['profesiones_items', 'materiales'],
    'archimonstruos' => ['archimonstruos'],
];

if (!isset($tablas[$seccion])) {
    http_response_code(400); echo json_encode(['error' => 'Sección no válida']); exit;
}

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=wakfu_panel;charset=utf8mb4',
        'root', '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500); echo json_encode(['error' => $e->getMessage()]); exit;
}

foreach ($tablas[$seccion] as $tabla) {
    $pdo->exec("TRUNCATE TABLE `$tabla`");
}

echo json_encode(['ok' => true]);