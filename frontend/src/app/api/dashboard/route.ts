import { NextResponse } from 'next/server';

export async function GET() {
  // Simulating fetching real backend data from API Gateway / Python backend
  const data = {
    stats: {
      activeShifts: 4291,
      elevatedRisk: 12,
      violationsBlocked: 142,
      exposureAvoided: 840
    },
    sites: [
      { id: '1', name: 'Okhla Phase II Construction', zone: 'South East Delhi', tier: 3, status: 'Rest (Peak Heat)' },
      { id: '2', name: 'Dwarka Sector 21 Highway', zone: 'South West Delhi', tier: 2, status: 'Working (Modified)' },
      { id: '3', name: 'Rohini Metro Extension', zone: 'North West Delhi', tier: 1, status: 'Working (Normal)' },
      { id: '4', name: 'Saket District Park Renovation', zone: 'South Delhi', tier: 3, status: 'Rest (Peak Heat)' },
      { id: '5', name: 'Noida Link Road Repair', zone: 'East Delhi', tier: 2, status: 'Working (Modified)' },
    ],
    feed: [
      { time: '10:45 AM', type: 'alert', message: 'Cedar policy blocked unsafe shift assignment at Okhla Phase II' },
      { time: '10:30 AM', type: 'plan', message: 'AI Agent re-planned schedules for 4 sites in South East Delhi' },
      { time: '09:15 AM', type: 'confirm', message: 'Site Manager confirmed new schedule via Telegram (Dwarka)' },
      { time: '08:00 AM', type: 'plan', message: 'Daily planning complete: 12 sites shifted to early morning' },
    ]
  };

  return NextResponse.json(data);
}
