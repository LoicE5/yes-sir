import { casualHash, fetchIpQualityInfo, isIpv6, isVpnFromIpInfo } from "@/utils/functions"
import { BaseResponse, IpQualityScoreResponse } from "@/utils/interfaces"
import { createClient, PostgrestError } from "@supabase/supabase-js"
import { NextApiRequest, NextApiResponse } from "next"
import validator from "validator"

interface Query {
    code: string
    name: string
}

interface Response {
    empty: boolean
    denied: boolean
    hashed: boolean
    ip: string
    is_ipv6: boolean
    is_vpn: boolean
    is_already_registered: boolean
    js_expiry: number
}

interface DbCodesModel {
    code_id: number
    code: number
    class_name: string
    js_time: number
    js_expiry: number
}

function createSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, supabaseServiceRoleKey)
}

async function isIpAlreadyRegistered(ip: string, code: number): Promise<boolean> {
    const supabase = createSupabase()
    const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .in('ip', [ip])
        .in('code', [code])

    if(error)
        throw error

    return data.length > 0
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response | BaseResponse>): Promise<void> {

    if('POST' !== req.method)
        return res.status(405).json({ message: `The method ${req.method} is not allowed.` })

    try {
        const { code, name } = req.query as unknown as Query

        if(!code || !name)
            return res.status(400).json({ message: "Please input a valid code and a valid name" })

        const cleanCode = parseInt(validator.escape(code))
        const cleanName = validator.escape(name)

        const supabase = createSupabase()

        const { data: existingCodeList, error: ecError } = await supabase
            .from('codes')
            .select('code, js_expiry')
            .in('code', [cleanCode])
            .limit(1) as unknown as { data: DbCodesModel[], error: PostgrestError | null }

        const existingCode = existingCodeList.at(0)

        if(ecError || !existingCode)
            return res.status(404).json({
                empty: true,
                denied: false,
                hashed: false,
                ip: '',
                is_ipv6: false,
                is_vpn: false,
                is_already_registered: false,
                js_expiry: 0
            } satisfies Response)

        const ip = req.socket.remoteAddress as string
        const ipInfo = await fetchIpQualityInfo(ip) as IpQualityScoreResponse
        const alreadyRegistered = await isIpAlreadyRegistered(ip, existingCode.code)
        const isIpv6Address = isIpv6(ip)
        const isVpn = isVpnFromIpInfo(ipInfo)

        if(
            (isIpv6Address && alreadyRegistered) ||
            (
                existingCode.js_expiry > 0 &&
                Date.now() > existingCode.js_expiry
            )
        )
            return res.status(403).json({
                empty: false,
                denied: true,
                hashed: true,
                ip: casualHash(ip),
                is_ipv6: isIpv6Address,
                is_vpn: isVpn,
                is_already_registered: alreadyRegistered,
                js_expiry: existingCode.js_expiry
            } satisfies Response)

        const { error: naError } = await supabase.from('attendances').insert({
            name: cleanName,
            code: cleanCode,
            ip: ip,
            is_ipv6: isIpv6Address,
            is_vpn: isVpn,
            is_already_registered: alreadyRegistered
        })

        if(naError)
            return res.status(500).json({ message: 'There have been an error processing your request.' })

        res.status(201).json({
            empty: false,
            denied: false,
            hashed: true,
            ip: casualHash(ip),
            is_ipv6: isIpv6Address,
            is_vpn: isVpn,
            is_already_registered: alreadyRegistered,
            js_expiry: existingCode.js_expiry
        } satisfies Response)

    } catch(error: unknown) {
        console.error(error)
        res.status(500).json({ message: 'There have been an error processing your request.' })
    }
}
