import type { Participant } from '../types'

interface Props {
  users: Participant[]
  active: string
  onSelect: (name: string) => void
}

export default function UserTabs({ users, active, onSelect }: Props) {
  return (
    <div className="user-tabs" role="tablist">
      {users.map((u) => (
        <button
          key={u.name}
          role="tab"
          aria-selected={u.name === active}
          className={'user-tab' + (u.name === active ? ' active' : '')}
          onClick={() => onSelect(u.name)}
        >
          {u.name}
        </button>
      ))}
    </div>
  )
}
