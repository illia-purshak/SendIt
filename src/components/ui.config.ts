export const uiColors = ['green', 'neutral', 'info', 'warning', 'error', 'success'] as const
export type UiColor = typeof uiColors[number]
export const defaultUiColor: UiColor = 'green'
