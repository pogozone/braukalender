import React, { useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import de from 'date-fns/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'de': de,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CustomCalendar = ({ events, onEventClick, ...calendarProps }) => {
  const CustomToolbar = useCallback((toolbar) => {
    const { view, views } = toolbar;
    
    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" onClick={() => toolbar.onNavigate('PREV')}>Zurück</button>
          <button type="button" onClick={() => toolbar.onNavigate('TODAY')}>Heute</button>
          <button type="button" onClick={() => toolbar.onNavigate('NEXT')}>Weiter</button>
        </span>
        <span className="rbc-toolbar-label">{toolbar.label}</span>
        <span className="rbc-btn-group">
          {views.map((name) => (
            <button
              type="button"
              key={name}
              className={view === name ? 'rbc-active' : ''}
              onClick={() => toolbar.onView(name)}
            >
              {name === Views.MONTH ? 'Monat' :
               name === Views.WEEK ? 'Woche' :
               name === Views.DAY ? 'Tag' :
               name === Views.AGENDA ? 'Agenda' : name}
            </button>
          ))}
        </span>
      </div>
    );
  }, []);

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      views={{
        month: Views.MONTH,
        week: Views.WEEK,
        day: Views.DAY,
        agenda: Views.AGENDA
      }}
      defaultView={Views.MONTH}
      components={{
        toolbar: CustomToolbar
      }}
      onSelectEvent={onEventClick}
      messages={{
        next: "Weiter",
        previous: "Zurück",
        today: "Heute",
        month: "Monat",
        week: "Woche",
        day: "Tag",
        agenda: "Agenda",
        date: "Datum",
        time: "Zeit",
        event: "Termin",
        noEventsInRange: "Keine Termine in diesem Zeitraum"
      }}
      culture="de"
      {...calendarProps}
    />
  );
};

export default CustomCalendar;
