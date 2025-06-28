import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 翻訳キューの状態を確認（ステータスごとのカウント）
    const { data: queueData, error: queueError } = await supabase
      .from('translation_queue')
      .select('status')
    
    if (queueError) {
      console.error('Queue status error:', queueError)
    }
    
    // ステータスごとに集計
    const queueStatus = queueData?.reduce((acc: Record<string, number>, item) => {
      if (item.status) {
        acc[item.status] = (acc[item.status] || 0) + 1
      }
      return acc
    }, {}) || {}
    
    // 翻訳データの存在確認（言語ごとのカウント）
    const { data: translationsData, error: translationsError } = await supabase
      .from('listing_translations')
      .select('locale')
    
    if (translationsError) {
      console.error('Translations count error:', translationsError)
    }
    
    // 言語ごとに集計
    const translationsCount = translationsData?.reduce((acc: Record<string, number>, item) => {
      acc[item.locale] = (acc[item.locale] || 0) + 1
      return acc
    }, {}) || {}
    
    // 最新のキューアイテムを確認
    const { data: recentQueue, error: recentError } = await supabase
      .from('translation_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (recentError) {
      console.error('Recent queue error:', recentError)
    }
    
    // 最新の翻訳データを確認
    const { data: recentTranslations, error: recentTransError } = await supabase
      .from('listing_translations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (recentTransError) {
      console.error('Recent translations error:', recentTransError)
    }
    
    return NextResponse.json({
      queueStatus,
      translationsCount,
      recentQueue,
      recentTranslations
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch translation data' },
      { status: 500 }
    )
  }
}