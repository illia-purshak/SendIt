export const uiColors = ['teal', 'neutral', 'info', 'warning', 'error', 'success'] as const
export type UiColor = typeof uiColors[number]
export const defaultUiColor: UiColor = 'teal'
