import { setup, assign } from "xstate";
import { computePhysics, type SimInputs } from "./sim-engine/physics";

export interface CaseContext {
  patientId: string;
  decisions: string[];
  sim: SimInputs;
  debriefReady: boolean;
}

export type CaseEvent =
  | { type: "SELECT_MODALITY"; modality: "hd" | "hdf" }
  | { type: "SET_CONVECTION"; liters: number }
  | { type: "SET_QB"; qb: number }
  | { type: "TOGGLE_AUTOSUB" }
  | { type: "ACK_ALARM" }
  | { type: "ESCALATE" }
  | { type: "COMPLETE" };

function baseSim(patientId: string): SimInputs {
  const map: Record<string, Partial<SimInputs>> = {
    maria: { qb: 350, convectionL: 0, modality: "hd", accessFlow: 420, accessType: "avf", systolicBp: 148, dialyzerConvective: 70, autoSubEnabled: false },
    james: { qb: 280, convectionL: 0, modality: "hd", accessFlow: 220, accessType: "catheter", systolicBp: 102, dialyzerConvective: 60, autoSubEnabled: false },
    amina: { qb: 400, convectionL: 20, modality: "hdf", accessFlow: 480, accessType: "avf", systolicBp: 128, dialyzerConvective: 85, autoSubEnabled: true },
    elena: { qb: 300, convectionL: 0, modality: "hd", accessFlow: 310, accessType: "avf", systolicBp: 135, dialyzerConvective: 65, autoSubEnabled: false },
    david: { qb: 320, convectionL: 18, modality: "hdf", accessFlow: 380, accessType: "avf", systolicBp: 118, dialyzerConvective: 72, autoSubEnabled: false },
    robert: { qb: 360, convectionL: 15, modality: "hdf", accessFlow: 400, accessType: "avf", systolicBp: 140, dialyzerConvective: 88, autoSubEnabled: true },
  };
  return {
    qb: 350,
    convectionL: 0,
    modality: "hd",
    accessFlow: 400,
    accessType: "avf",
    dialyzerConvective: 70,
    systolicBp: 130,
    autoSubEnabled: false,
    ...map[patientId],
  };
}

export const caseMachine = setup({
  types: {
    context: {} as CaseContext,
    events: {} as CaseEvent,
    input: {} as { patientId: string },
  },
}).createMachine({
  id: "patientCase",
  initial: "assessment",
  context: ({ input }) => ({
    patientId: input.patientId,
    decisions: [],
    sim: baseSim(input.patientId),
    debriefReady: false,
  }),
  states: {
    assessment: {
      on: {
        SELECT_MODALITY: {
          target: "prescribing",
          actions: assign({
            sim: ({ context, event }) => ({
              ...context.sim,
              modality: event.modality,
              convectionL: event.modality === "hd" ? 0 : context.sim.convectionL || 15,
            }),
            decisions: ({ context, event }) => [
              ...context.decisions,
              `Selected modality: ${event.modality.toUpperCase()}`,
            ],
          }),
        },
      },
    },
    prescribing: {
      on: {
        SET_CONVECTION: {
          actions: assign({
            sim: ({ context, event }) => ({
              ...context.sim,
              convectionL: event.liters,
              modality: "hdf" as const,
            }),
            decisions: ({ context, event }) => [
              ...context.decisions,
              `Set convection: ${event.liters} L`,
            ],
          }),
        },
        SET_QB: {
          actions: assign({
            sim: ({ context, event }) => ({ ...context.sim, qb: event.qb }),
            decisions: ({ context, event }) => [
              ...context.decisions,
              `Adjusted Qb: ${event.qb} mL/min`,
            ],
          }),
        },
        TOGGLE_AUTOSUB: {
          actions: assign({
            sim: ({ context }) => ({
              ...context.sim,
              autoSubEnabled: !context.sim.autoSubEnabled,
            }),
            decisions: ({ context }) => [
              ...context.decisions,
              `AutoSub plus: ${!context.sim.autoSubEnabled ? "ON" : "OFF"}`,
            ],
          }),
        },
      },
      always: {
        target: "treatment",
        guard: ({ context }) => context.sim.convectionL > 0 || context.sim.modality === "hd",
      },
    },
    treatment: {
      on: {
        ACK_ALARM: {
          target: "intervention",
          guard: ({ context }) => {
            const out = computePhysics(context.sim);
            return out.alarm !== null;
          },
          actions: assign({
            decisions: ({ context }) => [...context.decisions, "Acknowledged alarm"],
          }),
        },
        COMPLETE: {
          target: "debrief",
          guard: ({ context }) => {
            const out = computePhysics(context.sim);
            return out.alarm === null;
          },
          actions: assign({ debriefReady: true }),
        },
      },
    },
    intervention: {
      on: {
        SET_CONVECTION: {
          target: "treatment",
          actions: assign({
            sim: ({ context, event }) => ({
              ...context.sim,
              convectionL: Math.max(0, event.liters),
            }),
            decisions: ({ context, event }) => [
              ...context.decisions,
              `Intervention — reduced convection to ${event.liters} L`,
            ],
          }),
        },
        SET_QB: {
          target: "treatment",
          actions: assign({
            sim: ({ context, event }) => ({ ...context.sim, qb: event.qb }),
            decisions: ({ context, event }) => [
              ...context.decisions,
              `Intervention — Qb to ${event.qb} mL/min`,
            ],
          }),
        },
        ESCALATE: {
          target: "debrief",
          actions: assign({
            debriefReady: true,
            decisions: ({ context }) => [...context.decisions, "Escalated to nephrology"],
          }),
        },
      },
    },
    debrief: {
      type: "final",
    },
  },
});
