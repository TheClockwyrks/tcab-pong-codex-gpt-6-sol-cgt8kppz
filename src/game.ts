import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import * as C from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
  readonly muted: boolean;
  readonly menuPress?: { readonly id: number; readonly index: number } | null;
}
export interface MenuRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface CaromSnapshot extends Omit<CaromState, "ball" | "menuPress"> {
  version: number;
  ball: (BallState & { speed: number }) | null;
}
export interface CaromDebugApi {
  version: number;
  clearWorld(s: DeepReadonly<CaromState>): CaromState;
  spawnBall(s: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(s: DeepReadonly<CaromState>, index: number): CaromState;
  reset(s: DeepReadonly<CaromState>): CaromState;
  reconcile(s: DeepReadonly<CaromState>): CaromState;
  setScreen(s: DeepReadonly<CaromState>, screen: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, mode: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, index: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, index: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    screen: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, side: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, side: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, side: Side, cy: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, side: Side, vy: number): CaromState;
  setPaddleDriven(
    s: DeepReadonly<CaromState>,
    side: Side,
    driven: boolean,
  ): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    vx: number,
    vy: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, spin: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, held: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, seconds: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, sign: 1 | -1): CaromState;
  drawBallServeSign(s: DeepReadonly<CaromState>): CaromState;
  setAiTracking(s: DeepReadonly<CaromState>, enabled: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, enabled: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, muted: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): CaromSnapshot;
  menuItemRect(s: DeepReadonly<CaromState>, index: number): MenuRect | null;
}
export const BACKGROUND = "#07131d";
const cyan = "#58e5e4",
  coral = "#ff7e83",
  gold = "#ffcb78",
  ink = "#dcecf1";
const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));
const serveSign = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const parked = (): BallState => ({
  x: C.FIELD_CX,
  y: C.FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: C.HOLD_TIME,
  serveSign: serveSign(),
  trail: [],
});
const obstacles = (): ObstacleState[] =>
  C.OBSTACLE_CENTERS.map((p, index) => ({ index, cx: p.x, cy: p.y }));
const paddle = (): PaddleState => ({
  cy: C.FIELD_CY,
  vy: 0,
  driven: false,
  drivenVy: 0,
});
function initial(muted: boolean): CaromState {
  return {
    screen: "title",
    mode: "solo",
    menuIndex: 0,
    titleIndex: 0,
    resumeScreen: "playing",
    score: { p1: 0, p2: 0 },
    winner: null,
    paddles: { left: paddle(), right: paddle() },
    ai: { tracking: true, movement: true },
    receiver: "left",
    ball: parked(),
    obstacles: obstacles(),
    simTime: 0,
    muted,
    menuPress: null,
  };
}
function start(s: DeepReadonly<CaromState>, mode: Mode): CaromState {
  return {
    ...s,
    screen: "countdown",
    mode,
    menuIndex: 0,
    resumeScreen: "playing",
    score: { p1: 0, p2: 0 },
    winner: null,
    receiver: "left",
    ball: parked(),
    paddles: {
      left: { ...s.paddles.left, cy: C.FIELD_CY, vy: 0 },
      right: { ...s.paddles.right, cy: C.FIELD_CY, vy: 0 },
    },
    menuPress: null,
  };
}
function title(s: DeepReadonly<CaromState>): CaromState {
  return {
    ...initial(s.muted),
    titleIndex: s.titleIndex,
    menuIndex: s.titleIndex,
    simTime: s.simTime,
  };
}
function menuCount(screen: Screen): number {
  return screen === "title" || screen === "paused"
    ? 3
    : screen === "matchover"
      ? 2
      : screen === "howto"
        ? 1
        : 0;
}
function itemRect(screen: Screen, index: number): MenuRect | null {
  if (index < 0 || index >= menuCount(screen)) return null;
  const top =
    screen === "title"
      ? 352
      : screen === "howto"
        ? 575
        : screen === "paused"
          ? 342
          : 430;
  return { x: 460, y: top + index * 66, w: 360, h: 54 };
}
function hit(screen: Screen, x: number, y: number): number {
  for (let i = 0; i < menuCount(screen); i++) {
    const r = itemRect(screen, i)!;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}
function confirm(s: DeepReadonly<CaromState>): CaromState {
  if (s.screen === "title") {
    const remembered = { ...s, titleIndex: s.menuIndex };
    return s.menuIndex === 2
      ? { ...remembered, screen: "howto", menuIndex: 0 }
      : start(remembered, s.menuIndex === 0 ? "solo" : "versus");
  }
  if (s.screen === "howto") return title(s);
  if (s.screen === "paused")
    return s.menuIndex === 0
      ? { ...s, screen: s.resumeScreen }
      : s.menuIndex === 1
        ? start(s, s.mode)
        : title(s);
  if (s.screen === "matchover")
    return s.menuIndex === 0 ? start(s, s.mode) : title(s);
  return { ...s };
}
function integrate(
  p: DeepReadonly<PaddleState>,
  vy: number,
  dt: number,
): PaddleState {
  const cy = clamp(p.cy + vy * dt, C.PADDLE_MIN_CY, C.PADDLE_MAX_CY);
  return {
    ...p,
    cy,
    vy: dt > 0 && cy !== p.cy + vy * dt ? (cy - p.cy) / dt : vy,
  };
}
type Face = "left" | "right" | "top" | "bottom";
function collide(
  b: BallState,
  r: C.Rect,
): { ball: BallState; face: Face; reflected: boolean } | null {
  const { x, y } = b;
  if (!(
    x > r.x0 - C.BALL_R &&
    x < r.x1 + C.BALL_R &&
    y > r.y0 - C.BALL_R &&
    y < r.y1 + C.BALL_R
  ))
    return null;
  const depths = [
    x - (r.x0 - C.BALL_R),
    r.x1 + C.BALL_R - x,
    y - (r.y0 - C.BALL_R),
    r.y1 + C.BALL_R - y,
  ];
  const i = depths.indexOf(Math.min(...depths));
  const face: Face = ["left", "right", "top", "bottom"][i] as Face;
  const reflected =
    i === 0 ? b.vx > 0 : i === 1 ? b.vx < 0 : i === 2 ? b.vy > 0 : b.vy < 0;
  return {
    face,
    reflected,
    ball: {
      ...b,
      x: i === 0 ? r.x0 - C.BALL_R : i === 1 ? r.x1 + C.BALL_R : x,
      y: i === 2 ? r.y0 - C.BALL_R : i === 3 ? r.y1 + C.BALL_R : y,
      vx: reflected && i < 2 ? -b.vx : b.vx,
      vy: reflected && i >= 2 ? -b.vy : b.vy,
    },
  };
}
interface Events {
  paddle: boolean;
  wall: boolean;
  obstacle: boolean;
  score: boolean;
}
function advanceBall(
  ball: DeepReadonly<BallState>,
  s: DeepReadonly<CaromState>,
  dt: number,
  events: Events,
): BallState {
  let b: BallState = { ...ball, trail: [...ball.trail] };
  const n = Math.max(
    1,
    Math.ceil((Math.hypot(b.vx, b.vy) * dt) / C.MAX_SUBSTEP),
  );
  const h = dt / n;
  for (let step = 0; step < n; step++) {
    const speed = Math.hypot(b.vx, b.vy);
    if (speed) {
      const angle = (b.spin / speed) * h,
        cos = Math.cos(angle),
        sin = Math.sin(angle);
      b = { ...b, vx: b.vx * cos - b.vy * sin, vy: b.vx * sin + b.vy * cos };
    }
    b = {
      ...b,
      spin: b.spin * Math.pow(0.5, h / C.SPIN_HALFLIFE),
      x: b.x + b.vx * h,
      y: b.y + b.vy * h,
    };
    if (b.y - C.BALL_R < 0 && b.vy < 0) {
      b = { ...b, y: C.BALL_R, vy: -b.vy };
      events.wall = true;
    } else if (b.y + C.BALL_R > C.FIELD_H && b.vy > 0) {
      b = { ...b, y: C.FIELD_H - C.BALL_R, vy: -b.vy };
      events.wall = true;
    }
    for (const side of ["left", "right"] as const) {
      const p = s.paddles[side],
        r =
          side === "left"
            ? {
                x0: C.P1_X0,
                x1: C.P1_X1,
                y0: p.cy - C.PADDLE_HALF,
                y1: p.cy + C.PADDLE_HALF,
              }
            : {
                x0: C.P2_X0,
                x1: C.P2_X1,
                y0: p.cy - C.PADDLE_HALF,
                y1: p.cy + C.PADDLE_HALF,
              };
      const c = collide(b, r);
      if (!c) continue;
      b = c.ball;
      if (c.face === "top" || c.face === "bottom") {
        if (c.reflected) events.wall = true;
      } else {
        const theta =
            clamp((b.y - p.cy) / C.PADDLE_HALF, -1, 1) * C.MAX_BOUNCE_ANGLE,
          v = Math.min(Math.hypot(b.vx, b.vy) * C.SPEED_MULT, C.SPEED_CAP);
        b = {
          ...b,
          x: side === "left" ? C.P1_X1 + C.BALL_R : C.P2_X0 - C.BALL_R,
          vx: (side === "left" ? 1 : -1) * v * Math.cos(theta),
          vy: v * Math.sin(theta),
          spin: clamp(
            b.spin + p.vy * C.SPIN_FROM_PADDLE,
            -C.SPIN_CLAMP,
            C.SPIN_CLAMP,
          ),
        };
        events.paddle = true;
      }
    }
    for (const o of s.obstacles) {
      const c = collide(b, C.OBSTACLES[o.index]);
      if (c) {
        b = c.ball;
        if (c.reflected) events.obstacle = true;
      }
    }
  }
  return b;
}
function requireBall(s: DeepReadonly<CaromState>): DeepReadonly<BallState> {
  if (!s.ball) throw new Error("Carom: no ball present");
  return s.ball;
}
const ballPose = (
  s: DeepReadonly<CaromState>,
  change: Partial<BallState>,
): CaromState => ({ ...s, ball: { ...requireBall(s), ...change } });
const paddlePose = (
  s: DeepReadonly<CaromState>,
  side: Side,
  change: Partial<PaddleState>,
): CaromState => ({
  ...s,
  paddles: { ...s.paddles, [side]: { ...s.paddles[side], ...change } },
});
function debugApi(): CaromDebugApi {
  return {
    version: C.CAROM_DEBUG_VERSION,
    clearWorld: (s) => ({ ...s, ball: null, obstacles: [] }),
    spawnBall: (s) => ({ ...s, ball: parked() }),
    spawnObstacle: (s, index) => {
      const p = C.OBSTACLE_CENTERS[index];
      if (!p) throw new Error(`Carom: invalid obstacle ${index}`);
      return {
        ...s,
        obstacles: [
          ...s.obstacles.filter((o) => o.index !== index),
          { index, cx: p.x, cy: p.y },
        ].sort((a, b) => a.index - b.index),
      };
    },
    reset: (s) => initial(s.muted),
    reconcile: (s) => ({ ...s }),
    setScreen: (s, screen) => ({ ...s, screen }),
    setMode: (s, mode) => ({ ...s, mode }),
    setMenuIndex: (s, menuIndex) => ({ ...s, menuIndex }),
    setTitleIndex: (s, titleIndex) => ({ ...s, titleIndex }),
    setResumeScreen: (s, resumeScreen) => ({ ...s, resumeScreen }),
    setScore: (s, p1, p2) => ({ ...s, score: { p1, p2 } }),
    setWinner: (s, winner) => ({ ...s, winner }),
    setReceiver: (s, receiver) => ({ ...s, receiver }),
    setPaddleCy: (s, side, cy) => paddlePose(s, side, { cy }),
    setPaddleVy: (s, side, drivenVy) => paddlePose(s, side, { drivenVy }),
    setPaddleDriven: (s, side, driven) => paddlePose(s, side, { driven }),
    setBallPosition: (s, x, y) => ballPose(s, { x, y }),
    setBallVelocity: (s, vx, vy) => ballPose(s, { vx, vy }),
    setBallSpin: (s, spin) => ballPose(s, { spin }),
    setBallHeld: (s, held) => ballPose(s, { held }),
    setBallHoldTimer: (s, holdTimer) => ballPose(s, { holdTimer }),
    setBallServeSign: (s, serveSign) => ballPose(s, { serveSign }),
    drawBallServeSign: (s) => ballPose(s, { serveSign: serveSign() }),
    setAiTracking: (s, tracking) => ({ ...s, ai: { ...s.ai, tracking } }),
    setAiMovement: (s, movement) => ({ ...s, ai: { ...s.ai, movement } }),
    setMuted: (s, muted) => ({ ...s, muted }),
    snapshot: (s) => ({
      version: C.CAROM_DEBUG_VERSION,
      screen: s.screen,
      mode: s.mode,
      menuIndex: s.menuIndex,
      titleIndex: s.titleIndex,
      resumeScreen: s.resumeScreen,
      score: { ...s.score },
      winner: s.winner,
      muted: s.muted,
      paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
      ai: { ...s.ai },
      receiver: s.receiver,
      ball: s.ball
        ? {
            ...s.ball,
            trail: [...s.ball.trail],
            speed: Math.hypot(s.ball.vx, s.ball.vy),
          }
        : null,
      obstacles: s.obstacles.map((o) => ({ ...o })),
      simTime: s.simTime,
    }),
    menuItemRect: (s, index) => itemRect(s.screen, index),
  };
}
function menuInput(s: DeepReadonly<CaromState>, api: UpdateApi): CaromState {
  if (
    s.screen === "paused" &&
    (api.input.pressed("pause") || api.input.pressed("back"))
  )
    return { ...s, screen: s.resumeScreen, menuPress: null };
  if (
    (s.screen === "howto" || s.screen === "matchover") &&
    api.input.pressed("back")
  )
    return title(s);
  const up = api.input.pressed("p1-up") || api.input.pressed("p2-up");
  const down = api.input.pressed("p1-down") || api.input.pressed("p2-down");
  let next: CaromState = { ...s };
  if (up || down)
    next = {
      ...next,
      menuIndex:
        (s.menuIndex + (up ? -1 : 1) + menuCount(s.screen)) %
        menuCount(s.screen),
    };
  else if (api.input.pressed("confirm")) return confirm(next);
  const samples = api.input.pointerSamples();
  let press = s.menuPress ?? null;
  let pointerConfirm = false;
  for (const sample of samples) {
    const index = hit(s.screen, sample.x, sample.y);
    if (index >= 0) next = { ...next, menuIndex: index };
    if (sample.type === "down" && sample.button === "primary")
      press = index >= 0 ? { id: sample.id, index } : null;
    if (sample.type === "up" && sample.button === "primary") {
      if (press && press.id === sample.id && press.index === index)
        pointerConfirm = true;
      press = null;
    }
  }
  const pointer = api.input.pointer();
  if (pointer.device !== "touch") {
    const index = hit(s.screen, pointer.x, pointer.y);
    if (index >= 0 && (pointer.x !== 0 || pointer.y !== 0))
      next = { ...next, menuIndex: index };
  }
  next = { ...next, menuPress: press };
  return pointerConfirm ? confirm(next) : next;
}
function movePaddles(
  s: DeepReadonly<CaromState>,
  api: UpdateApi,
  dt: number,
): CaromState {
  const held = (name: C.ActionName): number =>
    api.input.value(name) > 0 ? 1 : 0;
  const left = s.paddles.left.driven
    ? s.paddles.left.drivenVy
    : C.PADDLE_SPEED *
      ((held("p1-down") || (s.mode === "solo" && held("p2-down")) ? 1 : 0) -
        (held("p1-up") || (s.mode === "solo" && held("p2-up")) ? 1 : 0));
  let right: number;
  if (s.paddles.right.driven) right = s.paddles.right.drivenVy;
  else if (s.mode === "versus")
    right = C.PADDLE_SPEED * (held("p2-down") - held("p2-up"));
  else if (!s.ai.movement) right = 0;
  else {
    let target = C.AI_HOME_Y,
      deadzone = C.AI_HOME_DEADZONE;
    if (s.ai.tracking && s.screen === "playing" && s.ball && s.ball.vx > 0) {
      target = s.ball.y - s.ball.vy * C.AI_REACT;
      deadzone = C.AI_DEADZONE;
    }
    const diff = target - s.paddles.right.cy;
    right =
      Math.abs(diff) <= deadzone || dt <= 0
        ? 0
        : Math.sign(diff) * Math.min(C.AI_SPEED, Math.abs(diff) / dt);
  }
  return {
    ...s,
    paddles: {
      left: integrate(s.paddles.left, left, dt),
      right: integrate(s.paddles.right, right, dt),
    },
  };
}
export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>): [CaromState, CaromDebugApi] {
    for (const name of C.ACTIONS)
      api.input.register(name, { keys: [...C.BINDINGS[name]] });
    api.audio.define(C.CUES.paddleHit, {
      wave: "triangle",
      freq: 540,
      freqTo: 820,
      gain: 0.18,
      durationMs: 85,
    });
    api.audio.define(C.CUES.wallBounce, {
      wave: "sine",
      freq: 290,
      freqTo: 180,
      gain: 0.12,
      durationMs: 90,
    });
    api.audio.define(C.CUES.obstacleBounce, {
      wave: "square",
      freq: 160,
      freqTo: 250,
      gain: 0.09,
      durationMs: 110,
    });
    api.audio.define(C.CUES.score, {
      wave: "triangle",
      freq: 460,
      freqTo: 920,
      gain: 0.19,
      durationMs: 240,
    });
    api.diagnostics.register("screen", (s) => s.screen);
    api.diagnostics.register("mode", (s) => s.mode);
    api.diagnostics.register("score", (s) => `${s.score.p1} : ${s.score.p2}`);
    api.diagnostics.register("ball position", (s) =>
      s.ball ? `${s.ball.x.toFixed(1)}, ${s.ball.y.toFixed(1)}` : "none",
    );
    api.diagnostics.register("ball velocity", (s) =>
      s.ball ? `${s.ball.vx.toFixed(1)}, ${s.ball.vy.toFixed(1)}` : "none",
    );
    api.diagnostics.register("ball speed", (s) =>
      s.ball ? Math.hypot(s.ball.vx, s.ball.vy).toFixed(1) : "none",
    );
    api.diagnostics.register("ball spin", (s) =>
      s.ball ? s.ball.spin.toFixed(1) : "none",
    );
    api.diagnostics.register(
      "left paddle",
      (s) => `${s.paddles.left.cy.toFixed(1)}, ${s.paddles.left.vy.toFixed(1)}`,
    );
    api.diagnostics.register(
      "right paddle",
      (s) =>
        `${s.paddles.right.cy.toFixed(1)}, ${s.paddles.right.vy.toFixed(1)}`,
    );
    return [initial(false), debugApi()];
  },
  update(
    state: DeepReadonly<CaromState>,
    api: UpdateApi,
    dt: number,
  ): CaromState {
    if (state.muted !== api.audio.muted()) api.audio.setMuted(state.muted);
    if (api.input.pressed("mute")) api.audio.setMuted(!api.audio.muted());
    let s: CaromState = {
      ...state,
      simTime: state.simTime + dt,
      muted: api.audio.muted(),
    };
    const from = s.screen;
    if (
      from === "title" ||
      from === "howto" ||
      from === "paused" ||
      from === "matchover"
    )
      s = menuInput(s, api);
    else if (api.input.pressed("pause"))
      s = {
        ...s,
        screen: "paused",
        resumeScreen: from,
        menuIndex: 0,
        menuPress: null,
      };
    if (s.screen !== "countdown" && s.screen !== "playing") return s;
    s = movePaddles(s, api, dt);
    if (!s.ball) return s;
    if (s.screen === "countdown") {
      if (s.ball.held) {
        const waiting = { ...s.ball, x: C.FIELD_CX, y: C.FIELD_CY };
        const holdTimer = waiting.holdTimer - dt;
        if (holdTimer <= 0) {
          const dir = s.receiver === "left" ? -1 : 1;
          s = {
            ...s,
            screen: "playing",
            ball: {
              ...waiting,
              held: false,
              holdTimer: 0,
              vx: dir * C.SERVE_SPEED * Math.cos(C.SERVE_ANGLE),
              vy: waiting.serveSign * C.SERVE_SPEED * Math.sin(C.SERVE_ANGLE),
              trail: [],
            },
          };
        } else s = { ...s, ball: { ...waiting, holdTimer } };
      }
    } else if (s.ball && !s.ball.held) {
      const events: Events = {
        paddle: false,
        wall: false,
        obstacle: false,
        score: false,
      };
      const ball = advanceBall(s.ball, s, dt, events);
      const scorer =
        ball.x - C.BALL_R > C.FIELD_W
          ? "left"
          : ball.x + C.BALL_R < 0
            ? "right"
            : null;
      if (scorer) {
        events.score = true;
        const score = {
          p1: s.score.p1 + (scorer === "left" ? 1 : 0),
          p2: s.score.p2 + (scorer === "right" ? 1 : 0),
        };
        const winning =
          scorer === "left"
            ? score.p1 >= C.WIN_SCORE && score.p1 - score.p2 >= C.WIN_LEAD
            : score.p2 >= C.WIN_SCORE && score.p2 - score.p1 >= C.WIN_LEAD;
        s = winning
          ? {
              ...s,
              score,
              winner: scorer,
              ball,
              screen: "matchover",
              menuIndex: 0,
            }
          : {
              ...s,
              score,
              receiver: scorer === "left" ? "right" : "left",
              ball: parked(),
              screen: "countdown",
            };
      } else s = { ...s, ball };
      if (events.paddle) api.audio.play(C.CUES.paddleHit);
      if (events.wall) api.audio.play(C.CUES.wallBounce);
      if (events.obstacle) api.audio.play(C.CUES.obstacleBounce);
      if (events.score) api.audio.play(C.CUES.score);
    }
    if (s.ball && (s.screen === "countdown" || s.screen === "playing")) {
      const trail = [
        ...s.ball.trail,
        { x: s.ball.x, y: s.ball.y, t: s.simTime },
      ].filter((p) => p.t >= s.simTime - C.TRAIL_TIME);
      s = { ...s, ball: { ...s.ball, trail } };
    }
    return s;
  },
  render(state: DeepReadonly<CaromState>, api: RenderApi): void {
    renderGame(state, api.ctx);
  },
};
function round(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}
function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = 600,
): void {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
}
function renderGame(
  s: DeepReadonly<CaromState>,
  ctx: CanvasRenderingContext2D,
): void {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
  const grad = ctx.createRadialGradient(
    C.FIELD_CX,
    C.FIELD_CY,
    100,
    C.FIELD_CX,
    C.FIELD_CY,
    760,
  );
  grad.addColorStop(0, "#122836");
  grad.addColorStop(1, BACKGROUND);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
  ctx.strokeStyle = "#284656";
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, C.FIELD_W - 60, C.FIELD_H - 60);
  ctx.strokeStyle = "#33515d";
  ctx.setLineDash([8, 18]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(C.NET_X, 45);
  ctx.lineTo(C.NET_X, C.FIELD_H - 45);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(C.FIELD_CX, C.FIELD_CY, 95, 0, Math.PI * 2);
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.globalAlpha = 1;
  for (const o of s.obstacles) {
    ctx.shadowColor = gold;
    ctx.shadowBlur = 18;
    round(
      ctx,
      o.cx - C.OBSTACLE_HW,
      o.cy - C.OBSTACLE_HH,
      C.OBSTACLE_W,
      C.OBSTACLE_H,
      9,
      gold,
    );
    ctx.shadowBlur = 0;
    round(
      ctx,
      o.cx - 3,
      o.cy - C.OBSTACLE_HH + 14,
      6,
      C.OBSTACLE_H - 28,
      3,
      "#ffe5b5",
    );
  }
  for (const side of ["left", "right"] as const) {
    const p = s.paddles[side],
      x = side === "left" ? C.P1_X0 : C.P2_X0,
      color = side === "left" ? cyan : coral;
    ctx.shadowColor = color;
    ctx.shadowBlur = 26;
    round(ctx, x, p.cy - C.PADDLE_HALF, C.PADDLE_W, C.PADDLE_H, 8, color);
    ctx.shadowBlur = 0;
  }
  if (s.ball) {
    const b = s.ball;
    for (let i = 0; i < b.trail.length; i++) {
      const p = b.trail[i];
      const opacity = ((i + 1) / b.trail.length) * 0.35;
      ctx.fillStyle = `rgba(235,248,255,${opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, C.BALL_R * ((i + 1) / b.trail.length), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 25;
    ctx.fillStyle = "#f4fbff";
    ctx.beginPath();
    ctx.arc(b.x, b.y, C.BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  if (s.screen !== "title" && s.screen !== "howto") {
    label(ctx, String(s.score.p1), 560, 112, 58, cyan, 800);
    label(ctx, String(s.score.p2), 720, 112, 58, coral, 800);
    label(
      ctx,
      s.mode === "solo" ? "SOLO  ·  VS AI" : "VERSUS  ·  LOCAL",
      C.FIELD_CX,
      53,
      16,
      "#9eb8c4",
      700,
    );
  }
  if (s.screen === "countdown" && s.ball?.held) {
    label(ctx, "GET READY", C.FIELD_CX, 304, 33, ink, 800);
    label(
      ctx,
      `${Math.max(1, Math.ceil(s.ball.holdTimer))}`,
      C.FIELD_CX,
      408,
      80,
      gold,
      800,
    );
  }
  if (
    s.screen === "title" ||
    s.screen === "howto" ||
    s.screen === "paused" ||
    s.screen === "matchover"
  ) {
    ctx.fillStyle = "rgba(3,12,20,0.78)";
    ctx.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
  }
  if (s.screen === "title") {
    label(ctx, "CAROM", C.FIELD_CX, 216, 103, ink, 900);
    label(
      ctx,
      "SPIN THE RALLY. BANK THE ANGLE.",
      C.FIELD_CX,
      258,
      20,
      gold,
      700,
    );
    drawMenu(ctx, s, C.TITLE_ITEMS);
    label(
      ctx,
      "W / S  ·  ↑ / ↓ TO CHOOSE     ENTER TO SELECT",
      C.FIELD_CX,
      664,
      15,
      "#9eb8c4",
    );
  }
  if (s.screen === "howto") {
    label(ctx, "HOW TO PLAY", C.FIELD_CX, 158, 54, ink, 900);
    label(ctx, "FIRST TO 11 · WIN BY 2", C.FIELD_CX, 206, 19, gold, 700);
    label(
      ctx,
      "SOLO: W / S OR ↑ / ↓ MOVES YOUR PADDLE",
      C.FIELD_CX,
      280,
      22,
      cyan,
    );
    label(
      ctx,
      "VERSUS: W / S LEFT  ·  ↑ / ↓ RIGHT",
      C.FIELD_CX,
      323,
      22,
      coral,
    );
    label(
      ctx,
      "MOVE AS YOU STRIKE TO CURVE THE BALL.",
      C.FIELD_CX,
      401,
      22,
      ink,
    );
    label(ctx, "USE THE GOLD BARS FOR BANK SHOTS.", C.FIELD_CX, 442, 22, ink);
    label(
      ctx,
      "P OR ESC TO PAUSE  ·  M TO MUTE",
      C.FIELD_CX,
      507,
      18,
      "#9eb8c4",
    );
    drawMenu(ctx, s, ["BACK TO MENU"]);
  }
  if (s.screen === "paused") {
    label(ctx, "PAUSED", C.FIELD_CX, 250, 60, ink, 900);
    drawMenu(ctx, s, C.PAUSE_ITEMS);
  }
  if (s.screen === "matchover") {
    label(
      ctx,
      s.winner === "left" ? "LEFT WINS" : "RIGHT WINS",
      C.FIELD_CX,
      246,
      58,
      s.winner === "left" ? cyan : coral,
      900,
    );
    label(
      ctx,
      `${s.score.p1}  —  ${s.score.p2}`,
      C.FIELD_CX,
      326,
      50,
      ink,
      800,
    );
    drawMenu(ctx, s, C.MATCHOVER_ITEMS);
  }
  if (s.muted) label(ctx, "SOUND OFF", 1180, 680, 14, "#9eb8c4");
}
function drawMenu(
  ctx: CanvasRenderingContext2D,
  s: DeepReadonly<CaromState>,
  items: readonly string[],
): void {
  items.forEach((item, i) => {
    const r = itemRect(s.screen, i);
    if (!r) return;
    const selected = s.menuIndex === i;
    round(ctx, r.x, r.y, r.w, r.h, 12, selected ? "#244a5a" : "#122b39");
    if (selected) {
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 12);
      ctx.stroke();
    }
    label(
      ctx,
      item,
      r.x + r.w / 2,
      r.y + 36,
      23,
      selected ? ink : "#8ea9b5",
      selected ? 800 : 600,
    );
  });
}
