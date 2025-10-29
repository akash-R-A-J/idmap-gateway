import '@testing-library/jest-dom'

// Polyfill for TextEncoder/TextDecoder required by @solana/web3.js
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
