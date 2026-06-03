import { Delete } from 'lucide-react'

type Props = {
    value: string
    onChange: (value: string) => void
    onClose?: () => void
    label?: string
    decimal?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']

export function NumericKeyboard({ value, onChange, onClose, label, decimal = true }: Props) {
    const handleKey = (key: string) => {
        if (key === '⌫') {
            onChange(value.slice(0, -1))
            return
        }
        if (key === '.' && !decimal) return
        if (key === '.' && value.includes('.')) return
        if (value === '0' && key !== '.') {
            onChange(key)
            return
        }
        onChange(value + key)
    }

    return (
        <div className="border-t bg-card border-border">
            {/* Label + valor actual */}
            {label && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="font-mono text-lg font-bold text-foreground">
                        {value || '0'}
                    </span>
                </div>
            )}

            {/* Grid de teclas */}
            <div className="grid grid-cols-3 gap-px bg-border">
                {KEYS.map((key) => (
                    <button
                        key={key}
                        type="button"
                        onPointerDown={(e) => {
                            e.preventDefault() // evita que el input pierda focus y el teclado nativo aparezca
                            handleKey(key)
                        }}
                        className={`flex items-center justify-center h-14 text-lg font-medium transition-colors active:bg-muted ${key === '⌫'
                            ? 'bg-muted text-muted-foreground'
                            : key === '.'
                                ? 'bg-card text-muted-foreground'
                                : 'bg-card text-foreground'
                            }`}
                    >
                        {key === '⌫' ? <Delete size={18} /> : key}
                    </button>
                ))}
            </div>

            {/* Botón confirmar */}
            {onClose && (
                <button
                    type="button"
                    onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setTimeout(() => {
                            onClose()
                        }, 100)
                    }}
                    className="w-full py-4 text-sm font-medium transition-colors text-primary-foreground bg-primary active:bg-primary/90"
                >
                    Listo
                </button>
            )}
        </div>
    )
}