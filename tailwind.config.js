/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#06BA63',  /* acciones, PR, éxito */
        secondary: '#72A1E5', /* info, pesos calc, progreso */
        danger: '#F2542D',   /* deload, alertas, errores */
        muted: '#DCD5CA',   /* texto secundario */
        surface: '#40525E',  /* cards, superficies */
        bg: '#1a1e24',     /* fondo principal (añadido) */
      },
    },
  },
  plugins: [],
}

