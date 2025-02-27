import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { UnavailabilityError } from '@unimodules/core';

import * as TestUtils from '../TestUtils';

export const name = 'Calendar';

async function createTestCalendarAsync(patch = {}) {
  return await Calendar.createCalendarAsync({
    title: 'Expo test-suite calendar',
    color: '#4B968A',
    entityType: Calendar.EntityTypes.EVENT,
    name: 'expo-test-suite-calendar',
    sourceId: await pickCalendarSourceIdAsync(),
    source: {
      isLocalAccount: true,
      name: 'expo',
    },
    ownerAccount: 'expo',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
    ...patch,
  });
}

async function getCalendarByIdAsync(calendarId) {
  const calendars = await Calendar.getCalendarsAsync();
  return calendars.find(calendar => calendar.id === calendarId);
}

async function pickCalendarSourceIdAsync() {
  if (Platform.OS === 'ios') {
    const sources = await Calendar.getSourcesAsync();
    return sources && sources[0] && sources[0].id;
  }
}

async function createTestEventAsync(calendarId) {
  return await Calendar.createEventAsync(calendarId, {
    title: 'App.js Conference',
    startDate: +new Date(2019, 3, 4), // 4th April 2019, months are counted from 0
    endDate: +new Date(2019, 3, 5), // 5th April 2019
    allDay: true,
    location: 'Qubus Hotel, Nadwiślańska 6, 30-527 Kraków, Poland',
    notes: 'The very first Expo & React Native conference in Europe',
    availability: Calendar.Availability.BUSY,
  });
}

async function createTestAttendeeAsync(eventId) {
  return await Calendar.createAttendeeAsync(eventId, {
    name: 'Guest',
    email: 'guest@expo.io',
    role: Calendar.AttendeeRole.ATTENDEE,
    status: Calendar.AttendeeStatus.ACCEPTED,
    type: Calendar.AttendeeType.PERSON,
  });
}

async function getAttendeeByIdAsync(eventId, attendeeId) {
  const attendees = await Calendar.getAttendeesForEventAsync(eventId);
  return attendees.find(attendee => attendee.id === attendeeId);
}

async function createTestReminderAsync(calendarId) {
  return await Calendar.createReminderAsync(calendarId, {
    title: 'Reminder to buy a ticket',
    startDate: new Date(2019, 3, 3, 9, 0, 0),
    dueDate: new Date(2019, 3, 3, 23, 59, 59),
  });
}

export async function test(t) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  function testCalendarShape(calendar) {
    t.expect(calendar).toBeDefined();
    t.expect(typeof calendar.id).toBe('string');
    t.expect(typeof calendar.title).toBe('string');
    t.expect(typeof calendar.source).toBe('object');
    testCalendarSourceShape(calendar.source);
    t.expect(typeof calendar.color).toBe('string');
    t.expect(typeof calendar.allowsModifications).toBe('boolean');

    t.expect(Array.isArray(calendar.allowedAvailabilities)).toBe(true);
    calendar.allowedAvailabilities.forEach(availability => {
      t.expect(Object.values(Calendar.Availability)).toContain(availability);
    });

    if (Platform.OS === 'ios') {
      t.expect(typeof calendar.entityType).toBe('string');
      t.expect(Object.values(Calendar.EntityTypes)).toContain(calendar.entityType);

      t.expect(typeof calendar.type).toBe('string');
      t.expect(Object.values(Calendar.CalendarType)).toContain(calendar.type);
    }
    if (Platform.OS === 'android') {
      t.expect(typeof calendar.isPrimary).toBe('boolean');
      t.expect(typeof calendar.name).toBe('string');
      t.expect(typeof calendar.ownerAccount).toBe('string');
      calendar.timeZone && t.expect(typeof calendar.timeZone).toBe('string');

      t.expect(Array.isArray(calendar.allowedReminders)).toBe(true);
      calendar.allowedReminders.forEach(reminder => {
        t.expect(Object.values(Calendar.AlarmMethod)).toContain(reminder);
      });

      t.expect(Array.isArray(calendar.allowedAttendeeTypes)).toBe(true);
      calendar.allowedAttendeeTypes.forEach(attendeeType => {
        t.expect(Object.values(Calendar.AttendeeType)).toContain(attendeeType);
      });

      t.expect(typeof calendar.isVisible).toBe('boolean');
      t.expect(typeof calendar.isSynced).toBe('boolean');
      t.expect(typeof calendar.accessLevel).toBe('string');
    }
  }

  function testEventShape(event) {
    t.expect(event).toBeDefined();
    t.expect(typeof event.id).toBe('string');
    t.expect(typeof event.calendarId).toBe('string');
    t.expect(typeof event.title).toBe('string');
    t.expect(typeof event.startDate).toBe('string');
    t.expect(typeof event.endDate).toBe('string');
    t.expect(typeof event.allDay).toBe('boolean');
    t.expect(typeof event.location).toBe('string');
    t.expect(typeof event.notes).toBe('string');
    t.expect(Array.isArray(event.alarms)).toBe(true);
    event.recurrenceRule && t.expect(typeof event.recurrenceRule).toBe('object');
    t.expect(Object.values(Calendar.Availability)).toContain(event.availability);
    event.timeZone && t.expect(typeof event.timeZone).toBe('string');

    if (Platform.OS === 'ios') {
      event.url && t.expect(typeof event.url).toBe('string');
      t.expect(typeof event.creationDate).toBe('string');
      t.expect(typeof event.lastModifiedDate).toBe('string');
      t.expect(typeof event.originalStartDate).toBe('string');
      t.expect(typeof event.isDetached).toBe('boolean');
      t.expect(Object.values(Calendar.EventStatus)).toContain(event.status);

      if (event.organizer) {
        t.expect(typeof event.organizer).toBe('object');
        testAttendeeShape(event.organizer);
      }
    }
    if (Platform.OS === 'android') {
      t.expect(typeof event.endTimeZone).toBe('string');
      t.expect(typeof event.organizerEmail).toBe('string');
      t.expect(Object.values(Calendar.EventAccessLevel)).toContain(event.accessLevel);
      t.expect(typeof event.guestsCanModify).toBe('boolean');
      t.expect(typeof event.guestsCanInviteOthers).toBe('boolean');
      t.expect(typeof event.guestsCanSeeGuests).toBe('boolean');
      event.originalId && t.expect(typeof event.originalId).toBe('string');
      event.instanceId && t.expect(typeof event.instanceId).toBe('string');
    }
  }

  function testCalendarSourceShape(source) {
    t.expect(source).toBeDefined();
    t.expect(typeof source.name).toBe('string');
    t.expect(typeof source.type).toBe('string');

    if (Platform.OS === 'ios') {
      t.expect(typeof source.id).toBe('string');
    }
    if (Platform.OS === 'android') {
      t.expect(typeof source.isLocalAccount).toBe('boolean');
    }
  }

  function testAttendeeShape(attendee) {
    t.expect(attendee).toBeDefined();
    t.expect(typeof attendee.name).toBe('string');
    t.expect(typeof attendee.role).toBe('string');
    t.expect(Object.values(Calendar.AttendeeRole)).toContain(attendee.role);
    t.expect(typeof attendee.status).toBe('string');
    t.expect(Object.values(Calendar.AttendeeStatus)).toContain(attendee.status);
    t.expect(typeof attendee.type).toBe('string');
    t.expect(Object.values(Calendar.AttendeeType)).toContain(attendee.type);

    if (Platform.OS === 'ios') {
      t.expect(typeof attendee.url).toBe('string');
      t.expect(typeof attendee.isCurrentUser).toBe('boolean');
    }
    if (Platform.OS === 'android') {
      t.expect(typeof attendee.id).toBe('string');
      t.expect(typeof attendee.email).toBe('string');
    }
  }

  function testReminderShape(reminder) {
    t.expect(reminder).toBeDefined();
    t.expect(typeof reminder.id).toBe('string');
    t.expect(typeof reminder.calendarId).toBe('string');
    t.expect(typeof reminder.title).toBe('string');
    // t.expect(typeof reminder.startDate).toBe('string');
    // t.expect(typeof reminder.dueDate).toBe('string');
    t.expect(typeof reminder.completed).toBe('boolean');
  }

  function expectMethodsToReject(methods) {
    for (const methodName of methods) {
      t.describe(`${methodName}()`, () => {
        t.it('rejects with UnavailabilityError on unsupported platform', async () => {
          let error;
          try {
            await Calendar[methodName]();
          } catch (e) {
            error = e;
          }
          t.expect(error instanceof UnavailabilityError).toBe(true);
          t.expect(error.message).toBe(new UnavailabilityError('Calendar', methodName).message);
        });
      });
    }
  }

  describeWithPermissions('Calendar', () => {
    t.describe('requestCalendarPermissionsAsync()', () => {
      t.it('requests for Calendar permissions', async () => {
        const results = await Calendar.requestCalendarPermissionsAsync();

        t.expect(results.granted).toBe(true);
        t.expect(results.status).toBe('granted');
      });
    });

    t.describe('createCalendarAsync()', () => {
      let calendarId;

      t.it('creates a calendar', async () => {
        calendarId = await createTestCalendarAsync();
        const calendar = await getCalendarByIdAsync(calendarId);

        t.expect(calendarId).toBeDefined();
        t.expect(typeof calendarId).toBe('string');
        testCalendarShape(calendar);
      });

      t.afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    t.describe('getCalendarsAsync()', () => {
      let calendarId;

      t.beforeAll(async () => {
        calendarId = await createTestCalendarAsync();
      });

      t.it('returns an array of calendars with correct shape', async () => {
        const calendars = await Calendar.getCalendarsAsync();

        t.expect(Array.isArray(calendars)).toBeTruthy();

        for (const calendar of calendars) {
          testCalendarShape(calendar);
        }
      });

      t.afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    t.describe('deleteCalendarAsync()', () => {
      t.it('deletes a calendar', async () => {
        const calendarId = await createTestCalendarAsync();
        await Calendar.deleteCalendarAsync(calendarId);

        const calendars = await Calendar.getCalendarsAsync();
        t.expect(calendars.findIndex(calendar => calendar.id === calendarId)).toBe(-1);
      });
    });

    t.describe('updateCalendarAsync()', () => {
      let calendarId;

      t.beforeAll(async () => {
        calendarId = await createTestCalendarAsync();
      });

      t.it('updates a calendar', async () => {
        const newTitle = 'New test-suite calendar title';
        const updatedCalendarId = await Calendar.updateCalendarAsync(calendarId, {
          title: newTitle,
        });
        const updatedCalendar = await getCalendarByIdAsync(calendarId);

        t.expect(updatedCalendarId).toBe(calendarId);
        t.expect(updatedCalendar.title).toBe(newTitle);
      });

      t.afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    t.describe('createEventAsync()', () => {
      let calendarId;

      t.beforeAll(async () => {
        calendarId = await createTestCalendarAsync();
      });

      t.it('creates an event in the specific calendar', async () => {
        const eventId = await createTestEventAsync(calendarId);

        t.expect(eventId).toBeDefined();
        t.expect(typeof eventId).toBe('string');
      });

      t.afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    t.describe('getEventsAsync()', () => {
      let calendarId, eventId;

      t.beforeAll(async () => {
        calendarId = await createTestCalendarAsync();
        eventId = await createTestEventAsync(calendarId);
      });

      t.it('resolves to an array with an event of the correct shape', async () => {
        const events = await Calendar.getEventsAsync(
          [calendarId],
          +new Date(2019, 3, 1),
          +new Date(2019, 3, 29)
        );

        t.expect(Array.isArray(events)).toBe(true);
        t.expect(events.length).toBe(1);
        t.expect(events[0].id).toBe(eventId);
        testEventShape(events[0]);
      });

      t.afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    t.describe('getEventAsync()', () => {
      let calendarId, eventId;

      t.beforeAll(async () => {
        calendarId = await createTestCalendarAsync();
        eventId = await createTestEventAsync(calendarId);
      });

      t.it('returns event with given id', async () => {
        const event = await Calendar.getEventAsync(eventId);

        t.expect(event).toBeDefined();
        t.expect(event.id).toBe(eventId);
        testEventShape(event);
      });

      t.afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    t.describe('updateEventAsync()', () => {
      let calendarId, eventId;

      t.beforeAll(async () => {
        calendarId = await createTestCalendarAsync();
        eventId = await createTestEventAsync(calendarId);
      });

      t.it('updates an event', async () => {
        await Calendar.updateEventAsync(eventId, {
          availability: Calendar.Availability.FREE,
        });
        const updatedEvent = await Calendar.getEventAsync(eventId);

        t.expect(updatedEvent).toBeDefined();
        t.expect(updatedEvent.id).toBe(eventId);
        t.expect([Calendar.Availability.FREE, Calendar.Availability.NOT_SUPPORTED]).toContain(
          updatedEvent.availability
        );
      });

      t.afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    t.describe('deleteEventAsync()', () => {
      let calendarId, eventId;

      t.beforeAll(async () => {
        calendarId = await createTestCalendarAsync();
        eventId = await createTestEventAsync(calendarId);
      });

      t.it('deletes an event', async () => {
        await Calendar.deleteEventAsync(eventId);
        let error;

        try {
          await Calendar.getEventAsync(eventId);
        } catch (e) {
          error = e;
        }
        t.expect(error).toBeDefined();
        t.expect(error instanceof Error).toBe(true);
        t.expect(error.code).toBe('E_EVENT_NOT_FOUND');
      });

      t.afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    if (Platform.OS === 'android') {
      t.describe('createAttendeeAsync()', () => {
        let calendarId, eventId;

        t.beforeAll(async () => {
          calendarId = await createTestCalendarAsync();
          eventId = await createTestEventAsync(calendarId);
        });

        t.it('creates an attendee', async () => {
          const attendeeId = await createTestAttendeeAsync(eventId);
          const attendees = await Calendar.getAttendeesForEventAsync(eventId);

          t.expect(Array.isArray(attendees)).toBe(true);

          const newAttendee = attendees.find(attendee => attendee.id === attendeeId);

          t.expect(newAttendee).toBeDefined();
          testAttendeeShape(newAttendee);
        });

        t.afterAll(async () => {
          await Calendar.deleteCalendarAsync(calendarId);
        });
      });

      t.describe('updateAttendeeAsync()', () => {
        let calendarId, eventId, attendeeId;

        t.beforeAll(async () => {
          calendarId = await createTestCalendarAsync();
          eventId = await createTestEventAsync(calendarId);
          attendeeId = await createTestAttendeeAsync(eventId);
        });

        t.it('updates attendee record', async () => {
          const updatedAttendeeId = await Calendar.updateAttendeeAsync(attendeeId, {
            role: Calendar.AttendeeRole.PERFORMER,
          });
          const updatedAttendee = await getAttendeeByIdAsync(eventId, attendeeId);

          t.expect(updatedAttendeeId).toBe(attendeeId);
          t.expect(updatedAttendee).toBeDefined();
          t.expect(updatedAttendee.role).toBe(Calendar.AttendeeRole.PERFORMER);
        });

        t.afterAll(async () => {
          await Calendar.deleteCalendarAsync(calendarId);
        });
      });

      t.describe('deleteAttendeeAsync()', () => {
        let calendarId, eventId;

        t.beforeAll(async () => {
          calendarId = await createTestCalendarAsync();
          eventId = await createTestEventAsync(calendarId);
        });

        t.it('deletes an attendee', async () => {
          const attendeeId = await createTestAttendeeAsync(eventId);
          await Calendar.deleteAttendeeAsync(attendeeId);

          const attendee = await getAttendeeByIdAsync(eventId, attendeeId);

          t.expect(attendee).toBeUndefined();
        });

        t.afterAll(async () => {
          await Calendar.deleteCalendarAsync(calendarId);
        });
      });
    } else {
      expectMethodsToReject(['createAttendeeAsync', 'updateAttendeeAsync', 'deleteAttendeeAsync']);
    }

    if (Platform.OS === 'ios') {
      t.describe('getDefaultCalendarAsync()', () => {
        t.it('get default calendar', async () => {
          const calendar = await Calendar.getDefaultCalendarAsync();

          testCalendarShape(calendar);
        });
      });

      t.describe('requestRemindersPermissionsAsync()', () => {
        t.it('requests for Reminders permissions', async () => {
          const results = await Calendar.requestRemindersPermissionsAsync();

          t.expect(results.granted).toBe(true);
          t.expect(results.status).toBe('granted');
        });
      });

      t.describe('createReminderAsync()', () => {
        let calendarId;

        t.beforeAll(async () => {
          calendarId = await createTestCalendarAsync({
            entityType: Calendar.EntityTypes.REMINDER,
          });
        });

        t.it('creates a reminder', async () => {
          const reminderId = await createTestReminderAsync(calendarId);

          t.expect(reminderId).toBeDefined();
          t.expect(typeof reminderId).toBe('string');
        });

        t.afterAll(async () => {
          await Calendar.deleteCalendarAsync(calendarId);
        });
      });

      t.describe('getRemindersAsync()', () => {
        let calendarId, reminderId;

        t.beforeAll(async () => {
          calendarId = await createTestCalendarAsync({
            entityType: Calendar.EntityTypes.REMINDER,
          });
          reminderId = await createTestReminderAsync(calendarId);
        });

        t.it('returns an array of reminders', async () => {
          const reminders = await Calendar.getRemindersAsync(
            [calendarId],
            Calendar.ReminderStatus.INCOMPLETE,
            new Date(2019, 3, 2),
            new Date(2019, 3, 5)
          );

          t.expect(Array.isArray(reminders)).toBe(true);
          t.expect(reminders.length).toBe(1);
          t.expect(reminders[0].id).toBe(reminderId);
          testReminderShape(reminders[0]);
        });

        t.afterAll(async () => {
          await Calendar.deleteCalendarAsync(calendarId);
        });
      });

      t.describe('getReminderAsync()', () => {
        let calendarId, reminderId;

        t.beforeAll(async () => {
          calendarId = await createTestCalendarAsync({
            entityType: Calendar.EntityTypes.REMINDER,
          });
          reminderId = await createTestReminderAsync(calendarId);
        });

        t.it('returns an array of reminders', async () => {
          const reminder = await Calendar.getReminderAsync(reminderId);

          t.expect(reminder).toBeDefined();
          t.expect(reminder.id).toBe(reminderId);
          testReminderShape(reminder);
        });

        t.afterAll(async () => {
          await Calendar.deleteCalendarAsync(calendarId);
        });
      });

      t.describe('updateReminderAsync()', () => {
        let calendarId, reminderId;

        t.beforeAll(async () => {
          calendarId = await createTestCalendarAsync({
            entityType: Calendar.EntityTypes.REMINDER,
          });
          reminderId = await createTestReminderAsync(calendarId);
        });

        t.it('updates a reminder', async () => {
          const newUrl = 'https://appjs.co';
          const updatedReminderId = await Calendar.updateReminderAsync(reminderId, {
            url: newUrl,
          });
          const reminder = await Calendar.getReminderAsync(updatedReminderId);

          t.expect(updatedReminderId).toBe(reminderId);
          t.expect(reminder.url).toBe(newUrl);
        });

        t.afterAll(async () => {
          await Calendar.deleteCalendarAsync(calendarId);
        });
      });

      t.describe('deleteReminderAsync()', () => {
        let calendarId, reminderId;

        t.beforeAll(async () => {
          calendarId = await createTestCalendarAsync({
            entityType: Calendar.EntityTypes.REMINDER,
          });
          reminderId = await createTestReminderAsync(calendarId);
        });

        t.it('deletes a reminder', async () => {
          await Calendar.deleteReminderAsync(reminderId);
          let error;

          try {
            await Calendar.getReminderAsync(reminderId);
          } catch (e) {
            error = e;
          }
          t.expect(error).toBeDefined();
          t.expect(error instanceof Error).toBe(true);
          t.expect(error.code).toBe('E_REMINDER_NOT_FOUND');
        });

        t.afterAll(async () => {
          await Calendar.deleteCalendarAsync(calendarId);
        });
      });

      t.describe('getSourcesAsync()', () => {
        t.it('returns an array of sources', async () => {
          const sources = await Calendar.getSourcesAsync();

          t.expect(Array.isArray(sources)).toBe(true);
        });
      });
    } else {
      expectMethodsToReject([
        'requestRemindersPermissionsAsync',
        'getRemindersAsync',
        'getReminderAsync',
        'createReminderAsync',
        'updateReminderAsync',
        'deleteReminderAsync',
        'getSourcesAsync',
      ]);
    }
  });
}
