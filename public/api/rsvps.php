<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . '/rsvps-data.json';

$seedRsvps = [
    [
        'id' => 'seed-1',
        'fullName' => 'Puan Mariam & Keluarga',
        'phone' => '012-3849201',
        'email' => '',
        'side' => 'bride',
        'status' => 'attending',
        'guestCount' => 4,
        'sessionTime' => '11:00 PAGI - Ketibaan Tetamu',
        'dietaryNotes' => '',
        'wishes' => 'Semoga ikatan perkahwinan Nabilah & Hidayat diberkati Allah SWT hingga ke Jannah. Selamat pengantin baru!',
        'createdAt' => '2026-11-14T09:30:00.000Z',
    ],
    [
        'id' => 'seed-2',
        'fullName' => 'Farhana Azmi',
        'phone' => '019-7412890',
        'email' => 'farhana@example.com',
        'side' => 'friend',
        'status' => 'attending',
        'guestCount' => 2,
        'sessionTime' => '12:45 TENGAH HARI - Perarakan Pengantin',
        'dietaryNotes' => '',
        'wishes' => 'Teruja untuk meraikan hari bahagia kalian dalam tema pastel! Semoga bahagia kekal abadi.',
        'createdAt' => '2026-11-15T14:15:00.000Z',
    ],
    [
        'id' => 'seed-3',
        'fullName' => 'Encik Razak & Puan Salma',
        'phone' => '013-9024418',
        'email' => '',
        'side' => 'groom',
        'status' => 'attending',
        'guestCount' => 2,
        'sessionTime' => '11:00 PAGI - Ketibaan Tetamu',
        'dietaryNotes' => 'Tiada makanan laut',
        'wishes' => 'Barakallahu lakuma wa baraka alaikuma. Semoga rumah tangga sentiasa dilimpahi sakinah, mawaddah dan rahmah.',
        'createdAt' => '2026-11-16T04:10:00.000Z',
    ],
];

function readRsvps(string $file, array $seed): array {
    if (!file_exists($file)) {
        @file_put_contents($file, json_encode($seed, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        return $seed;
    }
    $raw = @file_get_contents($file);
    if ($raw === false) {
        return $seed;
    }
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        return $decoded;
    }
    return $seed;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    echo json_encode(['rsvps' => readRsvps($dataFile, $seedRsvps)], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $rawBody = file_get_contents('php://input');
    $body = json_decode($rawBody ?: '{}', true);
    if (!is_array($body)) {
        $body = [];
    }

    $fullName = trim((string)($body['fullName'] ?? ''));
    $phone = trim((string)($body['phone'] ?? ''));
    $email = trim((string)($body['email'] ?? ''));
    $allowedSides = ['bride', 'groom', 'friend', 'colleague'];
    $side = in_array($body['side'] ?? '', $allowedSides, true) ? $body['side'] : 'friend';
    $status = ($body['status'] ?? '') === 'declining' ? 'declining' : 'attending';

    $rawCount = isset($body['guestCount']) ? (int)round((float)$body['guestCount']) : 1;
    $guestCount = $status === 'attending' ? min(6, max(1, $rawCount)) : 0;

    $rawSession = trim((string)($body['sessionTime'] ?? ''));
    $sessionTime = $status === 'attending'
        ? ($rawSession !== '' ? mb_substr($rawSession, 0, 64) : '11:00 PAGI - Ketibaan Tetamu')
        : 'Tidak Hadir';

    $dietaryNotes = mb_substr(trim((string)($body['dietaryNotes'] ?? '')), 0, 160);
    $wishes = mb_substr(trim((string)($body['wishes'] ?? '')), 0, 400);

    $nameLen = mb_strlen($fullName);
    if ($nameLen < 2 || $nameLen > 80) {
        http_response_code(400);
        echo json_encode(['error' => 'Sila masukkan nama penuh yang sah (2–80 aksara).'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $digits = preg_replace('/[^\d]/', '', $phone) ?? '';
    $digitLen = strlen($digits);
    if ($digitLen < 8 || $digitLen > 15) {
        http_response_code(400);
        echo json_encode(['error' => 'Sila masukkan nombor telefon yang sah (8–15 digit).'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Sila masukkan alamat e-mel yang sah.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $newEntry = [
        'id' => 'rsvp-' . round(microtime(true) * 1000) . '-' . substr(bin2hex(random_bytes(4)), 0, 5),
        'fullName' => $fullName,
        'phone' => $phone,
        'email' => $email,
        'side' => $side,
        'status' => $status,
        'guestCount' => $guestCount,
        'sessionTime' => $sessionTime,
        'dietaryNotes' => $dietaryNotes,
        'wishes' => $wishes,
        'createdAt' => gmdate('Y-m-d\TH:i:s.000\Z'),
    ];

    $current = readRsvps($dataFile, $seedRsvps);
    array_unshift($current, $newEntry);
    @file_put_contents($dataFile, json_encode($current, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

    http_response_code(201);
    echo json_encode(['rsvp' => $newEntry, 'rsvps' => $current], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
