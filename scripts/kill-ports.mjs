// scripts/kill-ports.mjs
// Знімає процеси, що слухають dev-порти (3000 — web, 4000 — api).
// Потрібен тому, що Ctrl+C не завжди встигає прибити дочірні node-процеси
// (ts-node-dev / next start-server), і наступний `npm start` падає на зайнятому порту.

import { execSync } from 'node:child_process';

const PORTS = [3000, 4000];
const isWindows = process.platform === 'win32';

/** PID-и, що слухають порт. Порожній масив, якщо порт вільний. */
function findPids(port) {
  try {
    if (isWindows) {
      const out = execSync(`netstat -ano -p tcp`, { encoding: 'utf8' });
      return [
        ...new Set(
          out
            .split('\n')
            .filter((l) => l.includes('LISTENING') && new RegExp(`:${port}\\s`).test(l))
            .map((l) => l.trim().split(/\s+/).pop())
            .filter((pid) => pid && pid !== '0'),
        ),
      ];
    }
    const out = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: 'utf8' });
    return out.split('\n').filter(Boolean);
  } catch {
    return []; // netstat/lsof нічого не знайшли — порт вільний
  }
}

function kill(pid) {
  try {
    execSync(isWindows ? `taskkill /PID ${pid} /F /T` : `kill -9 ${pid}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false; // процес уже помер або належить іншому користувачу
  }
}

let killed = 0;

for (const port of PORTS) {
  const pids = findPids(port);

  if (pids.length === 0) {
    console.log(`  порт ${port} — вільний`);
    continue;
  }

  for (const pid of pids) {
    if (kill(pid)) {
      console.log(`  порт ${port} — зупинено процес ${pid}`);
      killed++;
    } else {
      console.log(`  порт ${port} — не вдалось зупинити ${pid} (можливо, вже завершився)`);
    }
  }
}

console.log(killed > 0 ? `Звільнено портів: ${killed}` : 'Dev-сервери не запущені');
