# Independent Python port of chenglou/handwired@257856e src/runtime/host-timing.ts
# (float64 host arithmetic only), written to check numbers quoted in the dossier.
import math, struct

TIME_GRID, STEP_MS, MAX_STEPS, SETTLE_STEPS = 64, 4, 300, 16

def fround(x):
    return struct.unpack('f', struct.pack('f', x))[0]

def q(t):  # quantizeTimeMs
    return round_half_up(t * TIME_GRID) / TIME_GRID + 0

def round_half_up(x):  # JS Math.round
    return math.floor(x + 0.5)

def count_steps(pending, budget):
    steps = math.floor(pending / STEP_MS)
    if steps > budget:
        return (0, 0, True)
    return (steps, pending - steps * STEP_MS, False)

def step_matrix(k, c, step_ms=STEP_MS):
    dt = step_ms / 1000
    keep = 1 - c * dt
    return (1 - k * dt * dt, dt * keep, -k * dt, keep)

def mul(a, b):
    return (a[0]*b[0]+a[1]*b[2], a[0]*b[1]+a[1]*b[3], a[2]*b[0]+a[3]*b[2], a[2]*b[1]+a[3]*b[3])

def power(m, n):
    r, s = (1, 0, 0, 1), m
    while n > 0:
        if n % 2 == 1: r = mul(r, s)
        n //= 2
        if n > 0: s = mul(s, s)
    return r

def bound(k, c):
    st = step_matrix(k, c); p = (1, 0, 0, 1); b = 1
    for _ in range(MAX_STEPS):
        p = mul(p, st); b = max(b, *[abs(e) for e in p])
    return fround(b * (1 + 1e-6))

# ---- advanceFrame planner (no program: 'animating' supplied by a callback) ----
def advance_frame(clock, frame_ts, events, animating_fn, write_back='every evaluation'):
    au, origin, last = clock
    check_int = STEP_MS * SETTLE_STEPS
    budget = [MAX_STEPS]
    st = {'au': au, 'origin': origin, 'last': last}
    earliest = last if last is not None else -math.inf
    frame_ms = max(q(frame_ts), earliest)
    log = []
    def run(kind, t, steps, settle, ev):
        wb = kind != 'frame' or write_back == 'every evaluation'
        sim = t if st['au'] is None else st['au'] + steps * STEP_MS
        dur = 0 if st['last'] is None else t - st['last']
        anim = animating_fn(kind, t, sim, steps, settle, ev)
        log.append(dict(kind=kind, timeMs=t, simulatedTimeMs=sim, durationMs=dur, steps=steps, settleCheck=settle, snap=kind=='snap', events=ev, writesBack=wb, animating=anim))
        if not wb: return
        budget[0] -= steps
        if st['au'] is None and anim: st['origin'] = t
        st['au'] = sim if anim else None
        st['last'] = t if anim else None
    def step_to(target, kind, ev):
        if st['au'] is not None and count_steps(target - st['au'], budget[0])[2]:
            st['au'] = None
            run('snap', target, 0, True, [])
        if st['au'] is not None:
            while st['au'] is not None:
                u = st['au']
                reach = u + count_steps(target - u, budget[0])[0] * STEP_MS
                nxt = st['origin'] + (math.floor((u - st['origin']) / check_int) + 1) * check_int
                if nxt > reach: break
                run('settle check', max(nxt, st['last'] if st['last'] is not None else nxt), (nxt - u) / STEP_MS, True, [])
        if st['au'] is None:
            run(kind, target, 0, True, ev); return
        run(kind, target, count_steps(target - st['au'], budget[0])[0], False, ev)
    timed = sorted([(min(frame_ms, max(earliest, q(e))), i, e) for i, e in enumerate(events)], key=lambda x: (x[0], x[1]))
    i = 0
    while i < len(timed):
        t = timed[i][0]; j = i
        while j < len(timed) and timed[j][0] == t: j += 1
        step_to(t, 'events', [x[2] for x in timed[i:j]]); i = j
    step_to(frame_ms, 'frame', [])
    return (st['au'], st['origin'], st['last']), log

if __name__ == '__main__':
    print('quantizeTimeMs(16.6667) =', q(16.6667))
    print('countSpringSteps(17.5, 300) =', count_steps(17.5, 300))
    print('countSpringSteps(1300, 300) =', count_steps(1300, 300))
    print('springStepMatrix(650,45) =', step_matrix(650, 45))
    print('springMatrixBound(650,45) =', bound(650, 45))
    m = step_matrix(650, 45)
    for n in (0, 1, 4, 300):
        print(f'M^{n} =', power(m, n))
    # Spring released from rest 20 px from destination (displacement -20 toward +20 travel), stepped in float64
    d, v, vmax, dmin = -20.0, 0.0, 0.0, 0.0
    k, c, dt = 650, 45, 0.004
    for s in range(2000):
        v = v + (-k * d - c * v) * dt; d = d + v * dt
        vmax = max(vmax, abs(v)); dmin = max(dmin, d)
    print('peak speed px/s =', vmax, ' max overshoot px =', dmin)
    # Time to settle (|d|<0.01 and |v|<0.01), and first settle-check multiple of 64 ms at which it holds
    d, v = -20.0, 0.0
    for s in range(1, 2000):
        v = v + (-k * d - c * v) * dt; d = d + v * dt
        if abs(d) < 0.01 and abs(v) < 0.01 and (s * 4) % 64 == 0:
            print('first settle check that settles: step', s, '=', s * 4, 'ms'); break

    print('\n--- Scenario A: idle clock, a press at t=1000.3 ms, frame at 1008.2 ms (stays animating) ---')
    clk = (None, 0, None)
    clk, log = advance_frame(clk, 1008.2, [1000.3], lambda *a: True, 'events and settle checks')
    for e in log: print(e)
    print('clock after', clk)
    print('\n--- next frames at 60 fps (16.6667 ms) ---')
    t = 1008.2
    for f in range(6):
        t += 1000 / 60
        clk, log = advance_frame(clk, t, [], lambda *a: True, 'events and settle checks')
        for e in log: print(round(t, 4), {k2: e[k2] for k2 in ('kind', 'timeMs', 'simulatedTimeMs', 'steps', 'settleCheck', 'writesBack')})
    print('\n--- Scenario B: same, every evaluation writes back ---')
    clk = (None, 0, None)
    clk, log = advance_frame(clk, 1008.2, [1000.3], lambda *a: True, 'every evaluation')
    t = 1008.2
    for f in range(6):
        t += 1000 / 60
        clk, log = advance_frame(clk, t, [], lambda *a: True, 'every evaluation')
        for e in log: print(round(t, 4), {k2: e[k2] for k2 in ('kind', 'timeMs', 'simulatedTimeMs', 'steps', 'settleCheck', 'writesBack')})
    print('\n--- Scenario C: a 10 fps frame (100 ms) while animating ---')
    clk = (None, 0, None)
    clk, log = advance_frame(clk, 0, [0], lambda *a: True, 'events and settle checks')
    for e in log: print({k2: e[k2] for k2 in ('kind', 'timeMs', 'simulatedTimeMs', 'steps', 'writesBack')})
    for t in (100, 200, 300):
        clk, log = advance_frame(clk, t, [], lambda *a: True, 'events and settle checks')
        for e in log: print(t, {k2: e[k2] for k2 in ('kind', 'timeMs', 'simulatedTimeMs', 'steps', 'settleCheck', 'writesBack')})
    print('\n--- Scenario D: 2 s stall while animating ---')
    clk = (None, 0, None)
    clk, log = advance_frame(clk, 0, [0], lambda *a: True, 'every evaluation')
    clk, log = advance_frame(clk, 16, [], lambda *a: True, 'every evaluation')
    clk, log = advance_frame(clk, 2016, [], lambda kind, *a: kind != 'snap' and False, 'every evaluation')
    for e in log: print({k2: e[k2] for k2 in ('kind', 'timeMs', 'simulatedTimeMs', 'durationMs', 'steps', 'snap', 'writesBack')})
    print('\n--- Scenario E: snap threshold, events and settle checks: event at 0, frame 60, next frame after gap ---')
    for gap in (1140, 1144, 1200, 1204):
        clk = (None, 0, None)
        clk, _ = advance_frame(clk, 0, [0], lambda *a: True, 'events and settle checks')
        clk, _ = advance_frame(clk, 60, [], lambda *a: True, 'events and settle checks')
        clk, log = advance_frame(clk, 60 + gap, [], lambda *a: True, 'events and settle checks')
        clkb = (None, 0, None)
        clkb, _ = advance_frame(clkb, 0, [0], lambda *a: True, 'every evaluation')
        clkb, _ = advance_frame(clkb, 60, [], lambda *a: True, 'every evaluation')
        clkb, logb = advance_frame(clkb, 60 + gap, [], lambda *a: True, 'every evaluation')
        print('gap', gap, 'commits-only snap:', any(e['kind'] == 'snap' for e in log), ' every-eval snap:', any(e['kind'] == 'snap' for e in logb))
