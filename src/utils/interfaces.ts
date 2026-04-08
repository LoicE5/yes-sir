export interface IpQualityScoreResponse {
    success: boolean,
    message: string,
    fraud_score: number,
    country_code: string,
    region: string,
    city: string,
    ISP: string,
    ASN: number,
    organization: string,
    is_crawler: boolean,
    timezone: string,
    mobile: boolean,
    host: string,
    proxy: boolean,
    vpn: boolean,
    tor: boolean,
    active_vpn: boolean,
    active_tor: boolean,
    recent_abuse: boolean,
    bot_status: boolean,
    connection_type: string,
    abuse_velocity: string,
    zip_code: string,
    latitude: number,
    longitude: number,
    request_id: string
}

export interface BaseResponse {
    message?:string
}

export interface MinimalRequest {
    headers: Record<string, string | string[] | undefined>
    socket?: { remoteAddress?: string }
}