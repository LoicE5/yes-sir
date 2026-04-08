import { describe, it, expect } from "bun:test"
import { calculateTimer, casualHash, getClientIp, randomInt, isVpnFromIpInfo, isIpv6, hasNumber } from "../src/utils/functions"
import { IpQualityScoreResponse } from "../src/utils/interfaces"

// ---------------------------------------------------------------------------
// calculateTimer
// ---------------------------------------------------------------------------

describe("calculateTimer", () => {
    it("returns a formatted countdown string for a future date", () => {
        const now = Date.now()
        const oneHourFromNow = now + 1 * 60 * 60 * 1000
        const result = calculateTimer(oneHourFromNow)
        // Should contain hour:minute:second pattern
        expect(result).toMatch(/^\d+:\d+:\d+$/)
    })

    it("shows 0:59:59 for exactly 1 hour minus 1 second", () => {
        const now = Date.now()
        const almostOneHour = now + (60 * 60 * 1000) - 1000
        const result = calculateTimer(almostOneHour)
        expect(result).toBe("0:59:59")
    })

    it("returns expired message for a past date", () => {
        const pastDate = Date.now() - 1 * 60 * 60 * 1000 - 5 * 60 * 1000 // 1h5m ago
        const result = calculateTimer(pastDate)
        expect(result).toContain("The countdown for this class is over since")
    })

    it("returns expired message with negative numbers for past date", () => {
        const pastDate = Date.now() - 1 // 1ms in the past
        const result = calculateTimer(pastDate)
        expect(result).toContain("The countdown for this class is over since")
    })

    it("handles zero (epoch) as a far past date", () => {
        const result = calculateTimer(0)
        expect(result).toContain("The countdown for this class is over since")
    })

    it("returns 0:0:0 for current timestamp (almost expired)", () => {
        const now = Date.now()
        const nearlyNow = now + 500 // 500ms in future
        const result = calculateTimer(nearlyNow)
        // Should be 0:0:0 since less than 1 second
        expect(result).toMatch(/^0:0:\d+$/)
    })

    it("correctly formats hours, minutes, seconds", () => {
        const now = Date.now()
        const twoHoursThirtyMinutes = now + (2 * 60 * 60 * 1000) + (30 * 60 * 1000) + (15 * 1000)
        const result = calculateTimer(twoHoursThirtyMinutes)
        expect(result).toBe("2:30:15")
    })
})

// ---------------------------------------------------------------------------
// casualHash
// ---------------------------------------------------------------------------

describe("casualHash", () => {
    it("returns a hex string", () => {
        const result = casualHash("test")
        expect(result).toMatch(/^[0-9a-f]+$/)
    })

    it("returns consistent hash for same input", () => {
        const input = "192.168.1.1"
        expect(casualHash(input)).toBe(casualHash(input))
    })

    it("returns different hashes for different inputs", () => {
        expect(casualHash("192.168.1.1")).not.toBe(casualHash("192.168.1.2"))
    })

    it("returns 64-character hex string (SHA-256 = 256 bits = 64 hex chars)", () => {
        const result = casualHash("any input")
        expect(result.length).toBe(64)
    })

    it("handles empty string input", () => {
        const result = casualHash("")
        expect(result.length).toBe(64)
    })

    it("handles unicode characters", () => {
        const result = casualHash("日本語テスト")
        expect(result).toMatch(/^[0-9a-f]{64}$/)
    })

    it("hashes IPv6 addresses correctly", () => {
        const result = casualHash("2001:db8::1")
        expect(result).toMatch(/^[0-9a-f]{64}$/)
    })
})

// ---------------------------------------------------------------------------
// randomInt
// ---------------------------------------------------------------------------

describe("randomInt", () => {
    it("returns a number within [min, max] range", () => {
        for(let i = 0; i < 100; i++) {
            const result = randomInt(1, 10)
            expect(result).toBeGreaterThanOrEqual(1)
            expect(result).toBeLessThanOrEqual(10)
        }
    })

    it("returns exact value when min equals max", () => {
        const result = randomInt(5, 5)
        expect(result).toBe(5)
    })

    it("works for large ranges like 1-999999", () => {
        const result = randomInt(1, 999999)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(999999)
    })

    it("returns an integer (not a float)", () => {
        for(let i = 0; i < 50; i++) {
            const result = randomInt(1, 100)
            expect(Number.isInteger(result)).toBe(true)
        }
    })

    it("can return min value", () => {
        // With enough iterations, min should appear at least once
        const results = new Set<number>()
        for(let i = 0; i < 1000; i++) {
            results.add(randomInt(1, 2))
        }
        expect(results.has(1)).toBe(true)
    })

    it("can return max value", () => {
        const results = new Set<number>()
        for(let i = 0; i < 1000; i++) {
            results.add(randomInt(1, 2))
        }
        expect(results.has(2)).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// isVpnFromIpInfo
// ---------------------------------------------------------------------------

function makeIpQualityInfo(overrides: Partial<IpQualityScoreResponse> = {}): IpQualityScoreResponse {
    return {
        success: true,
        message: "Success",
        fraud_score: 0,
        country_code: "US",
        region: "California",
        city: "San Francisco",
        ISP: "Test ISP",
        ASN: 12345,
        organization: "Test Org",
        is_crawler: false,
        timezone: "America/Los_Angeles",
        mobile: false,
        host: "test.host",
        proxy: false,
        vpn: false,
        tor: false,
        active_vpn: false,
        active_tor: false,
        recent_abuse: false,
        bot_status: false,
        connection_type: "Residential",
        abuse_velocity: "none",
        zip_code: "94102",
        latitude: 37.7749,
        longitude: -122.4194,
        request_id: "test-id",
        ...overrides
    }
}

describe("isVpnFromIpInfo", () => {
    it("returns false when all flags are false", () => {
        const info = makeIpQualityInfo()
        expect(isVpnFromIpInfo(info)).toBe(false)
    })

    it("returns true when proxy is true", () => {
        const info = makeIpQualityInfo({ proxy: true })
        expect(isVpnFromIpInfo(info)).toBe(true)
    })

    it("returns true when vpn is true", () => {
        const info = makeIpQualityInfo({ vpn: true })
        expect(isVpnFromIpInfo(info)).toBe(true)
    })

    it("returns true when tor is true", () => {
        const info = makeIpQualityInfo({ tor: true })
        expect(isVpnFromIpInfo(info)).toBe(true)
    })

    it("returns true when active_vpn is true", () => {
        const info = makeIpQualityInfo({ active_vpn: true })
        expect(isVpnFromIpInfo(info)).toBe(true)
    })

    it("returns true when active_tor is true", () => {
        const info = makeIpQualityInfo({ active_tor: true })
        expect(isVpnFromIpInfo(info)).toBe(true)
    })

    it("returns true when bot_status is true", () => {
        const info = makeIpQualityInfo({ bot_status: true })
        expect(isVpnFromIpInfo(info)).toBe(true)
    })

    it("returns true when multiple flags are true", () => {
        const info = makeIpQualityInfo({ vpn: true, tor: true, bot_status: true })
        expect(isVpnFromIpInfo(info)).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// isIpv6
// ---------------------------------------------------------------------------

describe("isIpv6", () => {
    it("returns true for a valid IPv6 address", () => {
        expect(isIpv6("2001:db8::1")).toBe(true)
    })

    it("returns true for loopback IPv6 ::1", () => {
        expect(isIpv6("::1")).toBe(true)
    })

    it("returns true for full IPv6 address", () => {
        expect(isIpv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true)
    })

    it("returns false for a valid IPv4 address", () => {
        expect(isIpv6("192.168.1.1")).toBe(false)
    })

    it("returns false for localhost IPv4", () => {
        expect(isIpv6("127.0.0.1")).toBe(false)
    })

    it("returns false for empty string", () => {
        expect(isIpv6("")).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// hasNumber
// ---------------------------------------------------------------------------

describe("hasNumber", () => {
    it("returns true when string contains a digit", () => {
        expect(hasNumber("abc123")).toBe(true)
    })

    it("returns true for string with only digits", () => {
        expect(hasNumber("12345")).toBe(true)
    })

    it("returns false for string without digits", () => {
        expect(hasNumber("abcdef")).toBe(false)
    })

    it("returns false for empty string", () => {
        expect(hasNumber("")).toBe(false)
    })

    it("returns true for string ending in digit", () => {
        expect(hasNumber("abc1")).toBe(true)
    })

    it("returns false for special characters without digits", () => {
        expect(hasNumber("!@#$%")).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// getClientIp
// ---------------------------------------------------------------------------

describe("getClientIp", () => {
    it("returns first IP from x-forwarded-for string", () => {
        const req = { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }, socket: { remoteAddress: '127.0.0.1' } }
        expect(getClientIp(req)).toBe('1.2.3.4')
    })

    it("returns single x-forwarded-for value", () => {
        const req = { headers: { 'x-forwarded-for': '10.0.0.1' }, socket: { remoteAddress: '127.0.0.1' } }
        expect(getClientIp(req)).toBe('10.0.0.1')
    })

    it("returns first entry from x-forwarded-for array", () => {
        const req = { headers: { 'x-forwarded-for': ['1.2.3.4', '5.6.7.8'] as unknown as string }, socket: { remoteAddress: '127.0.0.1' } }
        expect(getClientIp(req)).toBe('1.2.3.4')
    })

    it("falls back to socket.remoteAddress when no x-forwarded-for", () => {
        const req = { headers: {}, socket: { remoteAddress: '192.168.1.1' } }
        expect(getClientIp(req)).toBe('192.168.1.1')
    })

    it("returns empty string when no IP source available", () => {
        const req = { headers: {}, socket: {} }
        expect(getClientIp(req)).toBe('')
    })

    it("returns empty string when socket is undefined", () => {
        const req = { headers: {} }
        expect(getClientIp(req)).toBe('')
    })

    it("trims whitespace from x-forwarded-for", () => {
        const req = { headers: { 'x-forwarded-for': '  1.2.3.4  , 5.6.7.8' }, socket: {} }
        expect(getClientIp(req)).toBe('1.2.3.4')
    })

    it("ignores empty x-forwarded-for string", () => {
        const req = { headers: { 'x-forwarded-for': '' }, socket: { remoteAddress: '10.0.0.1' } }
        expect(getClientIp(req)).toBe('10.0.0.1')
    })
})

// ---------------------------------------------------------------------------
// Input validation (ported from teacher.tsx isValidString logic)
// ---------------------------------------------------------------------------

describe("Input validation logic (isValidString equivalent)", () => {
    function isValidString(str: string, minLength: number, maxLength: number): boolean {
        if(!str) return false
        const specialCharacters = [" ", "&", "?"]
        if(specialCharacters.some((char) => str.includes(char))) return false
        if(minLength && Number.isInteger(minLength) && str.length < minLength) return false
        if(maxLength && Number.isInteger(maxLength) && str.length > maxLength) return false
        return true
    }

    it("returns true for a valid class name", () => {
        expect(isValidString("Math", 1, 50)).toBe(true)
    })

    it("returns false for empty string", () => {
        expect(isValidString("", 1, 50)).toBe(false)
    })

    it("returns false for string with space", () => {
        expect(isValidString("Math Class", 1, 50)).toBe(false)
    })

    it("returns false for string with ampersand", () => {
        expect(isValidString("Math&Science", 1, 50)).toBe(false)
    })

    it("returns false for string with question mark", () => {
        expect(isValidString("Math?", 1, 50)).toBe(false)
    })

    it("returns false when shorter than minLength", () => {
        expect(isValidString("M", 2, 50)).toBe(false)
    })

    it("returns false when longer than maxLength", () => {
        expect(isValidString("A".repeat(51), 1, 50)).toBe(false)
    })

    it("returns true for string exactly at maxLength", () => {
        expect(isValidString("A".repeat(50), 1, 50)).toBe(true)
    })

    it("returns true for string exactly at minLength", () => {
        expect(isValidString("A", 1, 50)).toBe(true)
    })

    it("returns false for null-like falsy value", () => {
        expect(isValidString("", 1, 50)).toBe(false)
    })
})
