import { Dispatch, SetStateAction } from "react"
import { IpQualityScoreResponse } from "./interfaces"
import * as crypto from 'crypto'

export function redirect(url: string): void {
    window.location.href = url
}

export function hasNumber(myString: string): boolean {
    return /\d/.test(myString)
}

export function onlyInt(event: KeyboardEvent): void {
    if(event.which != 8 && event.which != 0 && event.which < 48 || event.which > 57) {
        event.preventDefault()
    }
}

export function checkMinMax(value: number, min: number, max: number, hook: Dispatch<SetStateAction<number>>): void {
    if(value < min)
        return hook(min)

    if(value > max)
        return hook(max)
}

export function calculateTimer(endDate: number): string {
    const now = Date.now()
    const distance = endDate - now
    const timer = {
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
    }

    if(distance < 0)
        return `The countdown for this class is over since ${-timer.hours - 1} hours, ${-timer.minutes - 1} minutes and ${-timer.seconds - 1} seconds`

    return `${timer.hours}:${timer.minutes}:${timer.seconds}`
}

export async function fetchIpQualityInfo(ip: string): Promise<IpQualityScoreResponse | false> {
    const qualityScoreUrl = `https://ipqualityscore.com/api/json/ip/${process.env.IP_QUALITY_SCORE_API_KEY}/${ip}`
    const result = await fetch(qualityScoreUrl)
    if(!result.ok)
        return false
    const data = await result.json() as IpQualityScoreResponse
    return data
}

export function isIpv6(ip: string): boolean {
    return ip.includes(':')
}

export function casualHash(input: string): string {
    const hash = crypto.createHash('ripemd160')
    hash.update(input)
    return hash.digest('hex')
}

export function isVpnFromIpInfo(ipQualityInfo: IpQualityScoreResponse): boolean {
    return ipQualityInfo.proxy ||
        ipQualityInfo.vpn ||
        ipQualityInfo.tor ||
        ipQualityInfo.active_vpn ||
        ipQualityInfo.active_tor ||
        ipQualityInfo.bot_status
}

export function randomInt(min: number, max: number): number {
    return Math.floor((Math.random() * (max + 1 - min)) + min)
}
