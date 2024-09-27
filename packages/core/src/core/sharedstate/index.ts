export enum SharedStateStatus {
  SET,
  PENDING,
  NONE,
}
export type SharedStateResult = {
  status: SharedStateStatus;
  value: Map<string, any> | null;
};

export type { SharedStateManager } from "./SharedStateManager";
export {
  buildSharedStateEvent,
  buildPendingSharedStateEvent,
  extractSharedState,
} from "./SharedStateEvent";
