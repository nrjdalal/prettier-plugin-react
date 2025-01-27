export type UtcDate = () => string

export const utcDate: UtcDate = (): string => {
  return new Date().toUTCString()
}
