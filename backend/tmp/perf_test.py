"""
Pruebas de rendimiento para los endpoints más críticos.

Uso:
    python tmp/perf_test.py --token <TOKEN_VALIDO> [--base-url http://localhost:8000] [--jwt <JWT_TOKEN>]

Ejemplos:
    python tmp/perf_test.py --token abc123
    python tmp/perf_test.py --token abc123 --jwt <token_de_sesion> --base-url http://localhost:8000
"""

import argparse
import time
import statistics
import requests

REPEAT = 5  # repeticiones por endpoint


def medir(label: str, fn, repeat: int = REPEAT):
    latencias = []
    errores = 0
    for _ in range(repeat):
        t0 = time.perf_counter()
        try:
            fn()
        except Exception:
            errores += 1
        latencias.append(time.perf_counter() - t0)
    validas = latencias[: repeat - errores] if errores < repeat else latencias
    print(
        f"  {label:<45} "
        f"p50={statistics.median(validas)*1000:6.0f}ms  "
        f"min={min(validas)*1000:6.0f}ms  "
        f"max={max(validas)*1000:6.0f}ms"
        + (f"  ⚠ {errores} errores" if errores else "")
    )
    return validas


def run(base_url: str, token: str | None, jwt: str | None):
    session = requests.Session()
    if jwt:
        session.headers["Authorization"] = f"Bearer {jwt}"

    print(f"\n{'='*70}")
    print(f"  Base URL : {base_url}")
    print(f"  Token QR : {token or '(no proporcionado)'}")
    print(f"  JWT auth : {'sí' if jwt else 'no (endpoints públicos omitidos)'}")
    print(f"  Reps     : {REPEAT}")
    print(f"{'='*70}\n")

    # ── 1. Health check (baseline de red) ──────────────────────────────────
    print("[ 1 ] Baseline de red")
    medir(
        "GET /api/health",
        lambda: session.get(f"{base_url}/api/health", timeout=10),
    )

    # ── 2. Token lookup (página de asistencia) ─────────────────────────────
    if token:
        print("\n[ 2 ] Lookup de token (página formato asistencia)")
        first_call = []
        medir(
            f"GET /api/sesion/{{token}}  — 1ª vez (sin caché)",
            lambda: session.get(f"{base_url}/api/sesion/{token}/", timeout=15),
            repeat=1,
        )
        medir(
            f"GET /api/sesion/{{token}}  — repetidas (con caché)",
            lambda: session.get(f"{base_url}/api/sesion/{token}/", timeout=15),
            repeat=REPEAT,
        )

    # ── 3. Listar sesiones (panel principal) ───────────────────────────────
    if jwt:
        print("\n[ 3 ] Listar sesiones (panel principal)")
        medir(
            "GET /api/sesiones/  — 1ª vez",
            lambda: session.get(f"{base_url}/api/sesiones/", timeout=30),
            repeat=1,
        )
        medir(
            "GET /api/sesiones/  — repetidas",
            lambda: session.get(f"{base_url}/api/sesiones/", timeout=30),
            repeat=REPEAT,
        )

    # ── 4. Generación de QR ────────────────────────────────────────────────
    if jwt and token:
        print("\n[ 4 ] Generación / entrega de QR")
        # Primero obtenemos una sesion_id buscando por token
        try:
            r = session.get(f"{base_url}/api/sesiones/", timeout=30)
            sesiones = r.json() if r.ok else []
            sesion_id = sesiones[0]["id"] if sesiones else None
        except Exception:
            sesion_id = None

        if sesion_id:
            medir(
                "GET /api/sesiones/{id}/qr  — 1ª vez (genera imagen)",
                lambda: session.get(f"{base_url}/api/sesiones/{sesion_id}/qr", timeout=15),
                repeat=1,
            )
            medir(
                "GET /api/sesiones/{id}/qr  — repetidas (con caché)",
                lambda: session.get(f"{base_url}/api/sesiones/{sesion_id}/qr", timeout=15),
                repeat=REPEAT,
            )
        else:
            print("  (sin sesiones disponibles para probar QR)")

    # ── 5. Búsqueda de asistente por cédula ───────────────────────────────
    print("\n[ 5 ] Búsqueda asistente por cédula (autocompletar)")
    medir(
        "GET /api/asistentes/99999999  — cédula inexistente",
        lambda: session.get(f"{base_url}/api/asistentes/99999999", timeout=10),
    )

    print(f"\n{'='*70}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pruebas de rendimiento FSD")
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--token", default=None, help="Token QR válido")
    parser.add_argument("--jwt", default=None, help="JWT de sesión (para endpoints auth)")
    args = parser.parse_args()

    run(args.base_url, args.token, args.jwt)
