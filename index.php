<?php
session_start();
$host = getenv('MYSQLHOST') ?: "localhost";
$user = getenv('MYSQLUSER') ?: "root";
$password = getenv('MYSQLPASSWORD') ?: "";
$dbname = getenv('MYSQLDATABASE') ?: "railway";
$port = getenv('MYSQLPORT') ?: "3306";
$conn = @new mysqli($host, $user, $password, $dbname, (int)$port);
if ($conn->connect_errno) { http_response_code(503); exit('Base de datos no disponible. Revisa las variables MYSQL de Railway.'); }
$conn->set_charset('utf8mb4');
$conn->query("CREATE TABLE IF NOT EXISTS usuarios (id INT AUTO_INCREMENT PRIMARY KEY, usuario VARCHAR(50) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, rol ENUM('dueno','admin','soporte','socio','usuario') DEFAULT 'usuario', creditos INT DEFAULT 10, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
$conn->query("CREATE TABLE IF NOT EXISTS keys_generadas (id INT AUTO_INCREMENT PRIMARY KEY, clave VARCHAR(80) UNIQUE NOT NULL, tipo VARCHAR(30) NOT NULL, creada_por INT NOT NULL, creada_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
function e($v){ return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function go($m=''){ header('Location: /'.($m?'?m='.urlencode($m):'')); exit; }
$msg = $_GET['m'] ?? '';
if (isset($_POST['setup'])) {
  $u=trim($_POST['usuario']??''); $p=$_POST['password']??'';
  $n=$conn->query("SELECT COUNT(*) n FROM usuarios")->fetch_assoc()['n'];
  if (!$n && strlen($u)>=3 && strlen($p)>=8) { $h=password_hash($p,PASSWORD_DEFAULT); $s=$conn->prepare("INSERT INTO usuarios(usuario,password,rol,creditos) VALUES(?,?, 'dueno', 999999)"); $s->bind_param('ss',$u,$h); $s->execute(); go('Dueño creado. Inicia sesión.'); }
  $msg='Completa usuario y una contraseña de al menos 8 caracteres.';
}
if (isset($_POST['login'])) {
  $u=trim($_POST['usuario']??''); $p=$_POST['password']??''; $s=$conn->prepare('SELECT id,usuario,password,rol,creditos FROM usuarios WHERE usuario=?'); $s->bind_param('s',$u); $s->execute(); $r=$s->get_result()->fetch_assoc();
  if ($r && password_verify($p,$r['password'])) { $_SESSION['uid']=$r['id']; $_SESSION['usuario']=$r['usuario']; $_SESSION['rol']=$r['rol']; $_SESSION['creditos']=$r['creditos']; go(); } $msg='Credenciales inválidas.';
}
if (isset($_GET['logout'])) { session_destroy(); go(); }
$auth=isset($_SESSION['uid']); $owner=$auth && in_array($_SESSION['rol'],['dueno','admin'],true);
if ($owner && isset($_POST['crear_key'])) { $tipo=$_POST['tipo']??'Fake Lag'; $clave=strtoupper($tipo).'-'.bin2hex(random_bytes(5)); $s=$conn->prepare('INSERT INTO keys_generadas(clave,tipo,creada_por) VALUES(?,?,?)'); $s->bind_param('ssi',$clave,$tipo,$_SESSION['uid']); $s->execute(); $msg='Key generada: '.$clave; }
if ($owner && isset($_POST['ajustar'])) { $id=(int)$_POST['id']; $c=max(0,(int)$_POST['creditos']); $s=$conn->prepare('UPDATE usuarios SET creditos=? WHERE id=?'); $s->bind_param('ii',$c,$id); $s->execute(); $msg='Créditos actualizados.'; }
$users=$owner?$conn->query('SELECT id,usuario,rol,creditos FROM usuarios ORDER BY id DESC'):null;
$keys=$owner?$conn->query('SELECT k.clave,k.tipo,k.creada_at,u.usuario FROM keys_generadas k JOIN usuarios u ON u.id=k.creada_por ORDER BY k.id DESC LIMIT 30'):null;
$empty=(int)$conn->query('SELECT COUNT(*) n FROM usuarios')->fetch_assoc()['n']===0;
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pikoro Panel</title><style>
:root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f7f7fb;background:#0d0d12}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 20% 0,#31205b 0,#0d0d12 42%)}.wrap{max-width:1050px;margin:auto;padding:28px 18px}.card{background:#171720dd;border:1px solid #ffffff18;border-radius:24px;padding:24px;box-shadow:0 15px 50px #0007;margin-bottom:18px}.login{max-width:420px;margin:9vh auto}.brand{font-size:28px;font-weight:800;margin-bottom:8px}.muted{color:#aaaabd}h1,h2{margin-top:0}input,select,button{width:100%;padding:12px 14px;border-radius:12px;border:1px solid #ffffff20;background:#22222d;color:#fff;margin:6px 0;font:inherit}button{background:#7957ff;border:0;font-weight:700;cursor:pointer}button:hover{filter:brightness(1.15)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}.top{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:18px}.top a{color:#c9bdff;text-decoration:none}.pill{display:inline-block;background:#2b2447;color:#cfc5ff;border-radius:99px;padding:5px 10px;font-size:12px}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:10px;border-bottom:1px solid #ffffff12;font-size:14px}.alert{padding:12px;border-radius:12px;background:#3b2b54;color:#e6dcff;margin:12px 0}.danger{color:#ff9d9d}
</style></head><body><main class="wrap">
<?php if(!$auth): ?><section class="card login"><div class="brand">✦ Pikoro Panel</div><p class="muted">Acceso seguro con roles y créditos.</p><?php if($msg): ?><div class="alert"><?=e($msg)?></div><?php endif; ?><?php if($empty): ?><h2>Crear dueño</h2><p class="muted">Es el primer acceso. Define tus credenciales.</p><form method="post"><input name="usuario" required minlength="3" placeholder="Usuario dueño"><input name="password" type="password" required minlength="8" placeholder="Contraseña (mínimo 8)"><button name="setup">Crear cuenta dueña</button></form><?php else: ?><h2>Iniciar sesión</h2><form method="post"><input name="usuario" required placeholder="Usuario"><input name="password" type="password" required placeholder="Contraseña"><button name="login">Entrar</button></form><?php endif; ?></section>
<?php else: ?><div class="top"><div><div class="brand">Pikoro Panel</div><span class="pill"><?=e($_SESSION['rol'])?></span> <span class="pill">Créditos: <?=e($_SESSION['creditos'])?></span></div><a href="?logout=1">Cerrar sesión</a></div><?php if($msg): ?><div class="alert"><?=e($msg)?></div><?php endif; ?><section class="grid"><div class="card"><h2>Hola, <?=e($_SESSION['usuario'])?> 👋</h2><p class="muted">Gestiona tus accesos desde un panel estilo iOS.</p></div><?php if($owner): ?><div class="card"><h2>Generar key</h2><form method="post"><select name="tipo"><option>Fake Lag</option><option>Proxy</option><option>APK Mod</option></select><button name="crear_key">Generar clave</button></form></div><?php endif; ?></section><?php if($owner): ?><section class="card"><h2>Usuarios y créditos</h2><table><tr><th>Usuario</th><th>Rol</th><th>Créditos</th><th>Acción</th></tr><?php while($u=$users->fetch_assoc()): ?><tr><td><?=e($u['usuario'])?></td><td><?=e($u['rol'])?></td><td><form method="post" style="display:flex;gap:6px"><input type="hidden" name="id" value="<?=e($u['id'])?>"><input type="number" name="creditos" value="<?=e($u['creditos'])?>" min="0"><button name="ajustar">Guardar</button></form></td><td></td></tr><?php endwhile; ?></table></section><section class="card"><h2>Keys recientes</h2><table><tr><th>Clave</th><th>Tipo</th><th>Creada por</th><th>Fecha</th></tr><?php while($k=$keys->fetch_assoc()): ?><tr><td><strong><?=e($k['clave'])?></strong></td><td><?=e($k['tipo'])?></td><td><?=e($k['usuario'])?></td><td><?=e($k['creada_at'])?></td></tr><?php endwhile; ?></table></section><?php endif; ?><section class="card"><h2>Estado</h2><p>Base de datos conectada correctamente.</p></section><?php endif; ?></main></body></html>
