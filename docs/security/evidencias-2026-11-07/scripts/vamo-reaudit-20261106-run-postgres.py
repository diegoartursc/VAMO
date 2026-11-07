"""Run only against a new disposable PostgreSQL cluster on loopback."""
import json
import os
import shutil
import socket
import subprocess
import tempfile
from pathlib import Path

root = Path.cwd()
out = Path(os.environ.get('VAMO_REAUDIT_OUTPUT', '/tmp/vamo-reaudit-20261106'))
scripts = Path(os.environ.get('VAMO_REAUDIT_SCRIPTS', '/tmp'))
pg_bin = Path(os.environ.get('VAMO_REAUDIT_PG_BIN', '/opt/homebrew/opt/postgresql@17/bin'))
out.mkdir(parents=True, exist_ok=True)
cluster = Path(tempfile.mkdtemp(prefix='vamo-pg-1106-', dir='/tmp'))
(cluster / 'socket').mkdir()
env = {k: os.environ[k] for k in ('PATH', 'HOME', 'TMPDIR', 'LANG') if k in os.environ}
sock = socket.socket()
sock.bind(('127.0.0.1', 0))
port = sock.getsockname()[1]
sock.close()
summary = {'cluster': 'disposable-local-only', 'port': port, 'migrations': 0}
started = False

def run(args, log):
    p = subprocess.run([str(a) for a in args], env=env, stdout=log, stderr=subprocess.STDOUT, timeout=90)
    if p.returncode:
        raise RuntimeError(f'command failed exit {p.returncode}: {Path(args[0]).name}')

try:
    with (out / 'postgres-setup.txt').open('w') as log:
        run([pg_bin / 'initdb', '-D', cluster / 'data', '-U', 'audit', '--no-locale', '-A', 'trust'], log)
        run([pg_bin / 'pg_ctl', '-D', cluster / 'data', '-l', cluster / 'server.log', '-o', f'-h 127.0.0.1 -p {port} -k {cluster}/socket', '-w', 'start'], log)
        started = True
        run([pg_bin / 'createdb', '-h', '127.0.0.1', '-p', str(port), '-U', 'audit', 'vamo_audit_20261106'], log)
        for migration in sorted((root / 'apps/backend/prisma/migrations').glob('*/migration.sql')):
            run([pg_bin / 'psql', '-h', '127.0.0.1', '-p', str(port), '-U', 'audit', '-d', 'vamo_audit_20261106', '-v', 'ON_ERROR_STOP=1', '-f', migration], log)
            summary['migrations'] += 1
    env['VAMO_REAUDIT_DB_URL'] = f'postgresql://audit@127.0.0.1:{port}/vamo_audit_20261106'
    with (out / 'postgres-integration.jsonl').open('w') as log:
        p = subprocess.run([str(root / 'node_modules/.bin/tsx'), '--import', str(scripts / 'vamo-reaudit-20261106-auth-isolate.ts'), str(scripts / 'vamo-reaudit-20261106-postgres.ts')], env=env, stdout=log, stderr=subprocess.STDOUT, timeout=90)
    summary['integration_exit_code'] = p.returncode
except Exception as error:
    summary['error'] = str(error)
    if (cluster / 'server.log').exists():
        (out / 'postgres-server.txt').write_text((cluster / 'server.log').read_text())
finally:
    if started:
        p = subprocess.run([str(pg_bin / 'pg_ctl'), '-D', str(cluster / 'data'), '-m', 'fast', '-w', 'stop'], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=30)
        summary['stopped'] = p.returncode == 0
    if not started or summary.get('stopped'):
        shutil.rmtree(cluster)
        summary['temporary_cluster_removed'] = True
    (out / 'postgres-run.json').write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary))
if 'error' in summary or summary.get('integration_exit_code') != 0:
    raise SystemExit(1)
