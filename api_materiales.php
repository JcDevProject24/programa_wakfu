<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=wakfu_panel;charset=utf8mb4',
        'root', '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

switch ($_SERVER['REQUEST_METHOD']) {

    case 'GET':
        $rows = $pdo->query('SELECT nombre, precio FROM materiales ORDER BY nombre ASC')
                    ->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(array_map(function($r) {
            return ['nombre' => $r['nombre'], 'precio' => (int)$r['precio']];
        }, $rows));
        break;

    case 'POST':
        $d = json_decode(file_get_contents('php://input'), true);
        if (!$d || !isset($d['nombre']) || trim($d['nombre']) === '') {
            http_response_code(400); echo json_encode(['error' => 'Falta nombre']); exit;
        }
        $pdo->prepare(
            'INSERT INTO materiales (nombre, precio) VALUES (:n, :p)
             ON DUPLICATE KEY UPDATE precio = VALUES(precio)'
        )->execute([
            ':n' => trim($d['nombre']),
            ':p' => max(0, (int)($d['precio'] ?? 0))
        ]);
        echo json_encode(['ok' => true]);
        break;

    case 'DELETE':
        $nombre = urldecode($_GET['nombre'] ?? '');
        if (!$nombre) { http_response_code(400); echo json_encode(['error' => 'Falta nombre']); exit; }
        $pdo->prepare('DELETE FROM materiales WHERE nombre = ?')->execute([$nombre]);
        echo json_encode(['ok' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
}
