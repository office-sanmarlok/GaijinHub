import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database, JoinedStation } from '@/types/supabase'

export const dynamic = 'force-dynamic'

type ListingRow = Database['public']['Tables']['listings']['Row']

interface ListingWithLocation extends Omit<ListingRow, 'station_id' | 'municipality_id'> {
  municipality?: {
    name: string
  } | null
  station?: JoinedStation | null
  station_id: string | null
  municipality_id: string | null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('station_id')
    const lineCode = searchParams.get('line_code')
    const municipalityId = searchParams.get('municipality_id')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = (page - 1) * limit

    const supabase = createRouteHandlerClient<Database>({ cookies })
    let query = supabase
      .from('listings')
      .select(`
        *,
        municipality:municipalities(
          name
        ),
        station:stations(
          name_kanji,
          lines:station_lines(
            line:lines(
              line_ja
            )
          )
        )
      `)
      .eq('has_location', true)

    // 検索条件の適用
    if (stationId) {
      query = query.eq('station_id', stationId)
    } else if (lineCode) {
      query = query.eq('station.lines.line.line_code', lineCode)
    } else if (municipalityId) {
      query = query.eq('municipality_id', municipalityId)
    } else {
      return NextResponse.json(
        { error: 'At least one location parameter is required' },
        { status: 400 }
      )
    }

    // ページネーション
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
      .limit(limit)

    if (error) throw error

    // 駅の路線情報を整形
    const formattedData = (data as unknown as ListingWithLocation[]).map(listing => ({
      ...listing,
      station: listing.station ? {
        ...listing.station,
        lines: listing.station.lines
          ? listing.station.lines.map(({ line }) => line)
          : null
      } : null
    }))

    return NextResponse.json({
      listings: formattedData,
      total: count || 0,
      page,
      limit
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 