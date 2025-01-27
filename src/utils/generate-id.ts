export type GenerateId = (utcDate: string) => string

export const generateId: GenerateId = (utcDate: string) => {
  const date = new Date(utcDate)
  const epochTime = date.getTime()
  const randomString = Math.random().toString(36).substring(2)
  return `${epochTime}-${randomString}`
}
