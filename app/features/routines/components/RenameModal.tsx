import { useState, useEffect } from 'react'
import { Button } from '~/components/ui/button'

type Props = {
    currentName: string
    onSave: (name: string) => void
    onCancel: () => void
}

export function RenameModal({ currentName, onSave, onCancel }: Props) {
    const [name, setName] = useState(currentName)

    useEffect(() => setName(currentName), [currentName])

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-foreground/20 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 space-y-4 border bg-card border-border rounded-t-2xl sm:rounded-2xl">
                <h2 className="text-base font-bold text-foreground">Renombrar rutina</h2>
                <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave(name.trim()) }}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="Nombre de la rutina"
                />
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button
                        className="flex-1"
                        disabled={!name.trim()}
                        onClick={() => onSave(name.trim())}
                    >
                        Guardar
                    </Button>
                </div>
            </div>
        </div>
    )
}