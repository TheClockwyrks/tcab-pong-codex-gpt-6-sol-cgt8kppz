import { createCanvas } from "@napi-rs/canvas";
import { ConstantClock, createEngine } from "@clockwyrks/simple-2d";
import { describe, expect, it } from "vitest";
import {
  BALL_R,
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  HOLD_TIME,
  P1_X1,
  PADDLE_SPEED,
  SERVE_SPEED,
  WIN_SCORE,
} from "./constants";
import { game } from "./game";

async function setup(stepMs = 1000 / 60) {
  const canvas = createCanvas(FIELD_W, FIELD_H);
  const engine = createEngine({
    canvas: canvas as unknown as HTMLCanvasElement,
    width: FIELD_W,
    height: FIELD_H,
    game,
    clock: new ConstantClock(stepMs),
    surface: {
      cssWidth: () => FIELD_W,
      cssHeight: () => FIELD_H,
      dpr: () => 1,
      events: () => new EventTarget(),
    },
  });
  await engine.initialize();
  return engine;
}

describe("Carom simulation", () => {
  it("initializes the complete title world and resets it", async () => {
    const engine = await setup();
    expect(engine.debug.snapshot(engine.state).screen).toBe("title");
    expect(engine.debug.snapshot(engine.state).obstacles).toHaveLength(2);
    engine.apply((s) => engine.debug.clearWorld(s));
    expect(engine.debug.snapshot(engine.state).ball).toBeNull();
    engine.apply((s) => engine.debug.reset(s));
    expect(engine.debug.snapshot(engine.state).ball?.held).toBe(true);
    engine.destroy();
  });

  it("serves after the hold and moves in logical time", async () => {
    const engine = await setup(10);
    engine.apply((s) => engine.debug.setScreen(s, "countdown"));
    engine.apply((s) => engine.debug.setBallServeSign(s, 1));
    await engine.advance(Math.round(HOLD_TIME / 0.01));
    expect(engine.state.screen).toBe("playing");
    expect(engine.state.ball?.held).toBe(false);
    expect(
      Math.hypot(engine.state.ball!.vx, engine.state.ball!.vy),
    ).toBeCloseTo(SERVE_SPEED);
    await engine.advance(1);
    expect(engine.state.ball!.x).toBeLessThan(FIELD_W / 2);
    engine.destroy();
  });

  it("integrates driven paddles and transfers motion into spin", async () => {
    const engine = await setup(10);
    engine.apply((s) => engine.debug.setScreen(s, "playing"));
    engine.apply((s) => engine.debug.clearWorld(s));
    engine.apply((s) => engine.debug.spawnBall(s));
    engine.apply((s) => engine.debug.setBallHeld(s, false));
    engine.apply((s) =>
      engine.debug.setBallPosition(s, P1_X1 + BALL_R + 5, FIELD_CY),
    );
    engine.apply((s) => engine.debug.setBallVelocity(s, -SERVE_SPEED, 0));
    engine.apply((s) => engine.debug.setPaddleDriven(s, "left", true));
    engine.apply((s) => engine.debug.setPaddleVy(s, "left", PADDLE_SPEED));
    await engine.advance(1);
    expect(engine.state.paddles.left.vy).toBe(PADDLE_SPEED);
    expect(engine.state.ball!.vx).toBeGreaterThan(0);
    expect(engine.state.ball!.spin).toBeGreaterThan(0);
    engine.destroy();
  });

  it("scores and ends a match at a two point lead", async () => {
    const engine = await setup(10);
    engine.apply((s) => engine.debug.setScreen(s, "playing"));
    engine.apply((s) => engine.debug.setScore(s, WIN_SCORE - 1, 0));
    engine.apply((s) => engine.debug.clearWorld(s));
    engine.apply((s) => engine.debug.spawnBall(s));
    engine.apply((s) => engine.debug.setBallHeld(s, false));
    engine.apply((s) =>
      engine.debug.setBallPosition(s, FIELD_W + BALL_R + 1, FIELD_H / 2),
    );
    await engine.advance(1);
    expect(engine.state.screen).toBe("matchover");
    expect(engine.state.winner).toBe("left");
    expect(engine.state.score.p1).toBe(WIN_SCORE);
    engine.destroy();
  });
});

describe("field contacts and AI", () => {
  it("reflects from walls and fixed obstacles", async () => {
    const engine = await setup(10);
    engine.apply((s) => engine.debug.setScreen(s, "playing"));
    engine.apply((s) => engine.debug.setBallHeld(s, false));
    engine.apply((s) =>
      engine.debug.setBallPosition(s, FIELD_W / 2, BALL_R + 2),
    );
    engine.apply((s) => engine.debug.setBallVelocity(s, 0, -SERVE_SPEED));
    await engine.advance(1);
    expect(engine.state.ball!.vy).toBeGreaterThan(0);
    expect(engine.state.ball!.y).toBeGreaterThanOrEqual(BALL_R);
    engine.apply((s) => engine.debug.setBallPosition(s, 450, 220));
    engine.apply((s) => engine.debug.setBallVelocity(s, SERVE_SPEED, 0));
    await engine.advance(10);
    expect(engine.state.ball!.vx).toBeLessThan(0);
    engine.destroy();
  });

  it("tracks an incoming ball in Solo and rests when tracking is disabled", async () => {
    const engine = await setup(10);
    engine.apply((s) => engine.debug.setScreen(s, "playing"));
    engine.apply((s) => engine.debug.setBallHeld(s, false));
    engine.apply((s) => engine.debug.setBallPosition(s, 900, 500));
    engine.apply((s) => engine.debug.setBallVelocity(s, 100, 0));
    await engine.advance(1);
    expect(engine.state.paddles.right.cy).toBeGreaterThan(FIELD_CY);
    await engine.advance(5);
    engine.apply((s) => engine.debug.setAiTracking(s, false));
    await engine.advance(1);
    expect(engine.state.paddles.right.vy).toBeLessThan(0);
    engine.destroy();
  });
});
