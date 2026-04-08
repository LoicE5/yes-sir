import { randomInt } from "@/utils/functions"
import { BaseResponse } from "@/utils/interfaces"
import { NextApiRequest, NextApiResponse } from "next"
import validator from "validator"
import { createClient } from "@supabase/supabase-js"

interface Query {
    class_name: string
    time_given: string
}

interface Response {
    code: number
    js_time: number
    js_expiry: number
}

async function checkIfCodeAlreadyExists(code: number): Promise<boolean> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    return (await supabase.from('codes').select('*').in('code', [code])).data!.length > 0
}

function getJsTimeAndExpiry(timeGiven: number): number[] {
    const jsTime = Date.now()
    const timeGivenInMilliseconds = timeGiven * 60 * 1000
    const jsExpiry = jsTime + timeGivenInMilliseconds
    return [jsTime, jsExpiry]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response | BaseResponse>): Promise<void> {

    if('POST' !== req.method)
        return res.status(405).json({ message: `The method ${req.method} is not allowed.` })

    try {

        const { class_name, time_given } = req.query as unknown as Query

        if(!class_name)
            return res.status(400).json({ message: 'Please set a class_name in your request' })

        const cleanClassName = validator.escape(class_name)
        const cleanTimeGiven = parseInt(validator.escape(time_given))

        if(Number.isNaN(cleanTimeGiven))
            return res.status(400).json({ message: 'Please set a correct time given' })

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

        let code: number, existingCode: boolean

        do {
            code = randomInt(1, 999999)
            existingCode = await checkIfCodeAlreadyExists(code)
        } while(existingCode)

        const [jsTime, jsExpiry] = getJsTimeAndExpiry(cleanTimeGiven)

        const { error } = await supabase.from('codes').insert([{
            code: code,
            class_name: cleanClassName,
            js_time: jsTime,
            js_expiry: jsExpiry
        }])

        if(error)
            return res.status(500).json({ message: 'There have been an error processing your request.' })

        res.status(201).json({
            code: code,
            js_time: jsTime,
            js_expiry: jsExpiry
        } satisfies Response)

    } catch(error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error('generate_code failed:', msg, error)
        res.status(500).json({ message: 'There have been an error processing your request.' })
    }
}
