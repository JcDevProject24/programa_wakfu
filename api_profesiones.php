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
    echo json_encode(['error' => 'No se pudo conectar: ' . $e->getMessage()]);
    exit;
}

switch ($_SERVER['REQUEST_METHOD']) {

    case 'GET':
        $rows = $pdo->query('SELECT * FROM profesiones_items ORDER BY nombre ASC')
                    ->fetchAll(PDO::FETCH_ASSOC);
        $out = array_map(function($r) {
            return [
                'id'                 => $r['id'],
                'nombre'             => $r['nombre'],
                'nombre_alternativo' => $r['nombre_alternativo'],
                'profesion'          => $r['profesion'],
                'categoria'          => $r['categoria'],
                'rareza_mat'         => $r['rareza_mat'],
                'grupo_recoleccion'  => $r['grupo_recoleccion'],
                'lugar'              => $r['lugar'],
                'nivel_item'         => $r['nivel_item']      ? (int)$r['nivel_item']      : null,
                'nivel_profesion'    => $r['nivel_profesion'] ? (int)$r['nivel_profesion'] : null,
                'tipo'               => $r['tipo'],
                'rareza'             => $r['rareza'],
                'materiales'         => json_decode($r['materiales']        ?? '[]', true) ?: [],
                'recetas_alt'        => json_decode($r['recetas_alt']        ?? '[]', true) ?: [],
                'historial_precios'  => json_decode($r['historial_precios'] ?? '[]', true) ?: [],
                'comprados'          => (int)$r['comprados'],
                'en_venta'           => (int)$r['en_venta'],
                'vendidos'           => (int)$r['vendidos'],
            ];
        }, $rows);
        echo json_encode($out);
        break;

    case 'POST':
        $d = json_decode(file_get_contents('php://input'), true);
        if (!$d || empty($d['id']) || empty($d['nombre'])) {
            http_response_code(400); echo json_encode(['error' => 'Datos inválidos']); exit;
        }
        $stmt = $pdo->prepare('
            INSERT INTO profesiones_items
                (id, nombre, nombre_alternativo, profesion, categoria, rareza_mat, grupo_recoleccion, lugar,
                 nivel_item, nivel_profesion, tipo, rareza,
                 materiales, recetas_alt, comprados, en_venta, vendidos, historial_precios)
            VALUES
                (:id, :nombre, :nombre_alt, :profesion, :categoria, :rareza_mat, :grupo_rec, :lugar,
                 :nivel_item, :nivel_profesion, :tipo, :rareza,
                 :materiales, :recetas_alt, :comprados, :en_venta, :vendidos, :historial)
            ON DUPLICATE KEY UPDATE
                nombre=VALUES(nombre), nombre_alternativo=VALUES(nombre_alternativo),
                profesion=VALUES(profesion), categoria=VALUES(categoria),
                rareza_mat=VALUES(rareza_mat), grupo_recoleccion=VALUES(grupo_recoleccion), lugar=VALUES(lugar),
                nivel_item=VALUES(nivel_item), nivel_profesion=VALUES(nivel_profesion),
                tipo=VALUES(tipo), rareza=VALUES(rareza), materiales=VALUES(materiales),
                recetas_alt=VALUES(recetas_alt), comprados=VALUES(comprados), en_venta=VALUES(en_venta),
                vendidos=VALUES(vendidos), historial_precios=VALUES(historial_precios)
        ');
        $stmt->execute([
            ':id'             => $d['id'],
            ':nombre'         => $d['nombre'],
            ':nombre_alt'     => $d['nombre_alternativo'] ?? null,
            ':profesion'      => $d['profesion'],
            ':categoria'      => $d['categoria']  ?? 'crafteo',
            ':rareza_mat'     => $d['rareza_mat']        ?? null,
            ':grupo_rec'      => $d['grupo_recoleccion'] ?? null,
            ':lugar'          => $d['lugar']             ?? null,
            ':nivel_item'     => $d['nivel_item']       ?? null,
            ':nivel_profesion'=> $d['nivel_profesion']  ?? null,
            ':tipo'           => $d['tipo']    ?? null,
            ':rareza'         => $d['rareza']  ?? null,
            ':materiales'     => json_encode($d['materiales']       ?? []),
            ':recetas_alt'    => json_encode($d['recetas_alt']      ?? []),
            ':comprados'      => (int)($d['comprados'] ?? 0),
            ':en_venta'       => (int)($d['en_venta']  ?? 0),
            ':vendidos'       => (int)($d['vendidos']  ?? 0),
            ':historial'      => json_encode($d['historial_precios'] ?? []),
        ]);
        echo json_encode(['ok' => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'Falta id']); exit; }
        $pdo->prepare('DELETE FROM profesiones_items WHERE id = ?')->execute([$id]);
        echo json_encode(['ok' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
}
