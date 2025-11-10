export interface Person {
  id: string
  name: string
  nights: boolean[]
}

export interface PersonCost {
  personId: string
  perNight: number[]
  total: number
}

/**
 * Calculate the number of nights between check-in and check-out dates
 * @param checkIn - Check-in date in YYYY-MM-DD format
 * @param checkOut - Check-out date in YYYY-MM-DD format
 * @returns Number of nights (0 if invalid dates or check-out <= check-in)
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0
  const checkInDate = new Date(checkIn + 'T00:00:00')
  const checkOutDate = new Date(checkOut + 'T00:00:00')
  if (checkOutDate <= checkInDate) return 0
  const diffTime = checkOutDate.getTime() - checkInDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Get date labels for each night of the stay
 * @param checkIn - Check-in date in YYYY-MM-DD format
 * @param nights - Number of nights
 * @returns Array of date strings in YYYY-MM-DD format, one for each night
 */
export function getNightDates(checkIn: string, nights: number): string[] {
  if (!checkIn || nights === 0) return []
  const checkInDate = new Date(checkIn + 'T00:00:00')
  const dates: string[] = []
  for (let i = 0; i < nights; i++) {
    const nightDate = new Date(checkInDate)
    nightDate.setDate(checkInDate.getDate() + i)
    dates.push(nightDate.toISOString().split('T')[0])
  }
  return dates
}

/**
 * Calculate costs for each person based on which nights they stayed
 * The cost per night is divided equally among all people who stayed that night
 * @param people - Array of people with their night selections
 * @param totalPrice - Total price for the entire stay
 * @param nights - Number of nights
 * @returns Array of cost objects, one per person
 */
export function calculateCosts(
  people: Person[],
  totalPrice: number,
  nights: number
): PersonCost[] {
  if (nights === 0 || totalPrice === 0 || people.length === 0) {
    return []
  }

  const pricePerNight = totalPrice / nights
  const costs: PersonCost[] = []

  for (const person of people) {
    const perNight: number[] = []
    let total = 0

    for (let i = 0; i < nights; i++) {
      if (person.nights[i]) {
        // Count how many people stayed this night
        const peopleThisNight = people.filter((p) => p.nights[i]).length
        const costThisNight =
          peopleThisNight > 0 ? pricePerNight / peopleThisNight : 0
        perNight.push(costThisNight)
        total += costThisNight
      } else {
        perNight.push(0)
      }
    }

    costs.push({ personId: person.id, perNight, total })
  }

  return costs
}

