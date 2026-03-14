import { NextApiRequest, NextApiResponse } from "next"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

interface Codes {
    id: number
    code: number
    class_name: string
    js_time: number
    js_expiry: number
}

interface OutdatedCodes {
    outdatedCodes: Codes[] | null
    error: boolean
}

async function archiveOutdatedCodes(supabase: SupabaseClient): Promise<OutdatedCodes> {
    const { data: outdatedCodes, error: errorSelect } = await supabase
        .from('codes')
        .select('*')
        .lt('js_expiry', Date.now())

    if(errorSelect)
        return { outdatedCodes: null, error: true }

    if(outdatedCodes.length === 0)
        return { outdatedCodes: [], error: false }

    const { error: errorUpsert } = await supabase
        .from('codes_history')
        .upsert(outdatedCodes)

    if(errorUpsert)
        return { outdatedCodes: null, error: true }

    const { error: errorDelete } = await supabase
        .from('codes')
        .delete()
        .in('id', outdatedCodes.map((row) => row.id))

    if(errorDelete)
        return { outdatedCodes: null, error: true }

    return { outdatedCodes: outdatedCodes, error: false }
}

async function archiveOutdatedAttendances(supabase: SupabaseClient, outdatedCodes: Codes[]): Promise<{ error: boolean }> {

    if(!outdatedCodes)
        return { error: true }

    const { data: outdatedAttendances, error: errorSelect } = await supabase
        .from('attendances')
        .select('*')
        .in('code', outdatedCodes.map((row) => row.code))

    if(errorSelect)
        return { error: true }

    if(outdatedAttendances.length === 0)
        return { error: false }

    const { error: errorUpsert } = await supabase
        .from('attendances_history')
        .upsert(outdatedAttendances)

    if(errorUpsert)
        return { error: true }

    const { error: errorDelete } = await supabase
        .from('attendances')
        .delete()
        .in('id', outdatedAttendances.map((row) => row.id))

    if(errorDelete)
        return { error: true }

    return { error: false }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {

    if(req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`)
        return res.status(401).json({ message: 'Unauthorized' })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if(!supabaseUrl || !supabaseServiceRoleKey)
        return res.status(500).json({ message: 'Auto archive : missing environment variables' })

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { outdatedCodes, error: errorCodes } = await archiveOutdatedCodes(supabase)

    if(errorCodes)
        return res.status(500).json({ message: `There have been an error archiving the data.` })

    if(outdatedCodes?.length === 0)
        return res.status(202).json({ message: `There is no codes to be archived. The process terminated successfully.` })

    const { error: errorAttendances } = await archiveOutdatedAttendances(supabase, outdatedCodes as Codes[])

    if(errorAttendances)
        return res.status(500).json({ message: `There have been an error archiving the attendances. The codes have been archived successfully.` })

    res.status(201).json({ message: `The data have been archived successfully.` })
}
