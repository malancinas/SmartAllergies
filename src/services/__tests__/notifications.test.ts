import * as Notifications from 'expo-notifications';
import {
  isNightHour,
  meetsThreshold,
  buildThresholdContent,
  buildCustomContent,
  buildPersonalisedContent,
  rescheduleAlertSchedules,
} from '../notifications';
import type { AlertSchedule } from '@/stores/persistent/settingsStore';
import type { DailyRiskScore } from '@/features/forecasting/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const scheduleEveryDay: AlertSchedule = {
  id: 'test-morning',
  enabled: true,
  days: [0, 1, 2, 3, 4, 5, 6],
  hour: 8,
  minute: 0,
  type: 'threshold',
  threshold: 'medium',
  allergens: [],
};

const riskScoreMedium: DailyRiskScore = {
  date: '2026-05-01',
  score: 0.5,
  level: 'medium',
  pollenLevels: { tree: 'high', grass: 'medium', weed: 'low' },
};

const riskScoreHigh: DailyRiskScore = {
  date: '2026-05-01',
  score: 0.8,
  level: 'high',
  pollenLevels: { tree: 'very_high', grass: 'high', weed: 'medium' },
};

const riskScoreLow: DailyRiskScore = {
  date: '2026-05-01',
  score: 0.1,
  level: 'low',
  pollenLevels: { tree: 'none', grass: 'low', weed: 'none' },
};

const scheduleNotificationAsync = Notifications.scheduleNotificationAsync as jest.Mock;
const cancelAllScheduledNotificationsAsync =
  Notifications.cancelAllScheduledNotificationsAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── isNightHour ──────────────────────────────────────────────────────────────

describe('isNightHour', () => {
  it.each([
    [0, true],
    [1, true],
    [4, true],
    [5, false],
    [8, false],
    [12, false],
    [17, false],
    [18, true],
    [21, true],
    [23, true],
  ])('hour %i → %s', (hour, expected) => {
    expect(isNightHour(hour)).toBe(expected);
  });
});

// ─── meetsThreshold ───────────────────────────────────────────────────────────

describe('meetsThreshold', () => {
  it('medium threshold: low does not meet', () => {
    expect(meetsThreshold('low', 'medium')).toBe(false);
  });

  it('medium threshold: medium meets', () => {
    expect(meetsThreshold('medium', 'medium')).toBe(true);
  });

  it('medium threshold: high meets', () => {
    expect(meetsThreshold('high', 'medium')).toBe(true);
  });

  it('high threshold: low does not meet', () => {
    expect(meetsThreshold('low', 'high')).toBe(false);
  });

  it('high threshold: medium does not meet', () => {
    expect(meetsThreshold('medium', 'high')).toBe(false);
  });

  it('high threshold: high meets', () => {
    expect(meetsThreshold('high', 'high')).toBe(true);
  });
});

// ─── buildThresholdContent ────────────────────────────────────────────────────

describe('buildThresholdContent', () => {
  describe('day window (isNight=false)', () => {
    it('low → "Low pollen today"', () => {
      const c = buildThresholdContent('low', false);
      expect(c.title).toBe('Low pollen today');
      expect(c.body).toContain('good day to go outside');
    });

    it('medium → "Medium pollen risk today"', () => {
      const c = buildThresholdContent('medium', false);
      expect(c.title).toBe('Medium pollen risk today');
      expect(c.body).toContain('antihistamines');
    });

    it('high → "⚠️ High pollen risk today"', () => {
      const c = buildThresholdContent('high', false);
      expect(c.title).toBe('⚠️ High pollen risk today');
      expect(c.body).toContain('Stay indoors');
    });
  });

  describe('night window (isNight=true)', () => {
    it('low → "Tomorrow looks clear"', () => {
      const c = buildThresholdContent('low', true);
      expect(c.title).toBe('Tomorrow looks clear');
      expect(c.body).toContain('tomorrow');
    });

    it('medium → "Tomorrow: medium pollen"', () => {
      const c = buildThresholdContent('medium', true);
      expect(c.title).toBe('Tomorrow: medium pollen');
      expect(c.body).toContain('tomorrow');
    });

    it('high → "⚠️ High pollen tomorrow"', () => {
      const c = buildThresholdContent('high', true);
      expect(c.title).toBe('⚠️ High pollen tomorrow');
      expect(c.body).toContain('tomorrow');
    });
  });
});

// ─── buildCustomContent ───────────────────────────────────────────────────────

describe('buildCustomContent', () => {
  const levels = { tree: 'high' as const, grass: 'medium' as const, weed: 'low' as const };

  it('day window includes "today" in title', () => {
    const c = buildCustomContent(['grass'], levels, false);
    expect(c.title).toContain('today');
  });

  it('night window includes "tomorrow" in title', () => {
    const c = buildCustomContent(['grass'], levels, true);
    expect(c.title).toContain('tomorrow');
  });

  it('single allergen shows only that allergen', () => {
    const c = buildCustomContent(['grass'], levels, false);
    expect(c.body).toBe('Grass: medium');
  });

  it('two allergens shows both separated by ·', () => {
    const c = buildCustomContent(['tree', 'grass'], levels, false);
    expect(c.body).toBe('Tree: high · Grass: medium');
  });

  it('three allergens shows all three', () => {
    const c = buildCustomContent(['tree', 'grass', 'weed'], levels, false);
    expect(c.body).toBe('Tree: high · Grass: medium · Weed: low');
  });

  it('empty allergens list defaults to all three', () => {
    const c = buildCustomContent([], levels, false);
    expect(c.body).toContain('Tree');
    expect(c.body).toContain('Grass');
    expect(c.body).toContain('Weed');
  });

  it('very_high level renders as "very high" not "very_high"', () => {
    const c = buildCustomContent(['tree'], { tree: 'very_high', grass: 'low', weed: 'low' }, false);
    expect(c.body).toBe('Tree: very high');
    expect(c.body).not.toContain('very_high');
  });

  it('allergen names are capitalised', () => {
    const c = buildCustomContent(['weed'], levels, false);
    expect(c.body).toMatch(/^Weed:/);
  });
});

// ─── buildPersonalisedContent ─────────────────────────────────────────────────

describe('buildPersonalisedContent', () => {
  describe('low risk', () => {
    it('day: title says "today", body names primary trigger', () => {
      const c = buildPersonalisedContent('low', false, 'Grass pollen');
      expect(c.title).toContain('today');
      expect(c.body).toContain('grass pollen');
      expect(c.body).toContain('low today');
    });

    it('night: title says "tomorrow"', () => {
      const c = buildPersonalisedContent('low', true, 'Grass pollen');
      expect(c.title).toContain('tomorrow');
      expect(c.body).toContain('tomorrow');
    });

    it('aggravator is not mentioned for low risk', () => {
      const c = buildPersonalisedContent('low', false, 'Grass pollen', 'PM2.5');
      expect(c.body).not.toContain('PM2.5');
    });
  });

  describe('medium risk', () => {
    it('day without aggravator: plain moderate message', () => {
      const c = buildPersonalisedContent('medium', false, 'Tree pollen');
      expect(c.title).toContain('Moderate risk');
      expect(c.body).toContain('Tree pollen');
      expect(c.body).toContain('your main trigger');
    });

    it('day with aggravator: aggravator is included in body', () => {
      const c = buildPersonalisedContent('medium', false, 'Tree pollen', 'PM2.5');
      expect(c.title).toContain('Moderate risk');
      expect(c.body).toContain('PM2.5');
      expect(c.body).toContain('amplify your reaction');
    });

    it('night without aggravator: says "tomorrow"', () => {
      const c = buildPersonalisedContent('medium', true, 'Grass pollen');
      expect(c.title).toContain('tomorrow');
      expect(c.body).toContain('tomorrow');
    });

    it('night with aggravator: aggravator is NOT shown (night medium path ignores it)', () => {
      const c = buildPersonalisedContent('medium', true, 'Grass pollen', 'Ozone');
      expect(c.body).not.toContain('Ozone');
    });
  });

  describe('high risk', () => {
    it('day without aggravator: "High risk for you today"', () => {
      const c = buildPersonalisedContent('high', false, 'Weed pollen');
      expect(c.title).toBe('⚠️ High risk for you today');
      expect(c.body).toContain('Weed pollen');
      expect(c.body).toContain('antihistamines');
    });

    it('day with aggravator: "Tough allergy conditions" + aggravator', () => {
      const c = buildPersonalisedContent('high', false, 'Grass pollen', 'Ozone');
      expect(c.title).toBe('⚠️ Tough allergy conditions for you today');
      expect(c.body).toContain('Ozone');
      expect(c.body).toContain('take your medication early');
    });

    it('night without aggravator: "Tomorrow looks tough"', () => {
      const c = buildPersonalisedContent('high', true, 'Tree pollen');
      expect(c.title).toBe('⚠️ Tomorrow looks tough for you');
      expect(c.body).toContain('tomorrow');
      expect(c.body).toContain('Prepare your medication tonight');
    });

    it('night with aggravator: "Tomorrow could be a bad day"', () => {
      const c = buildPersonalisedContent('high', true, 'Grass pollen', 'PM2.5');
      expect(c.title).toBe('⚠️ Tomorrow could be a bad day for you');
      expect(c.body).toContain('PM2.5');
      expect(c.body).toContain('preparing tonight');
    });
  });
});

// ─── rescheduleAlertSchedules — suppression scenarios ────────────────────────

describe('rescheduleAlertSchedules — suppression', () => {
  const base = {
    schedules: [scheduleEveryDay],
    notificationsEnabled: true,
    todayData: riskScoreMedium,
    tomorrowData: riskScoreMedium,
    isPro: false,
  };

  it('cancels all notifications on every call', async () => {
    await rescheduleAlertSchedules({ ...base, notificationsEnabled: false });
    expect(cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  });

  it('schedules nothing when notificationsEnabled=false', async () => {
    await rescheduleAlertSchedules({ ...base, notificationsEnabled: false });
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules nothing when schedule.enabled=false', async () => {
    const s = { ...scheduleEveryDay, enabled: false };
    await rescheduleAlertSchedules({ ...base, schedules: [s] });
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules nothing when schedule.days=[]', async () => {
    const s = { ...scheduleEveryDay, days: [] };
    await rescheduleAlertSchedules({ ...base, schedules: [s] });
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules nothing when risk=low and threshold=medium', async () => {
    await rescheduleAlertSchedules({ ...base, todayData: riskScoreLow });
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules nothing when risk=medium and threshold=high', async () => {
    const s = { ...scheduleEveryDay, threshold: 'high' as const };
    await rescheduleAlertSchedules({ ...base, schedules: [s], todayData: riskScoreMedium });
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules nothing when todayData=null (day schedule)', async () => {
    await rescheduleAlertSchedules({ ...base, todayData: null });
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules nothing when tomorrowData=null (night schedule)', async () => {
    const nightSchedule = { ...scheduleEveryDay, hour: 20 };
    await rescheduleAlertSchedules({
      ...base,
      schedules: [nightSchedule],
      tomorrowData: null,
    });
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('skips custom schedule when pollenLevels is missing', async () => {
    const customSchedule: AlertSchedule = {
      ...scheduleEveryDay,
      type: 'custom',
      allergens: ['grass'],
    };
    const dataNoLevels: DailyRiskScore = { date: '2026-05-01', score: 0.5, level: 'medium' };
    await rescheduleAlertSchedules({
      ...base,
      isPro: true,
      schedules: [customSchedule],
      todayData: dataNoLevels,
    });
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

// ─── rescheduleAlertSchedules — scheduling volume ─────────────────────────────

describe('rescheduleAlertSchedules — notification count', () => {
  const base = {
    schedules: [scheduleEveryDay],
    notificationsEnabled: true,
    todayData: riskScoreMedium,
    tomorrowData: riskScoreMedium,
    isPro: false,
  };

  it('schedules one notification per day (7 for all-days schedule)', async () => {
    await rescheduleAlertSchedules(base);
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(7);
  });

  it('schedules only for selected days', async () => {
    const s = { ...scheduleEveryDay, days: [1, 3, 5] }; // Mon, Wed, Fri
    await rescheduleAlertSchedules({ ...base, schedules: [s] });
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(3);
  });

  it('schedules for each enabled schedule independently', async () => {
    const second = { ...scheduleEveryDay, id: 'evening', hour: 19 };
    await rescheduleAlertSchedules({
      ...base,
      schedules: [scheduleEveryDay, second],
      tomorrowData: riskScoreHigh,
    });
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(14);
  });
});

// ─── rescheduleAlertSchedules — notification identifier ───────────────────────

describe('rescheduleAlertSchedules — notification identifier', () => {
  it('uses "smart-alert-{id}-{day}" as identifier', async () => {
    const s = { ...scheduleEveryDay, id: 'my-schedule', days: [3] };
    await rescheduleAlertSchedules({
      schedules: [s],
      notificationsEnabled: true,
      todayData: riskScoreMedium,
      tomorrowData: riskScoreMedium,
      isPro: false,
    });
    expect(scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'smart-alert-my-schedule-3' }),
    );
  });
});

// ─── rescheduleAlertSchedules — Expo weekly trigger format ────────────────────

describe('rescheduleAlertSchedules — trigger format', () => {
  it('uses WEEKLY trigger with weekday offset by 1 (Expo: Sun=1)', async () => {
    const s = { ...scheduleEveryDay, days: [0], hour: 8, minute: 30 }; // Sun
    await rescheduleAlertSchedules({
      schedules: [s],
      notificationsEnabled: true,
      todayData: riskScoreMedium,
      tomorrowData: riskScoreMedium,
      isPro: false,
    });
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.trigger).toMatchObject({
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // 0 + 1
      hour: 8,
      minute: 30,
    });
  });

  it('Saturday (day=6) maps to weekday=7', async () => {
    const s = { ...scheduleEveryDay, days: [6] };
    await rescheduleAlertSchedules({
      schedules: [s],
      notificationsEnabled: true,
      todayData: riskScoreMedium,
      tomorrowData: riskScoreMedium,
      isPro: false,
    });
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.trigger.weekday).toBe(7);
  });
});

// ─── rescheduleAlertSchedules — time window routing ───────────────────────────

describe('rescheduleAlertSchedules — day vs night data routing', () => {
  it('hour=8 (day) uses todayData risk level for content', async () => {
    const s = { ...scheduleEveryDay, hour: 8, days: [0] };
    await rescheduleAlertSchedules({
      schedules: [s],
      notificationsEnabled: true,
      todayData: riskScoreHigh,
      tomorrowData: riskScoreLow, // low — should not affect content
      isPro: false,
    });
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.content.title).toContain('High pollen risk today');
  });

  it('hour=20 (night) uses tomorrowData risk level for content', async () => {
    const s = { ...scheduleEveryDay, hour: 20, days: [0] };
    await rescheduleAlertSchedules({
      schedules: [s],
      notificationsEnabled: true,
      todayData: riskScoreLow,    // low — should not affect content
      tomorrowData: riskScoreHigh,
      isPro: false,
    });
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.content.title).toContain('High pollen tomorrow');
  });

  it('hour=5 (day boundary) uses todayData', async () => {
    const s = { ...scheduleEveryDay, hour: 5, days: [0] };
    await rescheduleAlertSchedules({
      schedules: [s],
      notificationsEnabled: true,
      todayData: riskScoreMedium,
      tomorrowData: riskScoreHigh,
      isPro: false,
    });
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.content.title).toBe('Medium pollen risk today');
  });

  it('hour=18 (night boundary) uses tomorrowData', async () => {
    const s = { ...scheduleEveryDay, hour: 18, days: [0] };
    await rescheduleAlertSchedules({
      schedules: [s],
      notificationsEnabled: true,
      todayData: riskScoreLow,
      tomorrowData: riskScoreMedium,
      isPro: false,
    });
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.content.title).toBe('Tomorrow: medium pollen');
  });

  it('hour=0 (midnight) uses tomorrowData', async () => {
    const s = { ...scheduleEveryDay, hour: 0, days: [0] };
    await rescheduleAlertSchedules({
      schedules: [s],
      notificationsEnabled: true,
      todayData: riskScoreLow,
      tomorrowData: riskScoreHigh,
      isPro: false,
    });
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.content.title).toContain('High pollen tomorrow');
  });
});

// ─── rescheduleAlertSchedules — content path selection ────────────────────────

describe('rescheduleAlertSchedules — content path selection', () => {
  const base = {
    schedules: [{ ...scheduleEveryDay, days: [0] }],
    notificationsEnabled: true,
    todayData: riskScoreMedium,
    tomorrowData: riskScoreMedium,
  };

  it('free user gets threshold content', async () => {
    await rescheduleAlertSchedules({ ...base, isPro: false });
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.content.title).toBe('Medium pollen risk today');
  });

  it('pro user with threshold type and no ML profile gets threshold content', async () => {
    await rescheduleAlertSchedules({ ...base, isPro: true, allergyProfile: undefined });
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.content.title).toBe('Medium pollen risk today');
  });

  it('pro user with ML profile gets personalised content', async () => {
    await rescheduleAlertSchedules({
      ...base,
      isPro: true,
      allergyProfile: { phase: 2, primaryTrigger: 'Grass pollen' },
    });
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.content.title).toContain('Moderate risk');
    expect(call.content.body).toContain('Grass pollen');
  });

  it('pro user with ML profile and aggravator shows aggravator in body', async () => {
    await rescheduleAlertSchedules({
      ...base,
      isPro: true,
      allergyProfile: { phase: 2, primaryTrigger: 'Grass pollen', topAggravator: 'PM2.5' },
    });
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.content.body).toContain('PM2.5');
  });

  it('pro user with custom type gets per-allergen content', async () => {
    const customSchedule: AlertSchedule = {
      ...scheduleEveryDay,
      days: [0],
      type: 'custom',
      allergens: ['grass', 'tree'],
    };
    await rescheduleAlertSchedules({
      ...base,
      isPro: true,
      schedules: [customSchedule],
    });
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.content.title).toContain('Your allergen forecast');
    expect(call.content.body).toContain('Grass');
    expect(call.content.body).toContain('Tree');
  });

  it('pro user with custom type: free user cannot access custom path', async () => {
    const customSchedule: AlertSchedule = {
      ...scheduleEveryDay,
      days: [0],
      type: 'custom',
      allergens: ['grass'],
    };
    await rescheduleAlertSchedules({
      ...base,
      isPro: false,
      schedules: [customSchedule],
    });
    // Falls through to threshold content for free user
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.content.title).toBe('Medium pollen risk today');
  });

  it('notification data payload includes type and scheduleId', async () => {
    const s = { ...scheduleEveryDay, id: 'abc', days: [0] };
    await rescheduleAlertSchedules({ ...base, isPro: false, schedules: [s] });
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.content.data).toEqual({ type: 'smart_alert', scheduleId: 'abc' });
  });
});

// ─── rescheduleAlertSchedules — high threshold ────────────────────────────────

describe('rescheduleAlertSchedules — high threshold only fires on high', () => {
  const highThresholdSchedule: AlertSchedule = {
    ...scheduleEveryDay,
    days: [0],
    threshold: 'high',
  };

  it('does not fire for medium risk with high threshold', async () => {
    await rescheduleAlertSchedules({
      schedules: [highThresholdSchedule],
      notificationsEnabled: true,
      todayData: riskScoreMedium,
      tomorrowData: riskScoreMedium,
      isPro: false,
    });
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('fires for high risk with high threshold', async () => {
    await rescheduleAlertSchedules({
      schedules: [highThresholdSchedule],
      notificationsEnabled: true,
      todayData: riskScoreHigh,
      tomorrowData: riskScoreHigh,
      isPro: false,
    });
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(scheduleNotificationAsync.mock.calls[0][0].content.title).toContain('High pollen risk');
  });
});
