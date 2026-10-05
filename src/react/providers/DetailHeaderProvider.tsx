/**
 * [INPUT]: 依赖 React Context 与详情页标题、目录、滚动活动项快照
 * [OUTPUT]: 对外提供 DetailHeaderProvider、useHeaderBarDetailTitle、useDetailHeaderController
 * [POS]: 页面到顶栏的状态桥梁，写入接口与展示状态分离以避免观察器反复注册
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createContext, useContext, useMemo, useReducer, useRef, type PropsWithChildren } from "react";

export type TocItem = { id: string; text: string; level: number };
export type DetailSnapshot = { title: string; show: boolean; items: TocItem[]; activeId: string };
type State = DetailSnapshot & { open: boolean };
type Controller = {
  publish: (snapshot: DetailSnapshot) => void;
  registerNavigation: (onNavigate: (id: string) => void) => void;
  toggle: () => void;
  close: () => void;
  navigate: (id: string) => void;
  clear: () => void;
};
type Action = { type: "publish"; snapshot: DetailSnapshot } | { type: "toggle" | "close" | "clear" };
const empty: State = { title: "", show: false, items: [], activeId: "", open: false };
const StateContext = createContext<State | null>(null);
const ControllerContext = createContext<Controller | null>(null);
function reducer(state: State, action: Action): State {
  if (action.type === "clear") return empty;
  if (action.type === "toggle") return state.show && state.items.length ? { ...state, open: !state.open } : state;
  if (action.type === "close") return state.open ? { ...state, open: false } : state;
  if (action.type !== "publish") return state;
  const { snapshot } = action;
  const show = Boolean(snapshot.title) && snapshot.show;
  if (state.title === snapshot.title && state.show === show && state.items === snapshot.items && state.activeId === snapshot.activeId) return state;
  return { ...snapshot, show, open: show && snapshot.items.length > 0 && state.open };
}
export function DetailHeaderProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, empty);
  const navigationRef = useRef<((id: string) => void) | null>(null);
  const controller = useMemo<Controller>(() => ({
    publish: (snapshot) => dispatch({ type: "publish", snapshot }),
    registerNavigation: (onNavigate) => { navigationRef.current = onNavigate; },
    toggle: () => dispatch({ type: "toggle" }),
    close: () => dispatch({ type: "close" }),
    navigate: (id) => {
      if (id) navigationRef.current?.(id);
      dispatch({ type: "close" });
    },
    clear: () => {
      navigationRef.current = null;
      dispatch({ type: "clear" });
    },
  }), []);
  return <ControllerContext.Provider value={controller}><StateContext.Provider value={state}>{children}</StateContext.Provider></ControllerContext.Provider>;
}
export function useHeaderBarDetailTitle() {
  const value = useContext(StateContext);
  if (!value) throw new Error("详情顶栏必须位于 DetailHeaderProvider 内");
  return value;
}
export function useDetailHeaderController() {
  const value = useContext(ControllerContext);
  if (!value) throw new Error("详情目录必须位于 DetailHeaderProvider 内");
  return value;
}
