import { useState, useEffect } from 'react'
import './App.css'
import {
  calculateNights,
  getNightDates,
  calculateCosts,
  type Person,
} from './calculations'

interface AppState {
  totalPrice: string
  checkInDate: string
  checkOutDate: string
  people: Person[]
}

// Parse state from URL hash
function parseStateFromHash(): AppState {
  const hash = window.location.hash.slice(1)
  if (!hash) {
    return {
      totalPrice: '',
      checkInDate: '',
      checkOutDate: '',
      people: [],
    }
  }
  
  try {
    const decoded = decodeURIComponent(hash)
    const state: AppState = JSON.parse(decoded)
    return {
      totalPrice: state.totalPrice || '',
      checkInDate: state.checkInDate || '',
      checkOutDate: state.checkOutDate || '',
      people: state.people || [],
    }
  } catch (e) {
    console.error('Failed to parse URL hash:', e)
    return {
      totalPrice: '',
      checkInDate: '',
      checkOutDate: '',
      people: [],
    }
  }
}

// Update hash with new state
function updateHash(state: AppState) {
  const encoded = encodeURIComponent(JSON.stringify(state))
  const currentHash = window.location.hash.slice(1)
  
  if (currentHash !== encoded) {
    window.location.hash = encoded
  }
}


// Helper function to format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric'
  })
}

function App() {
  // State is derived from hash - single source of truth
  const [state, setState] = useState<AppState>(() => parseStateFromHash())
  const [copyButtonText, setCopyButtonText] = useState('Copy Summary')

  // Listen to hash changes (including browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      setState(parseStateFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Update state by updating hash (one-way data flow)
  const updateState = (newState: AppState | ((prev: AppState) => AppState)) => {
    const updatedState = typeof newState === 'function' ? newState(state) : newState
    updateHash(updatedState)
    setState(updatedState)
  }

  const { totalPrice, checkInDate, checkOutDate, people } = state

  const nights = calculateNights(checkInDate, checkOutDate)
  const price = parseFloat(totalPrice) || 0
  const pricePerNight = nights > 0 ? price / nights : 0
  const nightDates = getNightDates(checkInDate, nights)

  // Update nights array when numNights changes
  useEffect(() => {
    if (nights > 0) {
      updateState((prev) => ({
        ...prev,
        people: prev.people.map((p) => ({
          ...p,
          nights: [
            ...p.nights.slice(0, nights),
            ...new Array(Math.max(0, nights - p.nights.length)).fill(false),
          ],
        })),
      }))
    } else {
      updateState((prev) => ({
        ...prev,
        people: prev.people.map((p) => ({ ...p, nights: [] })),
      }))
    }
  }, [nights])

  const addPerson = () => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name: '',
      nights: new Array(nights || 0).fill(false),
    }
    updateState((prev) => ({
      ...prev,
      people: [...prev.people, newPerson],
    }))
  }

  const removePerson = (id: string) => {
    updateState((prev) => ({
      ...prev,
      people: prev.people.filter((p) => p.id !== id),
    }))
  }

  const updatePersonName = (id: string, name: string) => {
    updateState((prev) => ({
      ...prev,
      people: prev.people.map((p) => (p.id === id ? { ...p, name } : p)),
    }))
  }

  const toggleNight = (personId: string, nightIndex: number) => {
    updateState((prev) => ({
      ...prev,
      people: prev.people.map((p) =>
        p.id === personId
          ? {
              ...p,
              nights: p.nights.map((n, i) =>
                i === nightIndex ? !n : n
              ),
            }
          : p
      ),
    }))
  }

  const costs = calculateCosts(people, price, nights)

  const copySummary = async () => {
    if (people.length === 0 || costs.length === 0) return

    const lines: string[] = []
    lines.push('Hotel Split Summary')
    lines.push('')
    lines.push(`Total: $${price.toFixed(2)} for ${nights} ${nights === 1 ? 'night' : 'nights'}`)
    lines.push('')
    
    for (const person of people) {
      const personCost = costs.find((c) => c.personId === person.id)
      if (!personCost || personCost.total === 0) continue
      
      const personName = person.name || 'Unnamed'
      lines.push(`${personName}: $${personCost.total.toFixed(2)}`)
      
      // List which nights they stayed
      const stayedNights: string[] = []
      for (let i = 0; i < nights; i++) {
        if (person.nights[i] && personCost.perNight[i] > 0) {
          const dateStr = nightDates[i]
          const date = new Date(dateStr + 'T00:00:00')
          const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
          stayedNights.push(`${formattedDate} ($${personCost.perNight[i].toFixed(2)})`)
        }
      }
      
      if (stayedNights.length > 0) {
        lines.push(`  Nights: ${stayedNights.join(', ')}`)
      }
      lines.push('')
    }

    const summaryText = lines.join('\n')
    
    try {
      await navigator.clipboard.writeText(summaryText)
      // Show brief confirmation
      setCopyButtonText('Copied!')
      setTimeout(() => {
        setCopyButtonText('Copy Summary')
      }, 2000)
    } catch (err) {
      console.error('Failed to copy summary:', err)
    }
  }

  return (
    <div className="app">
      <div className="input-section">
        <div className="input-group">
          <label>
            Total Price ($):
            <input
              type="number"
              step="0.01"
              value={totalPrice}
              onChange={(e) =>
                updateState((prev) => ({ ...prev, totalPrice: e.target.value }))
              }
              placeholder="0.00"
            />
          </label>
        </div>
        
        <div className="input-group">
          <label>
            Check-in Date:
            <input
              type="date"
              value={checkInDate}
              onChange={(e) =>
                updateState((prev) => ({ ...prev, checkInDate: e.target.value }))
              }
            />
          </label>
        </div>
        
        <div className="input-group">
          <label>
            Check-out Date:
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) =>
                updateState((prev) => ({ ...prev, checkOutDate: e.target.value }))
              }
            />
          </label>
        </div>
      </div>

      {nights > 0 && price > 0 && (
        <div className="info">
          <strong>
            {nights} {nights === 1 ? 'night' : 'nights'} • Price per night: ${pricePerNight.toFixed(2)}
          </strong>
        </div>
      )}

      <div className="people-section">
        <div className="section-header">
          <h2>People</h2>
          <div className="section-actions">
            {people.length > 0 && costs.length > 0 && costs.some((c) => c.total > 0) && (
              <button onClick={copySummary} className="copy-summary-btn">
                {copyButtonText}
              </button>
            )}
            <button onClick={addPerson}>Add Person</button>
          </div>
        </div>

        {people.length === 0 && (
          <p className="empty-state">No people added yet. Click "Add Person" to start.</p>
        )}

        {people.length > 0 && nights > 0 && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  {nightDates.map((date, i) => (
                    <th key={i} title={date}>
                      {formatDate(date)}
                    </th>
                  ))}
                  <th className="total-header">Total</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person, personIndex) => {
                  const personCosts = costs.find(
                    (c) => c.personId === person.id
                  )
                  return (
                    <tr key={person.id}>
                      <td className="name-cell">
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) =>
                            updatePersonName(person.id, e.target.value)
                          }
                          placeholder={`Person ${personIndex + 1}`}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removePerson(person.id)
                          }}
                          className="remove-btn-inline"
                          title="Remove person"
                        >
                          ×
                        </button>
                      </td>
                      {nightDates.map((_, i) => (
                        <td 
                          key={i}
                          className="night-cell"
                          onClick={() => toggleNight(person.id, i)}
                        >
                          <input
                            type="checkbox"
                            checked={person.nights[i] || false}
                            onChange={() => toggleNight(person.id, i)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="cost">
                            {personCosts && personCosts.perNight[i] > 0
                              ? `$${personCosts.perNight[i].toFixed(2)}`
                              : '\u00A0'}
                          </span>
                        </td>
                      ))}
                      <td className="total-cell">
                        <strong>
                          {personCosts && personCosts.total > 0
                            ? `$${personCosts.total.toFixed(2)}`
                            : '\u00A0'}
                        </strong>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
