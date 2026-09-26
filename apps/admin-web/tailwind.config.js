/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fluent: {
          bg: '#f3f2f1',
          surface: '#ffffff',
          card: '#ffffff',
          border: '#edebe9',
          borderStrong: '#d2d0ce',
          borderInput: '#8a8886',
          text: '#201f1e',
          textSecondary: '#605e5c',
          textMuted: '#a19f9d',
          primary: '#0078d4',
          primaryHover: '#106ebe',
          primaryActive: '#005a9e',
          primaryLight: '#eff6fc',
          primaryBorder: '#c7e0f4',
          success: '#107c10',
          successLight: '#dff6dd',
          successBorder: '#a8e5a3',
          warning: '#8a3707',
          warningLight: '#fff4ce',
          warningBorder: '#fed9cc',
          danger: '#d13438',
          dangerLight: '#fde7e9',
          dangerBorder: '#f8bbd0',
        },
      },
      borderRadius: {
        fluent: '4px',
        fluentSm: '2px',
        fluentLg: '6px',
      },
      fontFamily: {
        sans: ['"Segoe UI"', '"Segoe UI Variable Text"', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        fluent: '0 1.6px 3.6px 0 rgba(0, 0, 0, 0.05), 0 0.3px 0.9px 0 rgba(0, 0, 0, 0.04)',
        fluentHover: '0 3.2px 7.2px 0 rgba(0, 0, 0, 0.08), 0 0.6px 1.8px 0 rgba(0, 0, 0, 0.06)',
        fluentModal: '0 12px 32px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
