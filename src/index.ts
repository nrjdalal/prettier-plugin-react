import { generateId, type GenerateId } from "@/utils/generate-id"
import { utcDate, type UtcDate } from "@/utils/utc-date"

const date = utcDate()
const id = generateId(date)

console.log("\x1b[32m%s\x1b[0m", "Generated_ID:", id)
console.log("\x1b[32m%s\x1b[0m", "UTC_Date:", date)

export { generateId, type GenerateId, utcDate, type UtcDate }
