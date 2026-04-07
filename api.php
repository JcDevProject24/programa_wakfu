<?php
// ══════════════════════════════════════════
//  WAKFU PANEL — API REST
//  GET    → devuelve todos los archimonstruos
//  POST   → crea o actualiza un archimonstruo
//  DELETE → elimina un archimonstruo (?id=xxx)
// ══════════════════════════════════════════

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// ── Conexión ──────────────────────────────
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=wakfu_panel;charset=utf8mb4',
        'root', '',   // usuario y contraseña de XAMPP por defecto
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo conectar a la BD: ' . $e->getMessage()]);
    exit;
}

// ── Rutas ─────────────────────────────────
switch ($_SERVER['REQUEST_METHOD']) {

    // ── Obtener todos ──
    case 'GET':
        $rows = $pdo->query('SELECT * FROM archimonstruos ORDER BY nombre ASC')
                    ->fetchAll(PDO::FETCH_ASSOC);

        $out = array_map(function($r) {
            return [
                'id'             => $r['id'],
                'nombre'         => $r['nombre'],
                'nivel'          => (int)$r['nivel'],
                'region'         => $r['region'],
                'lugar'          => $r['lugar'],
                'loots'          => json_decode($r['loots'] ?? '[]', true) ?: [],
                'respawnMinutos' => (int)$r['respawn_min'],
                'respawnCustom'  => (bool)$r['respawn_custom'],
                'ultimaMuerte'   => $r['ultima_muerte'] !== null ? (int)$r['ultima_muerte'] : null,
            ];
        }, $rows);

        echo json_encode($out);
        break;

    // ── Crear o actualizar ──
    case 'POST':
        $d = json_decode(file_get_contents('php://input'), true);

        if (!$d || empty($d['id']) || empty($d['nombre'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos inválidos']);
            exit;
        }

        $stmt = $pdo->prepare('
            INSERT INTO archimonstruos
                (id, nombre, nivel, region, lugar, loots, respawn_min, respawn_custom, ultima_muerte)
            VALUES
                (:id, :nombre, :nivel, :region, :lugar, :loots, :respawnMin, :respawnCustom, :ultimaMuerte)
            ON DUPLICATE KEY UPDATE
                nombre         = VALUES(nombre),
                nivel          = VALUES(nivel),
                region         = VALUES(region),
                lugar          = VALUES(lugar),
                loots          = VALUES(loots),
                respawn_min    = VALUES(respawn_min),
                respawn_custom = VALUES(respawn_custom),
                ultima_muerte  = VALUES(ultima_muerte)
        ');

        $stmt->execute([
            ':id'            => $d['id'],
            ':nombre'        => $d['nombre'],
            ':nivel'         => (int)($d['nivel'] ?? 1),
            ':region'        => $d['region'] ?: null,
            ':lugar'         => $d['lugar'] ?: null,
            ':loots'         => json_encode($d['loots'] ?? []),
            ':respawnMin'    => (int)($d['respawnMinutos'] ?? 60),
            ':respawnCustom' => empty($d['respawnCustom']) ? 0 : 1,
            ':ultimaMuerte'  => isset($d['ultimaMuerte']) ? (int)$d['ultimaMuerte'] : null,
        ]);

        echo json_encode(['ok' => true]);
        break;

    // ── Eliminar ──
    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el id']);
            exit;
        }
        $stmt = $pdo->prepare('DELETE FROM archimonstruos WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['ok' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
}
