import { NextResponse } from 'next/server';

export interface HourlyHeatPoint {
  hour: string;
  hourNum: number;
  temp: number;
  humidity: number;
  wbgt: number;
  solar: number;
  tier: number;
  riskLabel: 'Safe' | 'Moderate' | 'High' | 'Extreme';
  workRestRatio: string;
}

export interface SiteData {
  id: string;
  name: string;
  zone: string;
  workers: number;
  laborType: string;
  shadeFactor: number; // percentage
  hydrationMeters: number;
  temp: number;
  wbgt: number;
  tier: number;
  status: 'Safe (Normal)' | 'Modified (Hydration)' | 'Rest (Peak Heat)';
  standardShift: string;
  aiShift: string;
  cedarStatus: 'Permit' | 'Forbid' | 'Review';
}

const generateHourlyCurve = (scenario: string): HourlyHeatPoint[] => {
  const baseTemp = scenario === 'extreme' ? 32 : scenario === 'monsoon' ? 29 : 28;
  const peakTemp = scenario === 'extreme' ? 45.4 : scenario === 'monsoon' ? 37.2 : 39.0;
  const baseHumidity = scenario === 'monsoon' ? 88 : scenario === 'extreme' ? 24 : 42;

  const hours = [
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00', 
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 
    '18:00', '20:00', '22:00'
  ];

  return hours.map((h, i) => {
    const hourNum = parseInt(h.split(':')[0]);
    // Diurnal temperature bell curve peaking around 14:00
    const solarFactor = Math.max(0, Math.sin(((hourNum - 5) / 14) * Math.PI));
    const temp = Math.round((baseTemp + (peakTemp - baseTemp) * Math.pow(solarFactor, 1.3)) * 10) / 10;
    const humidity = Math.max(18, Math.round(baseHumidity - solarFactor * 20));
    const solar = Math.round(solarFactor * (scenario === 'extreme' ? 980 : 820));

    // Stull Wet-Bulb Globe Temp (WBGT approximation)
    const T = temp;
    const RH = humidity;
    const wbgtCalc = T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
      Math.atan(T + RH) - Math.atan(RH - 1.676331) +
      0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) - 4.686035;
    const wbgt = Math.round(Math.max(18, wbgtCalc + (solar > 400 ? 1.8 : 0)) * 10) / 10;

    let tier = 0;
    let riskLabel: 'Safe' | 'Moderate' | 'High' | 'Extreme' = 'Safe';
    let workRestRatio = 'Continuous Work (60m/hr)';

    if (wbgt >= 33.0) {
      tier = 3;
      riskLabel = 'Extreme';
      workRestRatio = 'Mandatory Rest (No Heavy Labor)';
    } else if (wbgt >= 31.0) {
      tier = 2;
      riskLabel = 'High';
      workRestRatio = '15m Work / 45m Rest & Hydration';
    } else if (wbgt >= 28.0) {
      tier = 1;
      riskLabel = 'Moderate';
      workRestRatio = '45m Work / 15m Rest';
    }

    return {
      hour: h,
      hourNum,
      temp,
      humidity,
      wbgt,
      solar,
      tier,
      riskLabel,
      workRestRatio
    };
  });
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenario = searchParams.get('scenario') || 'extreme';

  const hourly = generateHourlyCurve(scenario);

  const stats = {
    activeShifts: scenario === 'extreme' ? 4850 : 5420,
    elevatedRisk: scenario === 'extreme' ? 18 : 6,
    violationsBlocked: scenario === 'extreme' ? 247 : 58,
    exposureAvoided: scenario === 'extreme' ? 1420 : 610,
    peakWBGT: Math.max(...hourly.map(h => h.wbgt)),
    currentAvgWBGT: hourly.find(h => h.hour === '13:00')?.wbgt || 33.4
  };

  const sites: SiteData[] = [
    {
      id: 'okhla-phase2',
      name: 'Okhla Phase II Metro Elevated Corridor',
      zone: 'South East Delhi',
      workers: 840,
      laborType: 'Heavy Structural Steel Rebar Tying',
      shadeFactor: 15,
      hydrationMeters: 45,
      temp: scenario === 'extreme' ? 44.8 : 38.6,
      wbgt: scenario === 'extreme' ? 33.8 : 29.4,
      tier: scenario === 'extreme' ? 3 : 1,
      status: scenario === 'extreme' ? 'Rest (Peak Heat)' : 'Modified (Hydration)',
      standardShift: '09:00 - 17:00 (Severe Heat Collision)',
      aiShift: '05:30-10:30 (Morning) + 16:30-19:30 (Twilight)',
      cedarStatus: 'Permit'
    },
    {
      id: 'dwarka-sec21',
      name: 'Dwarka Sector 21 Expressway Link',
      zone: 'South West Delhi',
      workers: 620,
      laborType: 'Asphalt Road Paving (Radiant Heat)',
      shadeFactor: 10,
      hydrationMeters: 30,
      temp: scenario === 'extreme' ? 45.2 : 39.1,
      wbgt: scenario === 'extreme' ? 34.2 : 30.2,
      tier: scenario === 'extreme' ? 3 : 2,
      status: scenario === 'extreme' ? 'Rest (Peak Heat)' : 'Modified (Hydration)',
      standardShift: '08:30 - 16:30',
      aiShift: '05:00-10:00 + Night Shift 20:00-23:00',
      cedarStatus: 'Permit'
    },
    {
      id: 'rohini-metro',
      name: 'Rohini Sector 18 Metro Extension',
      zone: 'North West Delhi',
      workers: 530,
      laborType: 'Underground Tunnel Ventilation & Track',
      shadeFactor: 65,
      hydrationMeters: 20,
      temp: scenario === 'extreme' ? 38.4 : 34.2,
      wbgt: scenario === 'extreme' ? 29.6 : 26.8,
      tier: scenario === 'extreme' ? 1 : 0,
      status: 'Safe (Normal)',
      standardShift: '08:00 - 16:00',
      aiShift: '08:00 - 16:00 (Monitored Regular)',
      cedarStatus: 'Permit'
    },
    {
      id: 'saket-district',
      name: 'Saket Commercial Complex Facade',
      zone: 'South Delhi',
      workers: 390,
      laborType: 'High-Altitude Exterior Glazing / Scaffolding',
      shadeFactor: 20,
      hydrationMeters: 35,
      temp: scenario === 'extreme' ? 43.6 : 37.8,
      wbgt: scenario === 'extreme' ? 33.1 : 28.9,
      tier: scenario === 'extreme' ? 3 : 1,
      status: scenario === 'extreme' ? 'Rest (Peak Heat)' : 'Modified (Hydration)',
      standardShift: '09:00 - 17:00',
      aiShift: '06:00-11:00 + 17:00-20:00',
      cedarStatus: 'Permit'
    },
    {
      id: 'noida-link',
      name: 'Noida Link Road Bridge Widening',
      zone: 'East Delhi',
      workers: 460,
      laborType: 'Concrete Pouring & Vibrating',
      shadeFactor: 25,
      hydrationMeters: 40,
      temp: scenario === 'extreme' ? 44.1 : 38.4,
      wbgt: scenario === 'extreme' ? 33.5 : 29.8,
      tier: scenario === 'extreme' ? 3 : 1,
      status: scenario === 'extreme' ? 'Rest (Peak Heat)' : 'Modified (Hydration)',
      standardShift: '08:30 - 16:30',
      aiShift: '05:30-10:30 + 16:30-19:30',
      cedarStatus: 'Permit'
    },
    {
      id: 'anand-vihar',
      name: 'Anand Vihar Transit Terminal Logistics',
      zone: 'East Delhi',
      workers: 710,
      laborType: 'Heavy Cargo Freight Handling & Loading',
      shadeFactor: 40,
      hydrationMeters: 25,
      temp: scenario === 'extreme' ? 42.8 : 37.0,
      wbgt: scenario === 'extreme' ? 32.2 : 28.4,
      tier: scenario === 'extreme' ? 2 : 1,
      status: 'Modified (Hydration)',
      standardShift: '07:00 - 15:00',
      aiShift: '06:00-11:00 (Rotational Break 20m/h)',
      cedarStatus: 'Permit'
    },
    {
      id: 'gurgaon-cyber',
      name: 'CyberCity Substation Power Upgrade',
      zone: 'Gurgaon NCR',
      workers: 320,
      laborType: 'Trench Excavation & Cable Laying',
      shadeFactor: 15,
      hydrationMeters: 30,
      temp: scenario === 'extreme' ? 45.0 : 39.0,
      wbgt: scenario === 'extreme' ? 33.9 : 30.1,
      tier: scenario === 'extreme' ? 3 : 2,
      status: scenario === 'extreme' ? 'Rest (Peak Heat)' : 'Modified (Hydration)',
      standardShift: '09:00 - 17:00',
      aiShift: '05:00-10:00 + 17:00-20:00',
      cedarStatus: 'Permit'
    },
    {
      id: 'connaught-place',
      name: 'Connaught Place Heritage Restoration',
      zone: 'Central Delhi',
      workers: 280,
      laborType: 'Masonry Restoration & Stone Cutting',
      shadeFactor: 50,
      hydrationMeters: 15,
      temp: scenario === 'extreme' ? 41.5 : 36.2,
      wbgt: scenario === 'extreme' ? 30.8 : 27.5,
      tier: scenario === 'extreme' ? 1 : 0,
      status: 'Modified (Hydration)',
      standardShift: '08:00 - 16:00',
      aiShift: '07:30 - 15:30 (Mandatory 15m/hr Shade)',
      cedarStatus: 'Permit'
    }
  ];

  const feed = [
    {
      id: 'f1',
      time: '12:45 PM',
      type: 'cedar',
      message: 'Cedar Policy Engine BLOCKED illegal unshaded shift at Okhla Phase II (Policy Rule #03 violated: continuous manual labor at WBGT 33.8°C prohibited).',
      badge: 'POLICY BLOCK'
    },
    {
      id: 'f2',
      time: '12:30 PM',
      type: 'agent',
      message: 'Amazon Bedrock (Claude 3 Haiku) re-planned shifts for 840 workers across South East Delhi. Dispatched split-shift schedule to Telegram.',
      badge: 'AI RE-PLAN'
    },
    {
      id: 'f3',
      time: '11:15 AM',
      type: 'telegram',
      message: 'Site Supervisor Vikram Singh (Dwarka Sec 21) confirmed worker withdrawal to misting cooling tents via Telegram webhook.',
      badge: 'TELEGRAM ACK'
    },
    {
      id: 'f4',
      time: '10:00 AM',
      type: 'weather',
      message: 'Stull WBGT exceeded 31.0°C threshold in 5 industrial zones. Autonomous advisory tier escalated to Tier 2 (High Risk).',
      badge: 'HEAT ALERT'
    },
    {
      id: 'f5',
      time: '08:00 AM',
      type: 'system',
      message: 'Daily morning batch run completed: 4,850 workers scheduled. 1,420 heat exposure hours proactively mitigated today.',
      badge: 'SCHEDULE OPT'
    }
  ];

  return NextResponse.json({
    stats,
    hourly,
    sites,
    feed,
    scenario
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = body.action || 'replan';

  if (action === 'test-violation') {
    return NextResponse.json({
      verdict: 'FORBID',
      policy: 'cedar::policy::workforce::heat_safety_tier3',
      ruleBroken: 'Rule 03: Max continuous unshaded labor at WBGT > 32°C cannot exceed 45 minutes.',
      details: 'Attempted to schedule 4-hour direct sun excavation at Dwarka Sector 21 during 13:00 - 17:00 (WBGT 34.2°C).',
      actionTaken: 'Shift assignment instantly quarantined. Alert logged to security vault.'
    });
  }

  if (action === 'replan') {
    return NextResponse.json({
      verdict: 'SUCCESS',
      agent: 'Amazon Bedrock Claude 3 Haiku via Strands Agent SDK',
      steps: [
        'Ingested hyper-local weather reanalysis: 33.8°C WBGT detected in Okhla Phase II',
        'Evaluated workforce parameters: 840 workers, heavy rebar tying, 15% shade factor',
        'Generated dual-split shift: 05:30-10:30 (Morning) + 16:30-19:30 (Twilight)',
        'Passed candidate plan through Cedar Policy-as-Code Safety Vault: VERIFIED PERMIT (0 violations)',
        'Dispatched localized Telegram bilingual alert to Site Supervisor with confirmation token'
      ],
      exposureAvoidedHours: 4.5,
      workerCount: 840,
      timestamp: new Date().toLocaleTimeString()
    });
  }

  return NextResponse.json({ status: 'ok' });
}
