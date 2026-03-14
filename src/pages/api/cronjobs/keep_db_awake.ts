import { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@supabase/supabase-js"

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {

    if(req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`)
        return res.status(401).json({ message: 'Unauthorized' })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if(!supabaseUrl || !supabaseServiceRoleKey)
        return res.status(500).json({ message: 'Keep DB awake : missing environment variables' })

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { error } = await supabase.from('codes_history').select('code').limit(1)

    if(error)
        return res.status(500).json({ message: `Keep DB awake : the cron job ran successfully, but the database returned an error` })

    return res.json({ message: `Keep DB awake : cron job successful` })
}
